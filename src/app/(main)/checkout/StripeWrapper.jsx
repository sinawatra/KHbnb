"use client";
import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function StripeWrapper({ children, bookingData }) {
  const [clientSecret, setClientSecret] = useState("");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (bookingData?.total > 0) {
      fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total: bookingData.total }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            setMessage("Error loading payment form.");
          }
        })
        .catch(() => {
          setMessage("Error loading payment form.");
        });
    }
  }, [bookingData]);

  const options = {
    clientSecret,
    appearance: { theme: "stripe", labels: "floating" },
    paymentMethodCreation: "manual",
  };

  if (!clientSecret) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">{message || "Loading payment form..."}</p>
      </div>
    );
  }

  return (
    <Elements options={options} stripe={stripePromise}>
      {children}
    </Elements>
  );
}
