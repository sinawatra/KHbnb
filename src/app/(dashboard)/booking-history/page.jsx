"use client";

import { useEffect, useState } from "react";
import BookingCard from "@/components/BookingCard";
import ReceiptModal from "@/components/ReceiptModal";
import { useAuth } from "@/components/contexts/AuthContext";

export default function BookingHistory() {
  const { user, isPremium } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/user/bookings/bookings_history");

        if (!res.ok) {
          if (res.status === 401) throw new Error("Please log in.");
          throw new Error("Failed to fetch bookings");
        }

        const json = await res.json();

        const mappedBookings = json.booking.map((b) => {
          const propertyImages = b.properties?.image_urls;
          const mainImage =
            Array.isArray(propertyImages) && propertyImages.length > 0
              ? propertyImages[0]
              : "null"; // Fallback if empty

          return {
            id: b.id,
            propertyId: b.property_id,
            status: b.status,
            title: b.properties?.title || "Unknown Property",
            location: b.properties?.location || "Unknown Location",
            image: mainImage,
            checkIn: b.check_in_date,
            checkOut: b.check_out_date,
            price: b.total_price || 0,
            guests: b.num_guests || 1,
            nights: calculateNights(b.check_in_date, b.check_out_date),
          };
        });

        setBookings(mappedBookings);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const calculateNights = (start, end) => {
    if (!start || !end) return 1;
    const diff = new Date(end) - new Date(start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) return (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-gray-500 font-medium">Loading history...</p>
      </div>
    </div>
  );
  if (error)
    return <div className="pl-4 pt-10 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-bold text-3xl text-gray-900">Booking History</h1>
        <p className="text-gray-500 mt-2">
          View your past trips and payment receipts.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">You have no bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              isPremium={isPremium}
              onViewReceipt={() => setSelectedBooking(booking)}
            />
          ))}
        </div>
      )}

      {selectedBooking && (
        <ReceiptModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}
