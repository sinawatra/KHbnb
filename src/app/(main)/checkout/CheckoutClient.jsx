"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/contexts/AuthContext";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import PaymentForm from "@/components/PaymentForm";

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading } = useAuth();
  const [bookingData, setBookingData] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(["login"]);

  useEffect(() => {
    if (!loading && !profile) {
      router.push("/register");
      return;
    }

    const data = sessionStorage.getItem("bookingData");
    if (!data) {
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

  if (loading || !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const step = searchParams.get("step") || "confirm-and-pay";

  const handleContinueToPayment = () => {
    setCompletedSteps((prev) => [...prev, "login"]);
    router.push("/checkout?step=payment");
  };

  const handlePaymentSubmit = (paymentData) => {
    console.log("Payment data:", paymentData);
    sessionStorage.setItem("paymentMethod", JSON.stringify(paymentData));
    setCompletedSteps((prev) => [...prev, "payment"]);
    router.push("/checkout?step=review");
  };

  if (step === "confirm-and-pay") {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b sticky top-0 bg-white z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-semibold ml-4">Confirm and pay</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 gap-24">
            {/* Left Side - Steps */}
            <div>
              {/* Step 1: Login */}
              <div className="border-b pb-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    1. Log in or sign up
                  </h2>
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
                  2. Add a payment method
                </h2>
                <p className="text-gray-600 text-sm">
                  Payment will be processed in the next step
                </p>
              </div>

              {/* Step 3: Review */}
              <div className="pb-6">
                <h2 className="text-xl font-semibold mb-4">
                  3. Review your booking
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

  // Placeholder for other steps
  if (step === "payment") {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b sticky top-0 bg-white z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-semibold ml-4">Payment</h1>
          </div>
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
    <div className="min-h-screen flex items-center justify-center">
      <div>Step: {step} - Coming soon</div>
    </div>
  );
}
