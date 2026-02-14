import { stripe } from "./stripe";

/**
 * Ensures a valid Stripe customer exists for the user.
 * If the customer ID in the profile is invalid or missing, it creates a new one.
 * 
 * @param {object} supabase - The Supabase client
 * @param {object} user - The auth user object
 * @param {object} profile - The user profile object from the 'users' table
 * @returns {Promise<string>} The valid Stripe customer ID
 */
export async function getOrCreateStripeCustomer(supabase, user, profile) {
  let customerId = profile?.stripe_customer_id;

  if (customerId) {
    try {
      // Check if customer exists in Stripe
      await stripe.customers.retrieve(customerId);
      return customerId;
    } catch (err) {
      // If customer doesn't exist, we'll create a new one
      if (err.code !== 'resource_missing' && !err.message.includes('No such customer')) {
        throw err;
      }
      console.warn(`Stripe customer ${customerId} not found. Recreating...`);
    }
  }

  // Create new customer
  const newCustomer = await stripe.customers.create({
    email: user.email,
    name: profile?.full_name || user.user_metadata?.full_name || user.email,
    metadata: {
      supabase_user_id: user.id,
    },
  });

  // Update database with new customer ID
  const { error: updateError } = await supabase
    .from("users")
    .update({ stripe_customer_id: newCustomer.id })
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Failed to update user with new Stripe customer ID:", updateError);
    // We still return the new customer ID so the current operation can proceed
  }

  return newCustomer.id;
}
