"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/contexts/AuthContext";
import CheckoutProgressBar from "@/components/CheckoutProgressBar";
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

const STEPS_CONFIG = [
  { id: 1, route: "confirm-and-pay" },
  { id: 2, route: "payment" },
  { id: 3, route: "review" },
];

function getStepIdFromRoute(route) {
  const step = STEPS_CONFIG.find((s) => s.route === route);
  if (step) {
    return step.id;
  }
  return 1;
}

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout?step=success`,
      },
    });
    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message);
    } else {
      setMessage("An unexpected error occurred.");
    }
    setIsLoading(false);
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

function StripePaymentForm({ bookingTotal }) {
  const [clientSecret, setClientSecret] = useState("");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (bookingTotal > 0) {
      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total: bookingTotal }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            setMessage("Error loading payment form. Please refresh.");
          }
        })
        .catch(() => {
          setMessage("Error loading payment form. Please refresh.");
        });
    }
  }, [bookingTotal]);

  const options = {
    clientSecret,
    appearance: { theme: "stripe", labels: "floating" },
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
      <CheckoutForm />
    </Elements>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading } = useAuth();
  const [bookingData, setBookingData] = useState(null);
  const step = searchParams.get("step") || "confirm-and-pay";
  const [completedSteps, setCompletedSteps] = useState(["login"]);
  const currentRoute = searchParams.get("step");
  const currentStepNumber = getStepIdFromRoute(currentRoute);

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (!data) {
      if (step !== "success") {
        router.push("/properties");
      }
      return;
    }
    setBookingData(JSON.parse(data));
  }, [router, step]);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (step === "success") {
    if (!bookingData) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Loading success page...</div>
        </div>
      );
    }

    const orderId =
      typeof window !== "undefined" ? sessionStorage.getItem("orderId") : null;
    const invoiceNumber =
      typeof window !== "undefined"
        ? sessionStorage.getItem("invoiceNumber")
        : null;
    const invoiceDate =
      typeof window !== "undefined"
        ? sessionStorage.getItem("invoiceDate")
        : null;

    const formatInvoiceDate = (isoString) => {
      if (!isoString) return "";
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const handlePrint = () => {
      window.print();
    };

    const TAX_RATE = 0.1;
    const calculatedSubtotal =
      bookingData.subtotal + bookingData.cleaningFee + bookingData.serviceFee;
    const calculatedTax = calculatedSubtotal * TAX_RATE;
    const grandTotal = calculatedSubtotal + calculatedTax;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header - hide on print */}
        <div className="border-b bg-white print:hidden">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Print Invoice
            </button>
          </div>
        </div>

        {/* Invoice */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-lg shadow-sm p-12 print:shadow-none">
            {/* Header Info - TOP SECTION */}
            <div className="flex justify-between items-start mb-8">
              {/* Left - Business Info */}
              <div>
                <h1 className="text-2xl font-bold mb-2">Alvish Baldha</h1>
                <p className="text-sm text-gray-600">www.website.com</p>
                <p className="text-sm text-gray-600">hello@email.com</p>
                <p className="text-sm text-gray-600">+91 00000 00000</p>
              </div>

              {/* Right - Business Address & Total Invoice Value */}
              <div className="text-right">
                <p className="text-sm text-gray-600">Business address</p>
                <p className="text-sm text-gray-600">
                  City, State, IN - 000 000
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  TAX ID 00XXXXX1234XOXX
                </p>
                {/* Invoice of (USD) - Moved here */}
                <p className="text-xs text-gray-500 mb-1">Invoice of (USD)</p>
                <p className="text-4xl font-bold text-orange-500">
                  ${grandTotal.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Invoice Details Grid - MIDDLE SECTION */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 border-t pt-8">
              {/* Billed to */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Billed to,</p>
                <p className="font-semibold">In Empiseyocheata</p>
                <p className="text-sm text-gray-600">Business address</p>
                <p className="text-sm text-gray-600">City, Country - 00000</p>
                <p className="text-sm text-gray-600">+0 (000) 123-4567</p>
              </div>

              {/* Invoice details, Invoice date, Due date */}
              <div className="text-right">
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">Invoice number</p>
                  <p className="font-semibold">
                    {invoiceNumber || "#AB2234-01"}
                  </p>
                </div>
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">Reference</p>
                  <p className="font-semibold">INV-057</p>
                </div>
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">Invoice date</p>
                  <p className="font-semibold">
                    {formatInvoiceDate(invoiceDate || new Date().toISOString())}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Due date</p>
                  <p className="font-semibold">
                    {formatInvoiceDate(
                      new Date(
                        new Date().setDate(new Date().getDate() + 15)
                      ).toISOString()
                    )}{" "}
                    {/* Example: 15 days from now */}
                  </p>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="mb-8 border-t pt-8">
              <p className="text-xs text-gray-500 mb-1">Subject</p>
              <p className="font-semibold">Hotel booking</p>
            </div>

            {/* Invoice Table */}
            <div className="mb-8">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="pb-3 font-medium uppercase w-1/3">
                      Item detail
                    </th>{" "}
                    {/* Adjusted width */}
                    <th className="pb-3 font-medium uppercase text-center">
                      Date
                    </th>
                    <th className="pb-3 font-medium uppercase text-center">
                      Guest
                    </th>
                    <th className="pb-3 font-medium uppercase text-right">
                      Rate
                    </th>
                    <th className="pb-3 font-medium uppercase text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="border-b">
                  <tr className="border-b">
                    <td className="py-4">
                      <p className="font-semibold">
                        {bookingData.property.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        Villa in {bookingData.property.location}
                      </p>
                    </td>
                    <td className="py-4 text-center">
                      <p className="text-sm">
                        {formatDate(bookingData.checkIn).replace(/,/g, "")} -{" "}
                        {formatDate(bookingData.checkOut).replace(/,/g, "")}
                      </p>
                    </td>
                    <td className="py-4 text-center">
                      <p className="text-sm">{bookingData.guests}</p>
                    </td>
                    <td className="py-4 text-right">
                      <p className="text-sm">
                        ${bookingData.property.pricePerNight.toFixed(2)}
                      </p>
                    </td>
                    <td className="py-4 text-right">
                      <p className="text-sm font-semibold">
                        ${bookingData.subtotal.toFixed(2)}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mt-6">
                <div className="w-64">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm text-gray-600">
                      ${calculatedSubtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-4 pb-4 border-b">
                    <span className="text-sm text-gray-600">Tax (10%)</span>
                    <span className="text-sm text-gray-600">
                      ${calculatedTax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t">
              <p className="text-sm font-semibold mb-2">
                Thanks for the business.
              </p>
              <div className="mt-6">
                <p className="text-xs text-gray-500 mb-1">Terms & Conditions</p>
                <p className="text-xs text-gray-600">
                  Please pay within 15 days of receiving this invoice.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Print styles */}
        <style jsx global>{`
          @media print {
            body {
              background: white;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:shadow-none {
              box-shadow: none !important;
            }
          }
        `}</style>
      </div>
    );
  }

  // HANDLE LOADING STATE (for non-success steps)
  if (loading || !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // HANDLE "CONFIRM AND PAY" STEP
  if (step === "confirm-and-pay") {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b bg-white">
          <CheckoutProgressBar
            currentStep={currentStepNumber}
            completedSteps={completedSteps}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 gap-24">
            {/* Left Side - Payment Form */}
            <div>
              <div className="border-b pb-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Log in or sign up
                </h2>
                <p className="text-sm text-gray-600">
                  Logged in as Joe (Completed)
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Add a payment method
                </h2>
                <StripePaymentForm bookingTotal={bookingData.total} />
              </div>
            </div>

            {/* Right Side - Booking Summary */}
            <div>
              <div className="border rounded-xl p-6 sticky top-24">
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

                {/* Booking Details */}
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

                {/* Price Details */}
                <div className="space-y-3 pb-6 border-b mb-6">
                  <h3 className="font-semibold">Price Details</h3>
                  <div className="flex justify-between text-sm">
                    <span className="underline">
                      ${bookingData.property.pricePerNight} x{" "}
                      {bookingData.nights} night
                      {bookingData.nights > 1 ? "s" : ""}
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

                {/* Total */}
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

  // HANDLE REDIRECTS (for old steps)
  if (step === "payment" || step === "review") {
    router.push("/checkout?step=confirm-and-pay");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  // FALLBACK (in case step is invalid)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  );
}
