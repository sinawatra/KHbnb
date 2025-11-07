import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const {
      total,
      paymentMethodId,
      customerId,
    } = await request.json();

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: "Invalid total amount" },
        { status: 400 }
      );
    }

    const amountInCents = Math.round(total * 100);

    if (paymentMethodId && customerId) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "usd",
          customer: customerId,
          payment_method: paymentMethodId,
          confirm: true,
          off_session: true,
          error_on_requires_action: true,
        });

        return NextResponse.json({
          success: true,
          paymentIntentId: paymentIntent.id,
        });
      } catch (err) {
        if (err.code === "card_declined" || err.code === "card_error") {
          return NextResponse.json(
            { error: "Your card was declined." },
            { status: 400 }
          );
        }
        console.error("Stripe Error (Saved Card):", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }

    else {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    }
  } catch (error) {
    console.error("General Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
