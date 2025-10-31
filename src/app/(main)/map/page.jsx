"use client";

import Searchbar from "@/components/Seachbar";
import Filter from "@/components/Filter";
import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

const dummyProperty = {
  id: 1,
  title: "Luxury hotel in Phnom Penh",
  images: ["/beachvilla.jpg"],
  distance: "981 kilometers away",
  dates: "28-30 Sep",
  pricePerNight: 250,
};

const handleFilters = (filters) => {
  console.log("Applying filters:", filters);
};

export default function MapPageUI() {
  return (
    <div className="relative h-screen w-screen">
      <div className="absolute top-0 left-0 h-full w-full bg-gray-200 flex items-center justify-center">
        <h2 className="text-gray-500 text-2xl font-semibold">
          Map API Placeholder
        </h2>
      </div>

      <div className="absolute top-6 z-10 w-full flex justify-center items-center gap-4 px-6">
        <Searchbar />
        <Filter onApplyFilters={handleFilters} />
      </div>

    </div>
  );
}
