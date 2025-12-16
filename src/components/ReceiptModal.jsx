import { X } from "lucide-react";
import Image from "next/image";
import { useCurrency } from "@/components/contexts/CurrencyContext";

export default function ReceiptModal({ booking, onClose }) {
  const { convertPrice } = useCurrency();

  if (!booking) return null;

  // Helper to format currency
  const formatMoney = (amount) => `$${Number(amount).toFixed(2)}`;

  // Helper to format dates
  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  
  const pricePerNight = booking.pricePerNight || 0;
  const nights = booking.nights || 1;
  const subtotal = pricePerNight * nights;
  const cleaningFee = booking.cleaningFee || 0;
  const serviceFee = booking.serviceFee || 0;
  const total = booking.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Receipt</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Icon (Optional, maybe smaller here) */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-green-600"
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
            <h1 className="text-2xl font-bold text-gray-900">
              Paid {convertPrice(total)}
            </h1>
            <p className="text-sm text-gray-500">
              Booking ID: #{booking.id.slice(0, 8)}
            </p>
          </div>

          {/* Property Card */}
          <div className="flex gap-4 border p-3 rounded-xl bg-gray-50">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
              {booking.image && (
                <Image
                  src={booking.image}
                  alt="Property"
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {booking.title}
              </h3>
              <p className="text-xs text-gray-600 mt-1">{booking.location}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Check-in</p>
              <p className="font-semibold">{formatDate(booking.checkIn)}</p>
            </div>
            <div>
              <p className="text-gray-500">Check-out</p>
              <p className="font-semibold">{formatDate(booking.checkOut)}</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Price</span>
              <span className="font-bold">{convertPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
