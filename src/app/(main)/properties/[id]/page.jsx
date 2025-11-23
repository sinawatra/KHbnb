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
  const subtotal = nights * property.price_per_night;
  const cleaningFee = 20;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + cleaningFee + serviceFee;
  const platformRevenue = serviceFee;

  const formatDate = (dateObj) => {
    if (!dateObj) return "Add date";
    return dateObj.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getImages = () => {
    if (property.image_urls && property.image_urls.length > 0) {
      // Filter out blob URLs and invalid URLs
      const validImages = property.image_urls.filter((url) => {
        if (!url || typeof url !== "string") return false;
        return url.startsWith("https://") && url.includes("supabase");
      });
      return validImages.length > 0 ? validImages : [];
    }
    return [];
  };

  const displayImages = getImages();

  const fullList = property.amenities || [];

  // Keywords that identify a "Rule"
  const RULE_KEYWORDS = [
    "no smoking",
    "check-in",
    "check-out",
    "quiet",
    "party",
    "events",
    "smoke free",
  ];

  // Filter Logic
  const rulesList = fullList.filter((item) =>
    RULE_KEYWORDS.some((keyword) => item.toLowerCase().includes(keyword))
  );

  // Everything else is an Amenity
  const amenitiesList = fullList.filter((item) => !rulesList.includes(item));

  // Logic to find "Highlights" for the top section
  const checkAmenity = (keyword) =>
    fullList.some((a) => a.toLowerCase().includes(keyword));
  const hasSelfCheckIn = checkAmenity("self check");
  const hasPets = checkAmenity("pet") && !checkAmenity("no pet"); // Ensure it's not "No pets"
  const hasPool = checkAmenity("pool");
  const hasBeach = checkAmenity("beach");
  const hasBreakfast = checkAmenity("breakfast");

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
      platformRevenue,
    };

    sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
    router.push("/checkout?step=confirm-and-pay");
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
            <span className="text-gray-600">
              {PROVINCE_MAP[property.province_id] || "Unknown Location"}
            </span>
          </div>
        </div>

        {/* Image Grid - Using fallback if array is missing */}
        {displayImages.length >= 5 ? (
          // 5+ images: Show grid layout
          <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8">
            <div className="col-span-2 row-span-2 relative group cursor-pointer bg-gray-100">
              {displayImages[0] ? (
                <Image
                  src={displayImages[0]}
                  alt="Property Main"
                  fill
                 className="object-cover object-center group-hover:brightness-90 transition"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageOff size={64} className="text-gray-300" />
                </div>
              )}
            </div>
            {displayImages.slice(1, 5).map((img, index) => (
              <div
                key={index}
                className="relative group cursor-pointer bg-gray-100"
              >
                {img ? (
                  <Image
                    src={img}
                    alt={`Property detail ${index + 1}`}
                    fill
                    className="object-cover object-center group-hover:brightness-90 transition"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageOff size={48} className="text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : displayImages.length > 1 ? (
          // 2-4 images: Show simplified grid
          <div
            className={`grid gap-3 h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8 ${
              displayImages.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 grid-rows-2"
            }`}
          >
            {displayImages.slice(0, 4).map((img, index) => (
              <div
                key={index}
                className="relative group cursor-pointer bg-gray-100 overflow-hidden"
              >
                {img ? (
                  <Image
                    src={img}
                    alt={`Property ${index + 1}`}
                    fill
                    className="object-cover object-center group-hover:brightness-90 transition"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageOff size={64} className="text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : displayImages.length === 1 ? (
          // 1 image: Show single hero image
          <div className="h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden mb-8 relative bg-gray-100">
            <Image
              src={displayImages[0]}
              alt={property.title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          // 0 images: Show placeholder
          <div className="h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden mb-8 relative bg-gray-100 flex flex-col items-center justify-center">
            <ImageOff size={80} className="text-gray-300" />
            <p className="text-gray-500 mt-4">No image available</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="col-span-2">
            <div className="border-b pb-6 mb-6">
              <h2 className="text-2xl font-semibold mb-2">
                Hosted by {property.host_name || "Host"}
              </h2>
              <p className="text-gray-600">
                {property.max_guests} guests · {property.num_bedrooms} bedrooms
              </p>
            </div>

            <div className="border-b pb-6 mb-6 space-y-6">
              {/* Priority */}
              {hasSelfCheckIn && (
                <div className="flex gap-4">
                  <Key className="text-gray-800 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold">Self check-in</h3>
                    <p className="text-gray-500 text-sm">
                      Check yourself in with the keypad.
                    </p>
                  </div>
                </div>
              )}
              {hasPool ? (
                <div className="flex gap-4">
                  <Waves className="text-gray-800 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold">Dive right in</h3>
                    <p className="text-gray-500 text-sm">
                      This is one of the few places in the area with a pool.
                    </p>
                  </div>
                </div>
              ) : hasBeach ? (
                <div className="flex gap-4">
                  <Umbrella className="text-gray-800 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold">Right next to the beach</h3>
                    <p className="text-gray-500 text-sm">
                      Guests love being this close to the water.
                    </p>
                  </div>
                </div>
              ) : null}

              {hasBreakfast ? (
                <div className="flex gap-4">
                  <Coffee className="text-gray-800 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold">Breakfast included</h3>
                    <p className="text-gray-500 text-sm">
                      Start your day with a complimentary meal.
                    </p>
                  </div>
                </div>
              ) : hasPets ? (
                <div className="flex gap-4">
                  <Dog className="text-gray-800 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold">Pet Friendly</h3>
                    <p className="text-gray-500 text-sm">
                      Bring your pets along for the stay.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Description */}
            <div className="border-b pb-6 mb-6">
              <h3 className="font-bold text-xl mb-4">About this place</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* --- AMENITIES SECTION --- */}
            {amenitiesList.length > 0 && (
              <div className="border-b pb-6 mb-6">
                <h3 className="font-bold text-xl mb-6">
                  What this place offers
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {amenitiesList.map((amenity, index) => {
                    const IconComponent = getAmenityIcon(amenity);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-gray-700"
                      >
                        <IconComponent size={24} strokeWidth={1.5} />
                        <span className="capitalize">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- RULES LIST --- */}
            {rulesList.length > 0 && (
              <div className="pb-6 mb-6">
                <h3 className="font-bold text-xl mb-6">House Rules</h3>
                <div className="space-y-4">
                  {rulesList.map((rule, index) => {
                    const IconComponent = getAmenityIcon(rule);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-gray-800"
                      >
                        <IconComponent
                          size={24}
                          strokeWidth={1.5}
                          className="text-gray-600"
                        />
                        <span className="capitalize font-medium">{rule}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
