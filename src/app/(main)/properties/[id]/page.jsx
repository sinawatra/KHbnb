"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/contexts/AuthContext";
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
  DoorOpen,
  WavesLadder,
  Flower2,
  Mountain,
  CircleParking,
  Utensils,
} from "lucide-react";
import Footer from "@/components/Footer";

const PROVINCE_MAP = {
  1: "Phnom Penh",
  2: "Siem Reap",
  3: "Sihanoukville",
  4: "Kampot",
  5: "Kep",
};

export default function PropertyDetailsPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  // State for the property data
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking State
  const [date, setDate] = useState({ from: undefined, to: undefined });
  const [guests, setGuests] = useState(1);

  // --- 1. FETCH REAL DATA ON MOUNT ---
  useEffect(() => {
    if (!resolvedParams.id) return;

    fetch(`/api/properties/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProperty(data.data);
        } else {
          console.error("Property not found");
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  const calculateNights = () => {
    if (!date?.from || !date?.to) return 0;
    const diffTime = Math.abs(date.to - date.from);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!property)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Property not found.
      </div>
    );

  const nights = calculateNights();
  const subtotal = nights * property.price_per_night; // Matches DB column
  const cleaningFee = 20; // Example fixed fee
  const serviceFee = 30; // Example fixed fee
  const total = subtotal + cleaningFee + serviceFee;

  const formatDate = (dateObj) => {
    if (!dateObj) return "Add date";
    return dateObj.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const handleBookClick = () => {
    if (!date?.from || !date?.to) {
      alert("Please select check-in and check-out dates");
      return;
    }

    // --- 2. SAVE CORRECT DATA STRUCTURE ---
    const bookingData = {
      propertyId: property.properties_id,

      property: {
        properties_id: property.properties_id,
        title: property.title,
        location: property.provinces?.name || "Cambodia",
        image: property.image_urls?.[0] || "/placeholder.jpg",
        host: property.host_name || "Host",
        pricePerNight: property.price_per_night,
      },
      checkIn: date.from.toISOString(),
      checkOut: date.to.toISOString(),
      nights,
      guests,
      subtotal,
      cleaningFee,
      serviceFee,
      total,
    };

    sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
    router.push("/checkout?step=confirm-and-pay");
  };

  const mainImage = property.image_urls?.[0] || "/beachvilla.jpg";

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
            <span className="text-gray-600">
              {PROVINCE_MAP[property.province_id] || "Unknown Location"}
            </span>
          </div>
        </div>

        {/* Image Grid - Using fallback if array is missing */}
        <div className="h-[500px] rounded-xl overflow-hidden mb-8 relative">
          <Image
            src={property.image_url || "/beachvilla.jpg"}
            alt={property.title}
            fill
            className="object-cover"
          />
        </div>

        <div className="grid grid-cols-3 gap-12">
          <div className="col-span-2">
            <div className="border-b pb-6 mb-6">
              <h2 className="text-2xl font-semibold mb-2">
                Hosted by {property.host_name || "Host"}
              </h2>
              <p className="text-gray-600">
                {property.max_guests} guests · {property.num_bedrooms} bedrooms
              </p>
            </div>
            <div className="border-b pb-6 mb-6">
              <h3 className="font-bold">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {property.description}
              </p>
            </div>
          </div>

          {/* Booking Widget */}
          <div className="col-span-1">
            <div className="border rounded-xl p-6 shadow-lg sticky top-6">
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-semibold">
                  ${property.price_per_night}
                </span>
                <span className="text-gray-600">per night</span>
              </div>

              {/* Date Picker & Guests (Same as your code) */}
              <Popover>
                <PopoverTrigger asChild>
                  <div className="border rounded-lg mb-4 cursor-pointer">
                    <div className="grid grid-cols-2 border-b">
                      <div className="p-3 border-r">
                        <div className="text-xs font-semibold">CHECK-IN</div>
                        <div className="text-sm">{formatDate(date?.from)}</div>
                      </div>
                      <div className="p-3">
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
                      >
                        {[...Array(property.max_guests || 6)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1} guest{i > 0 ? "s" : ""}
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

              <button
                onClick={handleBookClick}
                disabled={loading}
                className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 mb-4 disabled:opacity-50"
              >
                Book
              </button>

              {nights > 0 && (
                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span>
                      ${property.price_per_night} x {nights} nights
                    </span>
                    <span>${subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span>${cleaningFee}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-4 border-t mt-4">
                    <span>Total</span>
                    <span>${total}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
