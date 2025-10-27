"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function BookingCard({ booking }) {
  const getStatusStyles = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white";
      case "pending":
        return "bg-gray-400 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  return (
    <div className="mt-10 bg-white p-6 rounded-lg shadow-md flex">
      <div className="w-40 h-40 bg-gray-200 rounded-lg overflow-hidden">
        <div className="w-48 h-32 relative">
          <Image
            src={booking.image}
            alt={booking.title}
            fill={true}
            className="object-cover"
          />
        </div>
      </div>
      <div className="ml-6 flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{booking.title}</h2>
            <p className="text-gray-600">Booking ID: {booking.id}</p>
          </div>
          <span
            className={`${getStatusStyles(
              booking.status
            )} rounded-full font-bold px-3 py-1 text-xs capitalize`}
          >
            {booking.status}
          </span>
        </div>

        <div className="flex justify-start gap-52 my-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Check-in</p>
              <p className="font-semibold">{booking.checkIn}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Check-out</p>
              <p className="font-semibold">{booking.checkOut}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Guests</p>
              <p className="font-semibold">{booking.guests} guests</p>
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <p>Total Price: ${booking.price}</p>
          <div>
            <Button
              variant="outline"
              className="shadow-none bg-white border-b mr-2 rounded-md"
            >
              View Property
            </Button>
            {booking.status === "pending" && (
              <Button
                variant="destructive"
                className="rounded-md"
                onClick={() => toast.success("Booking cancelled succesfully")}
              >
                X Cancel Booking
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
