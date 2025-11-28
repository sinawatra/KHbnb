"use client";

import { useEffect, useState } from "react";
import BookingCard from "@/components/BookingCard";
import { useAuth } from "@/components/contexts/AuthContext";

export default function BookingHistory() {
  const { user, isPremium } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
              : "#"; // Fallback if empty

          return {
            id: b.id,
            propertyId: b.property_id,
            status: b.status,
            title: b.properties?.title || "Unknown Property",
            image: mainImage,
            checkIn: b.check_in_date
              ? new Date(b.check_in_date).toLocaleDateString()
              : "TBD",
            checkOut: b.check_out_date
              ? new Date(b.check_out_date).toLocaleDateString()
              : "TBD",
            price: b.total_price || 0,
            guests: b.num_guests || 1,
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

  if (loading) return <div className="pl-4 pt-10">Loading history...</div>;
  if (error)
    return <div className="pl-4 pt-10 text-red-500">Error: {error}</div>;

  return (
    <div className="pl-4">
      <h1 className="font-bold text-2xl">Booking History</h1>
      <p className="text-gray-400 font-semibold mb-6">
        View and manage your reservations
      </p>

      {bookings.length === 0 ? (
        <div className="text-gray-500 mt-10">You have no bookings yet.</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              isPremium={isPremium}
            />
          ))}
        </div>
      )}
    </div>
  );
}
