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
  MapPin,
  Wifi,
  Car,
  Waves,
  Wind,
  Utensils,
  Tv,
  Dog,
  Key,
  Sparkles,
  Dumbbell,
  WashingMachine,
  Monitor,
  Coffee,
  ChefHat,
  Flower2,
  Bike,
  Umbrella,
  Mountain,
  Building2,
  Landmark,
  Trees,
  Leaf,
  Sun,
  DoorOpen,
  Ship,
  CigaretteOff,
  PartyPopper,
  Clock,
  Ban,
  ImageOff,
  X,
} from "lucide-react";
import Footer from "@/components/Footer";

const AMENITY_ICONS = {
  // Essentials
  wifi: Wifi,
  "air conditioning": Wind,
  ac: Wind,
  kitchen: Utensils,
  parking: Car,
  "free parking": Car,
  workspace: Monitor,
  tv: Tv,
  washer: WashingMachine,

  // Facilities
  pool: Waves,
  "swimming pool": Waves,
  "gym access": Dumbbell,
  gym: Dumbbell,
  garden: Flower2,
  balcony: DoorOpen,
  "historic building": Landmark,
  elevator: Building2,

  // Food & Service
  breakfast: Coffee,
  "chef service": ChefHat,
  "cleaning service": Sparkles,

  // Views
  "sea view": Waves,
  "river view": Ship,
  "mountain view": Mountain,
  "city view": Building2,
  "temple view": Landmark,
  "nature view": Trees,
  "valley view": Leaf,
  "garden view": Flower2,

  // Activities / Location
  "beach access": Umbrella,
  hiking: Mountain,
  bicycle: Bike,
  "farm tour": Trees,
  "central location": MapPin,

  // Atmosphere / Permissions
  "pet friendly": Dog,
  pets: Dog,
  "self check-in": Key,
  "eco-friendly": Leaf,
  peaceful: Sun,

  // RULES / RESTRICTIONS
  "no smoking": CigaretteOff,
  "smoke free": CigaretteOff,
  "no parties": PartyPopper,
  "no events": PartyPopper,
  "check-in": Clock,
  "check-out": Clock,
  "quiet hours": Clock,
  "no pets": Ban,
};

const getAmenityIcon = (amenityName) => {
  const normalized = amenityName?.toLowerCase().trim();
  return AMENITY_ICONS[normalized] || Sparkles;
};

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
  const { profile } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState({ from: undefined, to: undefined });
  const [guests, setGuests] = useState(1);

  // --- 1. FETCH DATA ---
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

  // --- 2. CALCULATIONS ---
  const isValidDateRange =
    date?.from && date?.to && date.from.getTime() !== date.to.getTime();

  const calculateNights = () => {
    if (!isValidDateRange) return 0;
    const diffTime = Math.abs(date.to - date.from);
    // Ensure at least 1 night if valid
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  // --- 3. HANDLE BOOK CLICK ---
  const handleReserve = () => {
    if (!isValidDateRange) return;

    const nights = calculateNights();
    const subtotal = nights * property.price_per_night;
    const cleaningFee = property.cleaning_fee || 20;
    const serviceFee = Math.round(subtotal * 0.1);
    const total = subtotal + cleaningFee + serviceFee;

    const bookingData = {
      propertyId: property.properties_id,
      property: {
        properties_id: property.properties_id,
        title: property.title,
        location: property.provinces?.name || "Cambodia",
        image: displayImages[0],
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
      platformRevenue: serviceFee,
    };

    sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
    router.push("/checkout?step=confirm-and-pay");
  };

  // --- 4. RENDER HELPERS ---
  const formatDate = (dateObj) => {
    if (!dateObj) return "Add date";
    return dateObj.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getImages = () => {
    if (property?.image_urls?.length > 0) {
      return property.image_urls.filter(
        (url) => url && typeof url === "string" && url.startsWith("https://")
      );
    }
    return [];
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

  const displayImages = getImages();
  const fullList = property.amenities || [];

  // Calculate Totals for display
  const nights = calculateNights();
  const subtotal = nights * property.price_per_night;
  const cleaningFee = property.cleaning_fee || 20;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + cleaningFee + serviceFee;

  // Filter Amenities vs Rules
  const RULE_KEYWORDS = [
    "no smoking",
    "check-in",
    "check-out",
    "quiet",
    "party",
    "events",
    "smoke free",
  ];
  const rulesList = fullList.filter((item) =>
    RULE_KEYWORDS.some((k) => item.toLowerCase().includes(k))
  );
  const amenitiesList = fullList.filter((item) => !rulesList.includes(item));

  // Highlights
  const checkAmenity = (k) => fullList.some((a) => a.toLowerCase().includes(k));
  const hasSelfCheckIn = checkAmenity("self check");
  const hasPets = checkAmenity("pet") && !checkAmenity("no pet");
  const hasPool = checkAmenity("pool");
  const hasBeach = checkAmenity("beach");
  const hasBreakfast = checkAmenity("breakfast");

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

        {/* IMAGE GRID */}
        {displayImages.length >= 1 ? (
          <div className="h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden mb-8 relative bg-gray-100">
            {/* Note: I simplified the grid for safety, you can paste your grid back if you prefer */}
            <Image
              src={displayImages[0]}
              alt={property.title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-[400px] bg-gray-200 rounded-2xl mb-8 flex items-center justify-center">
            No Image
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* LEFT COLUMN: Details */}
          <div className="col-span-2">
            <div className="border-b pb-6 mb-6">
              <h2 className="text-2xl font-semibold mb-2">
                Hosted by {property.host_name || "Host"}
              </h2>
              <p className="text-gray-600">
                {property.max_guests} guests · {property.num_bedrooms} bedrooms
              </p>
            </div>

            {/* Highlights Section */}
            <div className="border-b pb-6 mb-6 space-y-6">
              {hasSelfCheckIn && (
                <div className="flex gap-4">
                  <Key size={24} />
                  <div>
                    <h3 className="font-semibold">Self check-in</h3>
                  </div>
                </div>
              )}
              {hasPool && (
                <div className="flex gap-4">
                  <Waves size={24} />
                  <div>
                    <h3 className="font-semibold">Pool</h3>
                  </div>
                </div>
              )}
              {hasPets && (
                <div className="flex gap-4">
                  <Dog size={24} />
                  <div>
                    <h3 className="font-semibold">Pet Friendly</h3>
                  </div>
                </div>
              )}
            </div>

            <div className="border-b pb-6 mb-6">
              <h3 className="font-bold text-xl mb-4">About this place</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {amenitiesList.length > 0 && (
              <div className="border-b pb-6 mb-6">
                <h3 className="font-bold text-xl mb-6">
                  What this place offers
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {amenitiesList.map((a, i) => {
                    const Icon = getAmenityIcon(a);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <Icon size={24} />
                        <span className="capitalize">{a}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Booking Widget */}
          <div className="col-span-1">
            <div className="border rounded-xl p-6 shadow-lg sticky top-6 bg-white z-10">
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-semibold">
                  ${property.price_per_night}
                </span>
                <span className="text-gray-600">per night</span>
              </div>

              {/* DATE PICKER COMPONENT */}
              <Popover>
                <div className="border border-gray-300 rounded-lg mb-4 bg-white shadow-sm relative">
                  <div className="flex border-b border-gray-300">
                    {/* CHECK-IN BOX */}
                    <PopoverTrigger asChild>
                      <div
                        className={`w-1/2 p-3 border-r border-gray-300 cursor-pointer hover:bg-gray-100 transition-all relative group rounded-tl-lg
                          ${!date?.from ? "ring-2 ring-black z-10" : ""} 
                        `}
                        onClick={() => {
                          setDate({ from: undefined, to: undefined });
                        }}
                      >
                        <div className="text-[10px] font-bold uppercase text-gray-800">
                          Check-in
                        </div>
                        <div
                          className={`text-sm truncate ${!date?.from ? "text-gray-400" : "text-gray-700"}`}
                        >
                          {formatDate(date?.from)}
                        </div>

                        {/* Clear Button */}
                        {date?.from && (
                          <div
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDate({ from: undefined, to: undefined });
                            }}
                            className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} className="text-gray-500" />
                          </div>
                        )}
                      </div>
                    </PopoverTrigger>

                    {/* CHECK-OUT BOX */}
                    <PopoverTrigger asChild>
                      <div
                        className={`w-1/2 p-3 cursor-pointer hover:bg-gray-100 transition-all relative group rounded-tr-lg
                           ${date?.from && !date?.to ? "ring-2 ring-black z-10" : ""}
                        `}
                        onClick={() => {
                          if (date?.from) {
                            setDate({ from: date.from, to: undefined });
                          }
                        }}
                      >
                        <div className="text-[10px] font-bold uppercase text-gray-800">
                          Check-out
                        </div>
                        <div
                          className={`text-sm truncate ${!date?.to ? "text-gray-400" : "text-gray-700"}`}
                        >
                          {formatDate(date?.to)}
                        </div>

                        {/* Clear Button */}
                        {date?.to && (
                          <div
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDate({ ...date, to: undefined });
                            }}
                            className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} className="text-gray-500" />
                          </div>
                        )}
                      </div>
                    </PopoverTrigger>
                  </div>

                  {/* GUESTS SELECTOR */}
                  <div className="p-3 relative hover:bg-gray-100 transition-colors rounded-b-lg">
                    <div className="text-[10px] font-bold uppercase text-gray-800">
                      Guests
                    </div>
                    <div className="text-sm text-gray-700">
                      {guests} guest{guests > 1 ? "s" : ""}
                    </div>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    >
                      {[...Array(property.max_guests || 6)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} guests
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CALENDAR CONTENT (Unchanged) */}
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={date}
                    onSelect={(range) => {
                      if (
                        range?.from &&
                        range?.to &&
                        range.from.getTime() === range.to.getTime()
                      ) {
                        setDate({ from: range.from, to: undefined });
                      } else {
                        setDate(range);
                      }
                    }}
                    min={1}
                    numberOfMonths={2}
                    disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
                    showOutsideDays={false}
                    defaultMonth={date?.from || new Date()}
                  />
                </PopoverContent>
              </Popover>

              {/* RESERVE BUTTON */}
              <button
                onClick={handleReserve}
                disabled={!isValidDateRange}
                className={`w-full py-3 rounded-lg font-semibold text-lg transition-all shadow-sm mb-4
                  ${
                    isValidDateRange
                      ? "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }
                `}
              >
                {!date?.from
                  ? "Check availability"
                  : !date?.to
                    ? "Select check-out date"
                    : !isValidDateRange
                      ? "Min 1 night stay"
                      : "Book"}
              </button>

              {/* PRICING BREAKDOWN */}
              {isValidDateRange ? (
                <div className="space-y-2 text-sm border-t pt-4 text-gray-700">
                  <div className="flex justify-between">
                    <span className="underline decoration-gray-300 decoration-1 underline-offset-2">
                      ${property.price_per_night} x {nights} nights
                    </span>
                    <span>${subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="underline decoration-gray-300 decoration-1 underline-offset-2">
                      Cleaning fee
                    </span>
                    <span>${cleaningFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="underline decoration-gray-300 decoration-1 underline-offset-2">
                      Service fee
                    </span>
                    <span>${serviceFee}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-4 border-t border-gray-200 mt-4 text-base">
                    <span>Total</span>
                    <span>${total}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500 mt-2">
                  Enter dates to see total
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
