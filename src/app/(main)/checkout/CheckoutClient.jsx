"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/contexts/AuthContext";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
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

// --- 1. CHECKOUT FORM (For New Cards) ---
function CheckoutForm({ bookingData }) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setMessage("Payment provider not initialized.");
      return;
    }
    setIsLoading(true);

    // 1. Call submit() immediately on user click for validation
    const { error: submitError } = await elements.submit();

    if (submitError) {
      setMessage(submitError.message);
      setIsLoading(false);
      return;
    }

    try {
      // 2. Create Payment Method ID now that validation passed
      const { paymentMethod, error: createPmError } =
        await stripe.createPaymentMethod({
          elements,
        });

      if (createPmError) {
        setMessage(createPmError.message);
        setIsLoading(false);
        return;
      }

      // 3. Get Property ID (safe)
      const propId =
        bookingData.propertyId ||
        bookingData.property?.properties_id ||
        bookingData.property?.id;

      console.log("Property ID:", propId);
      console.log("Booking data:", bookingData);

      const billingDetails = paymentMethod.billing_details;
      if (!billingDetails?.address) {
        throw new Error("Billing address is required for booking.");
      }

      // 4. Create Booking in Supabase
      const bookingRes = await fetch("/api/user/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          property_id: propId,
          check_in_date: bookingData.checkIn,
          check_out_date: bookingData.checkOut,
          num_guests: bookingData.guests,
          total_price: bookingData.total,
          platform_revenue: bookingData.platformRevenue,
          billing_address_line1: "123 Tech Street",
          billing_city: "Phnom Penh",
          billing_country: "Cambodia",
          billing_postal_code: "12000",
        }),
      });

      // Check response before parsing
      if (!bookingRes.ok) {
        const errorData = await bookingRes.json();
        throw new Error(
          errorData.error || errorData.details || "Booking failed"
        );
      }

      const bookingJson = await bookingRes.json();
      const myBookingId = bookingJson.booking.id;

      // 5. Charge New Card on the Server (pass PM ID)
      const chargeRes = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          total: bookingData.total,
          bookingId: myBookingId,
        }),
      });

      const chargeJson = await chargeRes.json();

      // 6. Handle Server Response (3DS or Success)
      if (chargeJson.requiresAction && chargeJson.clientSecret) {
        // Final step for 3D Secure/Authentication
        const { error: confirmError } = await stripe.confirmCardPayment(
          chargeJson.clientSecret
        );
        if (confirmError) throw new Error(confirmError.message);

        router.push("/checkout?step=success");
      } else if (chargeJson.success) {
        router.push("/checkout?step=success");
      } else {
        throw new Error(chargeJson.error || "Payment failed.");
      }
    } catch (err) {
      console.error(err);
      setMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" />
      <button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-red-700 disabled:opacity-50"
      >
        <span id="button-text">
          {isLoading ? "Processing..." : "Confirm and Pay"}
        </span>
      </button>
      {message && (
        <div id="payment-message" className="text-red-500 text-sm">
          {message}
        </div>
      )}
    </form>
  );
}

// --- 2. STRIPE WRAPPER ---
function StripePaymentForm({ bookingData }) {
  const [clientSecret, setClientSecret] = useState("");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (bookingData?.total > 0) {
      // Fetch initial intent just to render the UI (no booking ID yet)
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
      <CheckoutForm bookingData={bookingData} />
    </Elements>
  );
}

// --- 3. MAIN PAGE COMPONENT ---
export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading, user, profile } = useAuth();
  const [bookingData, setBookingData] = useState(null);
  const step = searchParams.get("step") || "confirm-and-pay";
  const [savedCards, setSavedCards] = useState([]);
  const [useNewCard, setUseNewCard] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/register");
    }

    const data = sessionStorage.getItem("bookingData");
    if (!data) {
      if (step !== "success") router.push("/properties");
      return;
    }
    setBookingData(JSON.parse(data));
  }, [router, step, loading, user]);

  // Fetch saved cards
  useEffect(() => {
    if (user) {
      console.log("🔍 User session:", {
        userId: user.id,
        email: user.email,
      });

      fetch("/api/stripe/get-payment-methods")
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error("API Error:", data.error);
          }
          if (data.paymentMethods?.length > 0) {
            setSavedCards(data.paymentMethods);
            setSelectedCardId(data.paymentMethods[0].id);
            setUseNewCard(false);
          } else {
            setUseNewCard(true);
          }
        })
        .catch((err) => {
          console.error("Fetch error:", err);
          setUseNewCard(true);
        });
    }
  }, [user]);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // --- 4. SAVED CARD FLOW ---
  const handleSavedCardPayment = async () => {
    if (!selectedCardId) {
      console.error("No card selected.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const propId =
        bookingData.propertyId ||
        bookingData.property?.properties_id ||
        bookingData.property?.id;

      // A. Create Booking FIRST
      const bookingRes = await fetch("/api/user/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          property_id: propId,
          check_in_date: bookingData.checkIn,
          check_out_date: bookingData.checkOut,
          num_guests: bookingData.guests,
          total_price: bookingData.total,
          platform_revenue: bookingData.platformRevenue,
          billing_address_line1: bookingData.billingAddress?.line1 || "N/A",
          billing_city: bookingData.billingAddress?.city || "N/A",
          billing_country: bookingData.billingAddress?.country || "N/A",
          billing_postal_code: bookingData.billingAddress?.postal_code || "N/A",
        }),
      });

      if (!bookingRes.ok) {
        const errorData = await bookingRes.json();
        throw new Error(errorData.error || "Booking creation failed");
      }

      const bookingJson = await bookingRes.json();
      const myBookingId = bookingJson.booking.id;

      // B. Charge Saved Card
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodId: selectedCardId,
          total: bookingData.total,
          bookingId: myBookingId,
        }),
      });

      const paymentResult = await response.json();

      if (paymentResult.error) {
        setErrorMessage(paymentResult.error);
      } else {
        router.push("/checkout?step=success");
      }
    } catch (error) {
      console.error("An error occurred:", error);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 5. SUCCESS PAGE ---
  if (step === "success") {
    if (!bookingData) return <div>Loading success page...</div>;

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-600">
            Payment Successful!
          </h1>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-blue-600 underline"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (loading || !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // --- 6. CONFIRM AND PAY VIEW ---
  if (step === "confirm-and-pay") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 gap-24">
            {/* Left Side - Payment Form */}
            <div>
              <div className="border-b pb-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Log in or sign up
                </h2>
                <p className="text-sm text-gray-600">
                  Logged in as {profile?.full_name || user?.email || "User"}{" "}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Payment method</h2>

                {savedCards.length > 0 && !useNewCard ? (
                  <div className="space-y-4">
                    {savedCards.map((card) => (
                      <div
                        key={card.id}
                        className={`border rounded-lg p-4 flex justify-between items-center ${
                          selectedCardId === card.id
                            ? "border-red-600 ring-1 ring-red-600"
                            : ""
                        }`}
                      >
                        <div>
                          <p className="font-semibold">
                            •••• {card.card.last4}
                          </p>
                          <p className="text-sm text-gray-600">
                            Expires {card.card.exp_month}/{card.card.exp_year}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedCardId(card.id)}
                          disabled={selectedCardId === card.id}
                          className={`font-semibold ${
                            selectedCardId === card.id
                              ? "text-gray-500"
                              : "text-red-600"
                          }`}
                        >
                          {selectedCardId === card.id
                            ? "Selected"
                            : "Use this card"}
                        </button>
                      </div>
                    ))}

                    {selectedCardId && (
                      <button
                        type="button"
                        onClick={handleSavedCardPayment}
                        disabled={isLoading}
                        className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg mt-4 hover:bg-red-700 transition-colors"
                      >
                        {isLoading
                          ? "Processing..."
                          : `Confirm and Pay with •••• ${
                              savedCards.find((c) => c.id === selectedCardId)
                                ?.card.last4
                            }`}
                      </button>
                    )}
                    {errorMessage && (
                      <p className="text-red-500 mt-2">{errorMessage}</p>
                    )}

                    <button
                      onClick={() => setUseNewCard(true)}
                      className="text-sm text-gray-600 underline pt-2"
                    >
                      Add a new card
                    </button>
                  </div>
                ) : (
                  <>
                    {savedCards.length > 0 && (
                      <button
                        onClick={() => {
                          setUseNewCard(false);
                          setSelectedCardId(null);
                        }}
                        className="text-sm text-gray-600 underline mb-4"
                      >
                        ← Use saved card
                      </button>
                    )}
                    <StripePaymentForm bookingData={bookingData} />
                  </>
                )}
              </div>
            </div>

            {/* Right Side - Booking Summary */}
            <div>
              <div className="border rounded-xl p-6 sticky top-24 bg-white">
                <div className="flex gap-4 pb-6 border-b mb-6">
                  <div className="relative w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={bookingData.property.image}
                      alt={bookingData.property.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {bookingData.property.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {bookingData.property.location}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pb-6 border-b mb-6">
                  <div>
                    <div className="text-sm font-semibold mb-1">Dates</div>
                    <div className="text-sm text-gray-700">
                      {formatDate(bookingData.checkIn)} -{" "}
                      {formatDate(bookingData.checkOut)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-1">Guests</div>
                    <div className="text-sm text-gray-700">
                      {bookingData.guests} guest
                      {bookingData.guests > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pb-6 border-b mb-6">
                  <h3 className="font-semibold">Price Details</h3>
                  <div className="flex justify-between text-sm">
                    <span className="underline">
                      ${bookingData.property.pricePerNight} x{" "}
                      {bookingData.nights} nights
                    </span>
                    <span>${bookingData.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="underline">Cleaning fee</span>
                    <span>${bookingData.cleaningFee}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="underline">Service fee</span>
                    <span>${bookingData.serviceFee}</span>
                  </div>
                </div>

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total USD</span>
                  <span>${bookingData.total}</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">VAT 10% included</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
