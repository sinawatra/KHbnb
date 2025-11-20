"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

const FALLBACK_IMAGE = "/beachvilla.jpg";

export default function BookingCard({ booking }) {
  const isValidUrl = (s) => {
    if (!s) return false; // null or undefined
    if (Array.isArray(s)) return false; // rejects []
    if (typeof s !== "string") return false; // rejects objects/numbers
    if (s.trim() === "" || s === "#") return false; // rejects empty strings
    return true;
  };

  const [imgSrc, setImgSrc] = useState(() => {
    return isValidUrl(booking.image) ? booking.image : FALLBACK_IMAGE;
  });

  useEffect(() => {
    setImgSrc(isValidUrl(booking.image) ? booking.image : FALLBACK_IMAGE);
  }, [booking.image]);

  const getStatusStyles = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white";
      case "pending":
        return "bg-orange-400 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  return (
    <div className="mt-6 bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row gap-6">
      {/* Image Container - Fixed sizing issues */}
      <div className="relative w-full md:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
        <Image
          src={imgSrc}
          alt={booking.title}
          fill={true}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 200px"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
      </div>

      <div className="flex-grow flex flex-col justify-between">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{booking.title}</h2>
            <p className="text-sm text-gray-500">Booking ID: {booking.id}</p>
          </div>
          <span
            className={`${getStatusStyles(
              booking.status
            )} rounded-full font-bold px-3 py-1 text-xs capitalize`}
          >
            {booking.status}
          </span>
        </div>

        {/* Details Grid */}
        <div className="flex flex-wrap gap-x-12 gap-y-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Check-in</p>
              <p className="font-semibold text-sm">{booking.checkIn}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Check-out</p>
              <p className="font-semibold text-sm">{booking.checkOut}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Guests</p>
              <p className="font-semibold text-sm">{booking.guests} guests</p>
            </div>
          </div>
        </div>

        {/* Footer / Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <p className="text-lg font-bold text-gray-900">
            ${Number(booking.price).toLocaleString()}
          </p>

          <div className="flex gap-3">
            {/* THE LINK LOGIC */}
            <Link href={`/properties/${booking.propertyId}`}>
              <Button
                variant="outline"
                className="shadow-sm bg-white hover:bg-gray-50"
              >
                View Property
              </Button>
            </Link>

            {booking.status === "pending" && (
              <Button
                variant="destructive"
                onClick={() => toast.success("Booking cancelled successfully")}
              >
                Cancel Booking
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
