import { useState, useEffect } from "react";
import {
  ListFilter,
  Minus,
  Plus,
  Lock,
  Wifi,
  Wind,
  Utensils,
  Car,
  Monitor,
  Tv,
  WashingMachine,
  Waves,
  Dumbbell,
  Flower2,
  DoorOpen,
  Landmark,
  Building2,
  Coffee,
  ChefHat,
  Sparkles,
  Ship,
  Mountain,
  Trees,
  Leaf,
  Umbrella,
  Bike,
  MapPin,
  Dog,
  Key,
  Sun,
  CigaretteOff,
  PartyPopper,
  Clock,
  Ban,
} from "lucide-react";
import { useAuth } from "@/components/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AMENITY_ICONS = {
  wifi: Wifi,
  "air conditioning": Wind,
  ac: Wind,
  kitchen: Utensils,
  parking: Car,
  "free parking": Car,
  workspace: Monitor,
  tv: Tv,
  washer: WashingMachine,
  pool: Waves,
  "swimming pool": Waves,
  "gym access": Dumbbell,
  gym: Dumbbell,
  garden: Flower2,
  balcony: DoorOpen,
  "historic building": Landmark,
  elevator: Building2,
  breakfast: Coffee,
  "chef service": ChefHat,
  "cleaning service": Sparkles,
  "sea view": Waves,
  "river view": Ship,
  "mountain view": Mountain,
  "city view": Building2,
  "temple view": Landmark,
  "nature view": Trees,
  "valley view": Leaf,
  "garden view": Flower2,
  "beach access": Umbrella,
  hiking: Mountain,
  bicycle: Bike,
  "farm tour": Trees,
  "central location": MapPin,
  "pet friendly": Dog,
  pets: Dog,
  "self check-in": Key,
  "eco-friendly": Leaf,
  peaceful: Sun,
  "no smoking": CigaretteOff,
  "smoke free": CigaretteOff,
  "no parties": PartyPopper,
  "no events": PartyPopper,
  "check-in": Clock,
  "check-out": Clock,
  "quiet hours": Clock,
  "no pets": Ban,
};

// Free essentials (available to all users)
const FREE_ESSENTIALS = ["wifi", "parking", "air conditioning"];

// Free rules (available to all users)
const FREE_RULES = [
  "self check-in",
  "no smoking",
  "smoke free",
  "no pets",
  "pet friendly",
];

// Premium amenities
const PREMIUM_AMENITIES = [
  "kitchen",
  "workspace",
  "tv",
  "pool",
  "gym",
  "garden",
  "balcony",
  "breakfast",
  "sea view",
  "mountain view",
  "beach access",
  "eco-friendly",
];

export default function Filter({
  onApplyFilters,
  currentFilters = {},
  activeCount = 0,
}) {
  const { user, isPremium, subscriptionLoading } = useAuth();
  const showPremiumFeatures = isPremium && !subscriptionLoading;
  const [open, setOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice || 0);
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice || 500);
  const [beds, setBeds] = useState(
    currentFilters.beds === "any" ? 0 : currentFilters.beds || 0
  );

  const [selectedAmenities, setSelectedAmenities] = useState(
    currentFilters.amenities || []
  );

  // Sync state when dialog opens with current filters
  useEffect(() => {
    if (open) {
      setMinPrice(currentFilters.minPrice || 0);
      setMaxPrice(currentFilters.maxPrice || 500);
      setBeds(currentFilters.beds === "any" ? 0 : currentFilters.beds || 0);
      setSelectedAmenities(currentFilters.amenities || []);
    }
  }, [open, currentFilters]);

  const handleIncrement = (setter, value) => {
    setter(value + 1);
  };

  const handleDecrement = (setter, value) => {
    if (value > 0) setter(value - 1);
  };

  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities((prev) => {
      if (prev.includes(amenity)) {
        return prev.filter((a) => a !== amenity);
      } else {
        return [...prev, amenity];
      }
    });
  };

  const handleClearAll = () => {
    setMinPrice(0);
    setMaxPrice(500);
    setBeds(0);
    setSelectedAmenities([]);
  };

  const handleSave = () => {
    const filters = {
      minPrice: Number(minPrice),
      maxPrice: Number(maxPrice),
      beds: beds === 0 ? "any" : beds,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    };
    onApplyFilters(filters);
    setOpen(false);
  };

  const handlePriceChange = (value, setter, max = 10000) => {
    const num = value === "" ? 0 : Number(value);
    if (!isNaN(num) && num >= 0 && num <= max) {
      setter(num);
    }
  };

  const getAmenityIcon = (amenity) => {
    const Icon = AMENITY_ICONS[amenity] || Sparkles;
    return Icon;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="bg-white px-6 py-3 rounded-full flex gap-3 items-center border-2 border-gray-300 shadow-sm hover:shadow-md transition relative">
          <div className="w-5 h-5 flex items-center justify-center">
            <ListFilter size={18} />
          </div>
          <div className="flex flex-col text-left">
            <label className="font-semibold text-xs">Filters</label>
            <p className="text-sm text-gray-600">
              {activeCount > 0 ? `${activeCount} active` : "Add filters"}
            </p>
          </div>
          {activeCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Filters</DialogTitle>
        </DialogHeader>

        <div className="border-t pt-6 space-y-6">
          {/* Price Range - FREE FOR ALL */}
          <div>
            <h3 className="text-lg font-medium mb-4">
              Price range{" "}
              <span className="text-sm text-gray-500">(per night)</span>
            </h3>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="text-sm text-gray-600 mb-2 block">
                  Minimum
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    $
                  </span>
                  <Input
                    type="number"
                    value={minPrice}
                    onChange={(e) =>
                      handlePriceChange(e.target.value, setMinPrice)
                    }
                    className="pl-7 bg-white rounded-full"
                    min="0"
                    max="10000"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-600 mb-2 block">
                  Maximum
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    $
                  </span>
                  <Input
                    type="number"
                    value={maxPrice}
                    onChange={(e) =>
                      handlePriceChange(e.target.value, setMaxPrice)
                    }
                    className="pl-7 bg-white rounded-full"
                    min="0"
                    max="10000"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6" />

          {/* Beds - FREE FOR ALL */}
          <div>
            <h3 className="text-lg font-medium mb-4">Beds</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Number of beds</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleDecrement(setBeds, beds)}
                  className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:border-gray-900 transition"
                  disabled={beds === 0}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center">
                  {beds === 0 ? "Any" : beds}
                </span>
                <button
                  onClick={() => handleIncrement(setBeds, beds)}
                  className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:border-gray-900 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t pt-6" />

          {/* FREE ESSENTIALS */}
          <div>
            <h3 className="text-lg font-medium mb-4">Essentials</h3>
            <div className="grid grid-cols-2 gap-3">
              {FREE_ESSENTIALS.map((amenity) => {
                const Icon = getAmenityIcon(amenity);
                const isChecked = selectedAmenities.includes(amenity);

                return (
                  <label
                    key={amenity}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                      isChecked
                        ? "border-black bg-gray-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    />
                    <Icon size={20} className="text-gray-700" />
                    <span className="capitalize text-sm">{amenity}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-6" />

          {/* FREE RULES */}
          <div>
            <h3 className="text-lg font-medium mb-4">House Rules</h3>
            <div className="grid grid-cols-2 gap-3">
              {FREE_RULES.map((amenity) => {
                const Icon = getAmenityIcon(amenity);
                const isChecked = selectedAmenities.includes(amenity);

                return (
                  <label
                    key={amenity}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                      isChecked
                        ? "border-black bg-gray-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    />
                    <Icon size={20} className="text-gray-700" />
                    <span className="capitalize text-sm">{amenity}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="border-t" />

          {/* PREMIUM AMENITIES - Compact Lock */}
          <div className="relative">
            {(!isPremium || subscriptionLoading) && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 rounded-lg flex flex-col items-center justify-center p-4">
                {subscriptionLoading ? (
                  <>
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-2" />
                    <p className="text-sm text-gray-600">
                      Checking subscription...
                    </p>
                  </>
                ) : (
                  <>
                    <Lock className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm font-semibold mb-1">
                      Premium Feature
                    </p>
                    <p className="text-xs text-gray-600 mb-3 text-center">
                      Filter by Pool, Kitchen, Gym, Sea View & more
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        window.location.href = "/subscription";
                      }}
                      className="bg-red-600 text-white hover:bg-red-700 text-xs px-4 py-2"
                    >
                      Upgrade
                    </Button>
                  </>
                )}
              </div>
            )}
            <div
              className={
                !isPremium || subscriptionLoading
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            >
              <h3 className="text-lg font-medium mb-4">
                Amenities
                {!isPremium && !subscriptionLoading && (
                  <Lock className="inline-block w-4 h-4 ml-2 text-gray-400" />
                )}
              </h3>
              <div className="grid grid-cols-2 gap-3 pr-2">
                {PREMIUM_AMENITIES.map((amenity) => {
                  const Icon = getAmenityIcon(amenity);
                  const isChecked = selectedAmenities.includes(amenity);
                  return (
                    <label
                      key={amenity}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        isChecked
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleAmenityToggle(amenity)}
                        disabled={!isPremium || subscriptionLoading}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                      />
                      <Icon size={20} className="text-gray-700" />
                      <span className="capitalize text-sm">{amenity}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 pb-4 mt-4 flex justify-between items-center sticky bottom-0 bg-white z-20 px-6 rounded-lg">
          <Button variant="ghost" onClick={handleClearAll}>
            Clear all
          </Button>
          <Button
            onClick={handleSave}
            className="bg-black text-white rounded-lg px-6 hover:bg-gray-800"
          >
            Show results
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
