import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { priceId, paymentMethodId } = await request.json();

    if (!priceId || !paymentMethodId) {
      throw new Error("Price ID and Payment Method ID are required.");
    }

    // --- 1. Authenticate user ---
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // --- 2. Get user's Stripe Customer ID ---
    const { data: profile, error } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (error || !profile || !profile.stripe_customer_id) {
      console.error(
        "Stripe customer ID not found for user:",
        session.user.id,
        error
      );
      throw new Error("Stripe customer ID not found.");
    }
    const customerId = profile.stripe_customer_id;

    // A. Check Stripe directly for active subscriptions
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // B. If Stripe says they are subscribed...
    if (stripeSubscriptions.data.length > 0) {
      const activeSub = stripeSubscriptions.data[0];

      // C. Check if Supabase knows about this
      const { data: localSub } = await supabaseAdmin
        .from("user_subscriptions")
        .select("user_subscriptions_id, status")
        .eq("stripe_subscription_id", activeSub.id)
        .single();

      // D. "Self-Healing": If Supabase is missing data, fix it now.
      if (!localSub || localSub.status !== "active") {
        console.log("Desync detected. Syncing Supabase with Stripe...");
        console.log(
          "Stripe Subscription Object:",
          JSON.stringify(activeSub, null, 2)
        );

        const currentPriceId = activeSub.items.data[0].price.id;

        const getSafeDate = (obj) => {
          if (obj.current_period_start)
            return new Date(obj.current_period_start * 1000).toISOString();
          if (obj.current_period_end)
            return new Date(obj.current_period_end * 1000).toISOString();

          const item = obj.items?.data[0];
          if (item?.current_period_start)
            return new Date(item.current_period_start * 1000).toISOString();

          // Fallback
          return new Date().toISOString();
        };

        const startDate = activeSub.current_period_start
          ? new Date(activeSub.current_period_start * 1000).toISOString()
          : new Date(
              activeSub.items.data[0].current_period_start * 1000
            ).toISOString();

        const endDate = activeSub.current_period_end
          ? new Date(activeSub.current_period_end * 1000).toISOString()
          : new Date(
              activeSub.items.data[0].current_period_end * 1000
            ).toISOString();

        const { data: plan } = await supabaseAdmin
          .from("subscription_plans")
          .select("subscription_plans_id")
          .eq("stripe_price_id", currentPriceId)
          .single();

        if (plan) {
          const { error: upsertError } = await supabaseAdmin
            .from("user_subscriptions")
            .upsert(
              {
                user_id: user.id,
                subscription_plans_id: plan.subscription_plans_id,
                stripe_subscription_id: activeSub.id,
                start_date: startDate,
                end_date: endDate,
                status: "active",
              },
              { onConflict: "stripe_subscription_id" }
            );

          if (upsertError) {
            console.error("Supabase Upsert Error:", upsertError);
          } else {
            console.log("Supabase synced successfully.");
          }
        } else {
          console.error(
            "Could not sync: Plan not found in DB for price",
            currentPriceId
          );
        }
      }

      // E. BLOCK the new subscription
      return NextResponse.json(
        { error: { message: "You already have an active subscription." } },
        { status: 400 }
      );
    }

    // --- 3. Attach the new payment method to the customer ---
    // This links the card to the customer in Stripe
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // --- 4. Set this new card as the customer's default ---
    // This tells Stripe to use this card for all future subscription invoices
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // --- 5. Create the subscription ---
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      expand: ["latest_invoice.payment_intent"],
      metadata: { user_id: user.id },
    });

    // --- 6. Check payment status ---
    const invoice = subscription.latest_invoice;
    const paymentIntent = invoice?.payment_intent;

    // If payment requires action (3D Secure)
    if (paymentIntent?.status === "requires_action") {
      return NextResponse.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
      });
    }

    // If payment failed
    if (paymentIntent?.status === "requires_payment_method") {
      return NextResponse.json(
        { error: { message: "Payment failed. Please try a different card." } },
        { status: 400 }
      );
    }

    // Payment succeeded - subscription should become active shortly
    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error("Error creating subscription:", error.message);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }
}
