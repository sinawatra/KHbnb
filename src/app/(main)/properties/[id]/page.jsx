"use client";

import { use, useState } from "react";
import Image from "next/image";
import Searchbar from "@/components/Seachbar";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Star,
  MapPin,
  Flower2,
  Mountain,
  Utensils,
  CircleParking,
  WavesLadder,
  DoorOpen,
} from "lucide-react";
import Footer from "@/components/Footer";

export default function PropertyDetailsPage({ params }) {
  const resolvedParams = use(params);
  const [date, setDate] = useState({ from: undefined, to: undefined });
  const [guests, setGuests] = useState(1);

  const property = {
    id: resolvedParams.id,
    title: "Luxury Kep Villa",
    location: "Kep, Cambodia",
    images: [
      "/beachvilla.jpg",
      "/hotel.jpg",
      "/resort.jpg",
      "/beachvilla.jpg",
      "/hotel.jpg",
    ],
    host: "Deva",
    guests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    pricePerNight: 400,
    rating: 4.9,
    reviews: 128,
    cleaningFee: 200,
    serviceFee: 300,
  };

  const calculateNights = () => {
    if (!date?.from || !date?.to) return 0;
    const diffTime = Math.abs(date.to - date.from);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const subtotal = nights * property.pricePerNight;
  const total = subtotal + property.cleaningFee + property.serviceFee;

  const formatDate = (dateObj) => {
    if (!dateObj) return "Add date";
    return dateObj.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b p-4 flex justify-center">
        <Searchbar />
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold mb-2">{property.title}</h1>
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} />
            <span className="underline">{property.location}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[500px] rounded-xl overflow-hidden mb-8">
          <div className="col-span-2 row-span-2 relative">
            <Image
              src={property.images[0]}
              alt="Main"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative">
            <Image
              src={property.images[1]}
              alt="Image 2"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative">
            <Image
              src={property.images[2]}
              alt="Image 3"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative">
            <Image
              src={property.images[3]}
              alt="Image 4"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative">
            <Image
              src={property.images[4]}
              alt="Image 5"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-12">
          <div className="col-span-2">
            <div className="border-b pb-6 mb-6">
              <h2 className="text-2xl font-semibold mb-2">
                Resort hosted by {property.host}
              </h2>
              <p className="text-gray-600">
                {property.guests} guests · {property.bedrooms} bedroom ·{" "}
                {property.beds} bed · {property.bathrooms} private bathroom
              </p>
            </div>

            <div className="space-y-6 border-b pb-6 mb-6">
              <div className="flex gap-4">
                <DoorOpen />
                <div>
                  <h3 className="font-semibold">Self check-in</h3>
                  <p className="text-gray-600 text-sm">
                    You can check in with the building staff.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Star />
                <div>
                  <h3 className="font-semibold">
                    {property.host} is a Superhost
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Superhosts are experienced, highly rated hosts.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <WavesLadder />
                <div>
                  <h3 className="font-semibold">Dive right in</h3>
                  <p className="text-gray-600 text-sm">
                    This is one of the few places in the area with a pool.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b pb-6 mb-6">
              <h3 className="font-bold">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                Showing off with one of the world's most remarkable beaches,
                Island Resort welcomes you to experience an original beach
                filled holidays.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">
                What this place offers
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Flower2 />
                  <span>Garden view</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mountain />
                  <span>Valley view</span>
                </div>
                <div className="flex items-center gap-3">
                  <CircleParking />
                  <span>Free parking on premises</span>
                </div>
                <div className="flex items-center gap-3">
                  <Utensils />
                  <span>Breakfast</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1">
            <div className="border rounded-xl p-6 shadow-lg sticky top-6">
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-semibold">
                  ${property.pricePerNight}
                </span>
                <span className="text-gray-600">per night</span>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <div className="border rounded-lg mb-4 cursor-pointer">
                    <div className="grid grid-cols-2 border-b">
                      <div className="p-3 border-r hover:bg-gray-50">
                        <div className="text-xs font-semibold">CHECK-IN</div>
                        <div className="text-sm">{formatDate(date?.from)}</div>
                      </div>
                      <div className="p-3 hover:bg-gray-50">
                        <div className="text-xs font-semibold">CHECK-OUT</div>
                        <div className="text-sm">{formatDate(date?.to)}</div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-xs font-semibold">GUESTS</div>
                      <select
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="text-sm w-full outline-none bg-transparent"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <option key={num} value={num}>
                            {num} guest{num > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    disabled={(date) => date < new Date()}
                    showOutsideDays={false}
                  />
                </PopoverContent>
              </Popover>

              <button className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 mb-4">
                Book
              </button>

              <p className="text-center text-sm text-gray-600 mb-4">
                You won't be charged yet
              </p>

              {nights > 0 && (
                <>
                  <div className="space-y-2 text-sm border-t pt-4">
                    <div className="flex justify-between">
                      <span className="underline">
                        ${property.pricePerNight} x {nights} night
                        {nights > 1 ? "s" : ""}
                      </span>
                      <span>${subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="underline">Cleaning fee</span>
                      <span>${property.cleaningFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="underline">Service fee</span>
                      <span>${property.serviceFee}</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-semibold pt-4 border-t mt-4">
                    <span>Total before taxes</span>
                    <span>${total}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
