"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/contexts/AuthContext";
import CheckoutProgressBar from "@/components/CheckoutProgressBar";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import PaymentForm from "@/components/PaymentForm";

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

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading } = useAuth();
  const [bookingData, setBookingData] = useState(null);
  const step = searchParams.get("step") || "confirm-and-pay";
  const [completedSteps, setCompletedSteps] = useState(["login"]);
  const currentRoute = searchParams.get("step");
  const currentStepNumber = getStepIdFromRoute(currentRoute);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!loading && !profile) {
      router.push("/register");
      return;
    }

    // Get booking data from sessionStorage
    const data = sessionStorage.getItem("bookingData");
    if (!data) {
      // No booking data, redirect back
      router.push("/properties");
      return;
    }

    setBookingData(JSON.parse(data));
  }, [loading, profile, router]);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleContinueToPayment = () => {
    setCompletedSteps((prev) => [...prev, "login"]);
    router.push("/checkout?step=payment");
  };

  const handlePaymentSubmit = (paymentData) => {
    console.log("Payment data:", paymentData);
    sessionStorage.setItem("paymentMethod", JSON.stringify(paymentData));
    setCompletedSteps([1, 2]);
    router.push("/checkout?step=review");
  };

  const handleCompletePurchase = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock successful payment
    const orderId =
      "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const invoiceNumber = "#AB" + Math.floor(100000 + Math.random() * 900000);

    sessionStorage.setItem("orderId", orderId);
    sessionStorage.setItem("invoiceNumber", invoiceNumber);
    sessionStorage.setItem("invoiceDate", new Date().toISOString());

    setIsProcessing(false);
    router.push("/checkout?step=success");
  };

  if (loading || !bookingData) {
    // Success/Invoice page
    if (step === "success") {
      const orderId =
        typeof window !== "undefined"
          ? sessionStorage.getItem("orderId")
          : null;
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
              {/* Header Info */}
              <div className="flex justify-between mb-12">
                {/* Left - Business Info */}
                <div>
                  <h1 className="text-2xl font-bold mb-4">Aivish Baldha</h1>
                  <p className="text-sm text-gray-600">hello@gmail.com</p>
                  <p className="text-sm text-gray-600">+91 00000 00000</p>
                </div>

                {/* Right - Business Address */}
                <div className="text-right">
                  <p className="text-sm text-gray-600">Business address</p>
                  <p className="text-sm text-gray-600">
                    City, State, IN - 000 000
                  </p>
                  <p className="text-sm text-gray-600">
                    TAN-ID: 0000000012340XXX
                  </p>
                </div>
              </div>

              {/* Invoice Details Grid */}
              <div className="grid grid-cols-3 gap-8 mb-8">
                {/* Billed to */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Billed to</p>
                  <p className="font-semibold">In Employeesuchdata</p>
                  <p className="text-sm text-gray-600">Business address</p>
                  <p className="text-sm text-gray-600">City, Country - 00000</p>
                  <p className="text-sm text-gray-600">+0 (000) 123-4567</p>
                </div>

                {/* Invoice details */}
                <div>
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Invoice number</p>
                    <p className="font-semibold">
                      {invoiceNumber || "#AB2234-01"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Reference</p>
                    <p className="font-semibold">INV-057</p>
                  </div>
                </div>

                {/* Amount and dates */}
                <div className="text-right">
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">
                      Invoice of (USD)
                    </p>
                    <p className="text-2xl font-bold text-orange-500">
                      ${bookingData.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Invoice date</p>
                    <p className="font-semibold">
                      {formatInvoiceDate(invoiceDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Due date</p>
                    <p className="font-semibold">
                      {formatInvoiceDate(invoiceDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="mb-8">
                <p className="text-xs text-gray-500 mb-1">Subject</p>
                <p className="font-semibold">Hotel booking</p>
              </div>

              {/* Invoice Table */}
              <div className="mb-8">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-xs text-gray-500">
                      <th className="pb-3 font-medium">ITEM/DETAIL</th>
                      <th className="pb-3 font-medium">DATE</th>
                      <th className="pb-3 font-medium text-right">GUEST</th>
                      <th className="pb-3 font-medium text-right">RATE</th>
                      <th className="pb-3 font-medium text-right">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="border-b">
                    <tr className="border-b">
                      <td className="py-4">
                        <p className="font-semibold">
                          {bookingData.property.title}
                        </p>
                        <p className="text-sm text-gray-600">Villa in Kep</p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm">
                          {formatDate(bookingData.checkIn).replace(/,/g, "")} -{" "}
                          {formatDate(bookingData.checkOut).replace(/,/g, "")}
                        </p>
                      </td>
                      <td className="py-4 text-right">
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
                      <span className="text-sm">Subtotal</span>
                      <span className="text-sm">
                        $
                        {(
                          bookingData.subtotal +
                          bookingData.cleaningFee +
                          bookingData.serviceFee
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-4 pb-4 border-b">
                      <span className="text-sm">Tax (10%)</span>
                      <span className="text-sm">
                        ${(bookingData.total * 0.1).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${bookingData.total.toFixed(2)}</span>
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
                  <p className="text-xs text-gray-500 mb-1">
                    Terms & Conditions
                  </p>
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

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Render different steps based on query param
  if (step === "confirm-and-pay") {
    return (
      <div className="min-h-screen bg-white">
        {/* Progress Bar Header */}
        <div className="border-b bg-white">
          <CheckoutProgressBar
            currentStep={currentStepNumber}
            completedSteps={completedSteps}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 gap-24">
            {/* Left Side - Steps */}
            <div>
              {/* Step 1: Login */}
              <div className="border-b pb-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Log in or sign up</h2>
                  <button
                    onClick={handleContinueToPayment}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700"
                  >
                    Continue
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Logged in as {profile?.email || "User"}
                </p>
              </div>

              {/* Step 2: Payment Method */}
              <div className="border-b pb-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Add a payment method
                </h2>
                <p className="text-gray-600 text-sm">
                  Payment will be processed in the next step
                </p>
              </div>

              {/* Step 3: Review */}
              <div className="pb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Review your booking
                </h2>
                <p className="text-gray-600 text-sm">
                  Verify all details before confirming
                </p>
              </div>
            </div>

            {/* Right Side - Booking Summary */}
            <div>
              <div className="border rounded-xl p-6 sticky top-24">
                {/* Property Card */}
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

  // Payment step
  if (step === "payment") {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
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
              <h2 className="text-2xl font-semibold mb-6">
                2. Payment Methods
              </h2>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-6">Payment cards</p>
                <PaymentForm onSubmit={handlePaymentSubmit} isLoading={false} />
              </div>
            </div>

            {/* Right Side - Booking Summary (Same as before) */}
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-white">
        <CheckoutProgressBar
          currentStep={currentStepNumber}
          completedSteps={completedSteps}
        />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-8">3. Review booking</h2>

        {/* Property Card */}
        <div className="border rounded-xl p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <div className="relative w-40 h-32 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={bookingData.property.image}
                alt={bookingData.property.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-xl mb-2">
                {bookingData.property.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {bookingData.property.location}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            This reservation is non-refundable.{" "}
            <span className="underline cursor-pointer">Full policy.</span>
          </p>

          {/* Dates */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Dates</h4>
            <p className="text-gray-700">
              {formatDate(bookingData.checkIn)} -{" "}
              {formatDate(bookingData.checkOut)}
            </p>
          </div>

          {/* Guests */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Guests</h4>
            <p className="text-gray-700">
              {bookingData.guests} adult{bookingData.guests > 1 ? "s" : ""}
            </p>
          </div>

          {/* Price Details */}
          <div className="border-t pt-6 mb-6">
            <h4 className="font-semibold mb-4">Price Details</h4>
            <div className="flex justify-between text-sm mb-2">
              <span>
                {bookingData.nights} nights * $
                {bookingData.property.pricePerNight}
              </span>
              <span>${bookingData.subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-lg">Total USD</span>
              <span className="font-semibold text-lg">
                ${bookingData.total.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-600">VAT 10% included</p>
          </div>
        </div>

        {/* Complete Purchase Button */}
        <button
          onClick={handleCompletePurchase}
          disabled={isProcessing}
          className="w-full bg-red-600 text-white font-semibold py-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {isProcessing ? "Processing..." : "Complete purchase"}
        </button>
      </div>
    </div>
  );
}
