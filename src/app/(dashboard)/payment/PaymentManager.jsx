"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function PaymentManager() {
  const [view, setView] = useState("list");
  const [savedMethods, setSavedMethods] = useState([]);
  const [clientSecret, setClientSecret] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);


  const fetchMethods = useCallback(() => {
    setIsLoading(true);
    fetch("/api/stripe/get-payment-methods")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API Error: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.paymentMethods) {
          setSavedMethods(data.paymentMethods);
        } else {
          console.error("API response missing paymentMethods:", data);
          setSavedMethods([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching payment methods:", error);
        setSavedMethods([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const handleShowAddCard = async () => {
    setView("loading");
    try {
      const res = await fetch("/api/stripe/add-payment-methods", {
        method: "POST",
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setView("add");
      } else {
        console.error("Failed to get client secret:", data.error);
        setView("list");
      }
    } catch (error) {
      console.error("Error creating setup intent:", error);
      setView("list");
    }
  };

  const handleCancel = () => {
    setClientSecret(null);
    setView("list");
  };

  const onSaveSuccess = () => {
    setClientSecret(null);
    setView("list");
    fetchMethods();
  };

  const handleDeleteCard = async (paymentMethodId) => {
    if (!confirm("Are you sure you want to remove this payment method?")) {
      return;
    }

    setIsDeleting(paymentMethodId);
    try {
      const res = await fetch("/api/stripe/delete-payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete card.");
      }

      // On success, update the UI by filtering out the deleted card
      setSavedMethods((currentMethods) =>
        currentMethods.filter((method) => method.id !== paymentMethodId)
      );
    } catch (error) {
      console.error(error);
      alert("Error deleting card. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading && view === "list") {
    return <div className="max-w-xl mx-auto p-8">Loading methods...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-3xl font-semibold mb-2">Payment Methods</h1>
      <p className="text-gray-600 mb-6">
        Securely add or remove payment methods to make it easier when you book.
      </p>

      {/* --- VIEW 1: LIST CARDS --- */}
      {view === "list" && (
        <div className="border-t">
          <div className="flex justify-between items-center py-4">
            <h2 className="text-gray-500">Payment cards</h2>
            <button
              onClick={handleShowAddCard}
              className="font-medium text-red-600 hover:text-red-700"
            >
              Add Card
            </button>
          </div>
          <div className="space-y-3">
            {savedMethods.length > 0 ? (
              savedMethods.map((method) => (
                <div
                  key={method.id}
                  className="p-4 border rounded-lg flex justify-between"
                >
                  <div>
                    <span className="font-medium capitalize">
                      {method.card.brand}
                    </span>
                    <span> •••• {method.card.last4}</span>
                  </div>
                  <span className="text-gray-500">
                    Expires {method.card.exp_month}/{method.card.exp_year}
                  </span>
                  <button
                    onClick={() => handleDeleteCard(method.id)}
                    disabled={isDeleting === method.id}
                    className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {isDeleting === method.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 py-4">
                You have no saved payment methods.
              </p>
            )}
          </div>
        </div>
      )}

      {/* --- VIEW 2: ADD CARD FORM --- */}
      {view === "add" && clientSecret && (
        <div className="border-t pt-4">
          <Elements
            options={{ clientSecret, appearance: { theme: "stripe" } }}
            stripe={stripePromise}
          >
            <AddCardForm onCancel={handleCancel} onSuccess={onSaveSuccess} />
          </Elements>
        </div>
      )}

      {view === "loading" && (
        <div className="border-t pt-4">Loading form...</div>
      )}
    </div>
  );
}

// --- Inner Form Component ---
function AddCardForm({ onCancel, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setIsProcessing(true);

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setMessage(error.message);
      setIsProcessing(false);
    } else if (setupIntent && setupIntent.status === "succeeded") {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="font-medium text-gray-700"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          disabled={isProcessing || !stripe || !elements}
          type="submit"
          className="bg-red-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {isProcessing ? "Saving..." : "Save"}
        </button>
      </div>
      {message && <div className="text-red-500 mt-4">{message}</div>}
    </form>
  );
}
