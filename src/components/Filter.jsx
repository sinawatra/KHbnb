import { useState } from "react";
import { ListFilter, Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Filter({ onApplyFilters }) {
  const [open, setOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50);
  const [rooms, setRooms] = useState(0);
  const [beds, setBeds] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);

  const handleIncrement = (setter, value) => {
    setter(value + 1);
  };

  const handleDecrement = (setter, value) => {
    if (value > 0) setter(value - 1);
  };

  const handleClearAll = () => {
    setMinPrice(0);
    setMaxPrice(500);
    setRooms(0);
    setBeds(0);
    setBathrooms(0);
  };

  const handleSave = () => {
    const filters = {
      minPrice: Number(minPrice),
      maxPrice: Number(maxPrice),
      rooms: rooms === 0 ? "any" : rooms,
      beds: beds === 0 ? "any" : beds,
      bathrooms: bathrooms === 0 ? "any" : bathrooms,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="bg-white px-6 rounded-full flex gap-2 items-center border">
          <ListFilter />
          Filters
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Filters</DialogTitle>
        </DialogHeader>

        <div className="border-t pt-6 space-y-6">
          {/* Price Range */}
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
                    className="pl-7 rounded-full"
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
                    className="pl-7 rounded-full"
                    min="0"
                    max="10000"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6" />

          {/* Rooms and Beds */}
          <div>
            <h3 className="text-lg font-medium mb-4">Rooms and beds</h3>
            <div className="space-y-4">
              {/* Rooms */}
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Room</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleDecrement(setRooms, rooms)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition"
                    disabled={rooms === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center">
                    {rooms === 0 ? "Any" : rooms}
                  </span>
                  <button
                    onClick={() => handleIncrement(setRooms, rooms)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Beds */}
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Beds</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleDecrement(setBeds, beds)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition"
                    disabled={beds === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center">
                    {beds === 0 ? "Any" : beds}
                  </span>
                  <button
                    onClick={() => handleIncrement(setBeds, beds)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bathrooms */}
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Bathrooms</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleDecrement(setBathrooms, bathrooms)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition"
                    disabled={bathrooms === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center">
                    {bathrooms === 0 ? "Any" : bathrooms}
                  </span>
                  <button
                    onClick={() => handleIncrement(setBathrooms, bathrooms)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 flex justify-between items-center">
          <Button variant="ghost" onClick={handleClearAll}>
            Clear all
          </Button>
          <Button
            onClick={handleSave}
            className="bg-black text-white rounded-lg px-6"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
