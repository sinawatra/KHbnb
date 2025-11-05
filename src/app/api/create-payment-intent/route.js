// src/app/api/create-payment-intent/route.js

import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { total } = await request.json();

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: "Invalid total amount" },
        { status: 400 }
      );
    }

    // Stripe requires the amount in the smallest currency unit (e.g., cents)
    const amountInCents = Math.round(total * 100);

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd", // Or any currency you support
      automatic_payment_methods: {
        enabled: true, // This allows Stripe to show methods like Apple Pay, Google Pay, etc.
      },
    });

    // Send the client secret back to the frontend
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
