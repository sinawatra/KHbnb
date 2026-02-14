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
import { useCurrency } from "@/components/contexts/CurrencyContext";
import { encryptData } from "@/lib/crypto";
import { useTranslation } from "react-i18next";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

// --- 1. CHECKOUT FORM (For New Cards) ---
function CheckoutForm({ bookingData }) {
  const { t } = useTranslation();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatDateForDB = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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
          check_in_date: formatDateForDB(bookingData.checkIn),
          check_out_date: formatDateForDB(bookingData.checkOut),
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

      // 5. Encrypt Payment Data
      const encryptedData = await encryptData(bookingData.total.toString());

      // 6. Charge New Card on the Server (pass PM ID)
      const chargeRes = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          total: bookingData.total,
          bookingId: myBookingId,
          encryptedPaymentData: encryptedData,
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
          {isLoading ? t("checkout.processing") : t("checkout.confirm_pay")}
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
  const { t } = useTranslation();
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
            console.error("Payment intent error:", data);
            setMessage(data.error || "Error loading payment form (no client secret).");
          }
        })
        .catch((err) => {
          console.error("Fetch error:", err);
          setMessage(`Error loading payment form: ${err.message}`);
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
        <p className="text-gray-500">{message || t("checkout.loading_payment")}</p>
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
  const { t } = useTranslation();
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
  const { convertPrice } = useCurrency();

  const formatDateForDB = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/register");
    }

    const data = sessionStorage.getItem("bookingData");
    if (!data) {
      if (step !== "success") router.push("/properties");
      return;
    }

    let parsedData = JSON.parse(data);

    // 1. Handle Dates & Nights
    const checkInDate = new Date(parsedData.checkIn);
    const checkOutDate = new Date(parsedData.checkOut);
    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);

    let nights = parsedData.nights;

    if (checkInDate.getTime() === checkOutDate.getTime()) {
      nights = 1;
      const nextDay = new Date(checkInDate);
      nextDay.setDate(nextDay.getDate() + 1);
      parsedData.checkOut = nextDay.toISOString();
    }
    parsedData.nights = nights;

    // 2. RECALCULATE PRICES
    const pricePerNight = Number(parsedData.property.pricePerNight) || 0;
    const cleaningFee = Number(parsedData.cleaningFee) || 0;
    const subtotal = pricePerNight * nights;
    const serviceFee = subtotal * 0.10;
    const total = subtotal + cleaningFee + serviceFee;

    parsedData.subtotal = subtotal;
    parsedData.serviceFee = serviceFee; 
    parsedData.platformRevenue = serviceFee;
    parsedData.total = total;

    setBookingData(parsedData);
  }, [router, step, loading, user]);

  // Fetch saved cards
  useEffect(() => {
    if (user) {
      fetch("/api/stripe/get-payment-methods")
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error?.message || `API Error: ${res.statusText}`);
          }
          return data;
        })
        .then((data) => {
          if (data.paymentMethods?.length > 0) {
            setSavedCards(data.paymentMethods);
            setSelectedCardId(data.paymentMethods[0].id);
            setUseNewCard(false);
          } else {
            setUseNewCard(true);
          }
        })
        .catch((err) => {
          console.error("Error fetching payment methods:", err);
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
          check_in_date: formatDateForDB(bookingData.checkIn),
          check_out_date: formatDateForDB(bookingData.checkOut),
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

      // B. Encrypt Payment Data
      const encryptedData = await encryptData(bookingData.total.toString());

      // C. Charge Saved Card
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodId: selectedCardId,
          total: bookingData.total,
          bookingId: myBookingId,
          encryptedPaymentData: encryptedData,
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
    if (!bookingData) return <div>{t("checkout.loading_success")}</div>;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("checkout.booking_confirmed")}
            </h1>
          </div>

          {/* Booking Details Card */}
          <div className="border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
            <h2 className="font-semibold text-lg text-gray-900 border-b pb-3">
              {t("checkout.booking_details")}
            </h2>

            {/* Property Info */}
            <div className="flex gap-4">
              {bookingData.property.image && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={bookingData.property.image}
                    alt={bookingData.property.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">
                  {bookingData.property.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {bookingData.property.location}
                </p>
                <p className="text-sm text-gray-600">
                  {t("checkout.hosted_by", { host: bookingData.property.host })}
                </p>
              </div>
            </div>

            {/* Date & Guests */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">{t("checkout.check_in")}</p>
                <p className="font-semibold">
                  {new Date(bookingData.checkIn).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("checkout.check_out")}</p>
                <p className="font-semibold">
                  {new Date(bookingData.checkOut).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("checkout.guests")}</p>
                <p className="font-semibold">
                  {bookingData.guests > 1 ? t("checkout.guest_plural", { count: bookingData.guests }) : t("checkout.guest", { count: bookingData.guests })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("checkout.nights")}</p>
                <p className="font-semibold">
                  {bookingData.nights > 1 ? t("checkout.night_plural", { count: bookingData.nights }) : t("checkout.night", { count: bookingData.nights })}
                </p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {t("checkout.price_per_night", { price: convertPrice(bookingData.property.pricePerNight), count: bookingData.nights })}
                </span>
                <span className="text-gray-900">{convertPrice(bookingData.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t("checkout.cleaning_fee")}</span>
                <span className="text-gray-900">
                  {convertPrice(bookingData.cleaningFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t("checkout.service_fee")}</span>
                <span className="text-gray-900">{convertPrice(bookingData.serviceFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>{t("checkout.total_paid")}</span>
                <span className="text-green-600">{convertPrice(bookingData.total)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/booking-history")}
              className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              {t("checkout.view_bookings")}
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              {t("checkout.return_home")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (loading || !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t("checkout.loading")}</div>
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
                  {t("checkout.log_in_signup")}
                </h2>
                <p className="text-sm text-gray-600">
                  {t("checkout.logged_in_as")}{" "}
                  {profile?.full_name || user?.email || "User"}{" "}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">{t("checkout.payment_method")}</h2>

                {savedCards.length > 0 && !useNewCard ? (
                  <div className="space-y-4">
                    {savedCards.map((card) => (
                      <div
                        key={card.id}
                        className={`border rounded-lg p-4 flex justify-between items-center ${selectedCardId === card.id
                            ? "border-red-600 ring-1 ring-red-600"
                            : ""
                          }`}
                      >
                        <div>
                          <p className="font-semibold">
                            •••• {card.card.last4}
                          </p>
                          <p className="text-sm text-gray-600">
                            {t("billing.expires")} {card.card.exp_month}/{card.card.exp_year}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedCardId(card.id)}
                          disabled={selectedCardId === card.id}
                          className={`font-semibold ${selectedCardId === card.id
                              ? "text-gray-500"
                              : "text-red-600"
                            }`}
                        >
                          {selectedCardId === card.id
                            ? t("checkout.selected")
                            : t("checkout.use_this_card")}
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
                          : `Confirm and Pay with •••• ${savedCards.find((c) => c.id === selectedCardId)
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
                      {convertPrice(bookingData.property.pricePerNight)} x{" "}
                      {bookingData.nights} nights
                    </span>
                    <span>{convertPrice(bookingData.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="underline">Cleaning fee</span>
                    <span>{convertPrice(bookingData.cleaningFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="underline">Service fee</span>
                    <span>{convertPrice(bookingData.serviceFee)}</span>
                  </div>
                </div>

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total USD</span>
                  <span>{convertPrice(bookingData.total)}</span>
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
