"use client";
import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function PaymentManager() {
  const { t } = useTranslation();
  const [view, setView] = useState("list");
  const [savedMethods, setSavedMethods] = useState([]);
  const [activePaymentMethodId, setActivePaymentMethodId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);

  const fetchMethods = useCallback(() => {
    setIsLoading(true);
    fetch("/api/stripe/get-payment-methods")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error?.message || `API Error: ${res.statusText}`);
        }
        return data;
      })
      .then((data) => {
        if (data.paymentMethods) {
          setSavedMethods(data.paymentMethods);
          setActivePaymentMethodId(data.activePaymentMethodId || null);
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
    if (!confirm(t("payment.confirm_remove"))) {
      return;
    }

    setIsDeleting(paymentMethodId);
    try {
      const res = await fetch("/api/stripe/delete-payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to delete card.");
      }

      setSavedMethods((currentMethods) =>
        currentMethods.filter((method) => method.id !== paymentMethodId)
      );

      alert(t("payment.card_removed"));
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading && view === "list") {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-500 font-medium">{t("payment.loading_methods")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-3xl font-semibold mb-2">{t("payment.title")}</h1>
      <p className="text-gray-600 mb-6">
        {t("payment.subtitle")}
      </p>

      {/* --- VIEW 1: LIST CARDS --- */}
      {view === "list" && (
        <div className="border-t">
          <div className="flex justify-between items-center py-4">
            <h2 className="text-gray-500">{t("payment.payment_cards")}</h2>
            <button
              onClick={handleShowAddCard}
              className="font-medium text-red-600 hover:text-red-700"
            >
              {t("payment.add_card")}
            </button>
          </div>
          <div className="space-y-3 bg-white rounded-lg">
            {savedMethods.length > 0 ? (
              savedMethods.map((method) => {
                const isActiveCard = method.id === activePaymentMethodId;

                return (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg flex justify-between items-center ${
                      isActiveCard ? "border-green-500 bg-green-50/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {method.card.brand}
                          </span>
                          <span> •••• {method.card.last4}</span>
                          {isActiveCard && (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">
                              <Shield className="h-3 w-3" />
                              {t("payment.active_subscription")}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500 text-sm">
                          {t("payment.expires")} {method.card.exp_month}/{method.card.exp_year}
                        </span>
                      </div>
                    </div>

                    {isActiveCard ? (
                      <span className="text-xs text-gray-500 italic">
                        {t("payment.cannot_delete")}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDeleteCard(method.id)}
                        disabled={isDeleting === method.id}
                        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {isDeleting === method.id ? t("payment.deleting") : t("payment.delete")}
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 p-4">
                {t("payment.no_methods")}
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
        <div className="flex h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-gray-500 font-medium">{t("payment.loading_form")}</p>
      </div>
    </div>
      )}
    </div>
  );
}

// --- Inner Form Component ---
function AddCardForm({ onCancel, onSuccess }) {
  const { t } = useTranslation();
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
          {t("payment.cancel")}
        </button>
        <button
          disabled={isProcessing || !stripe || !elements}
          type="submit"
          className="bg-red-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {isProcessing ? t("payment.saving") : t("payment.save")}
        </button>
      </div>
      {message && <div className="text-red-500 mt-4">{message}</div>}
    </form>
  );
}
