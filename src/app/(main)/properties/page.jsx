"use client";
import Link from "next/link";
import { ListFilterPlus, X, Plus, Minus } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import Searchbar from "@/components/Seachbar";
import Footer from "@/components/Footer";
import Filter from "@/components/Filter";
import { useState } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";

const properties = [
  {
    id: 1,
    title: "Cozy Beach House",
    images: ["/beachvilla.jpg", "/hotel.jpg", "/resort.jpg"],
    distance: "2 miles away",
    dates: "Jan 15-20",
    pricePerNight: 99.99,
  },
  {
    id: 2,
    title: "Mountain Cabin",
    images: ["/resort.jpg", "/hotel.jpg", "/resort.jpg"],
    distance: "5 miles away",
    dates: "Feb 1-5",
    pricePerNight: 149.99,
  },
  {
    id: 3,
    title: "City Apartment",
    images: ["/hotel.jpg", "/hotel.jpg", "/resort.jpg"],
    distance: "1 mile away",
    dates: "Mar 10-15",
    pricePerNight: 79.99,
  },
  {
    id: 4,
    title: "Lakeside Villa",
    images: ["/beachvilla.jpg", "/hotel.jpg", "/resort.jpg"],
    distance: "10 miles away",
    dates: "Apr 5-10",
    pricePerNight: 199.99,
  },
  {
    id: 5,
    title: "Desert Retreat",
    images: ["/beachvilla.jpg", "/hotel.jpg", "/resort.jpg"],
    distance: "15 miles away",
    dates: "May 1-7",
    pricePerNight: 129.99,
  },
];

export default function Properties() {
  const [filteredListings, setFilteredListings] = useState(properties);
  const [showMap, setShowMap] = useState(false);
  const [zoom, setZoom] = useState(12);

  const handleApplyFilters = (filters) => {
    const filtered = properties.filter((property) => {
      const price = property.pricePerNight;
      if (price < filters.minPrice || price > filters.maxPrice) {
        return false;
      }
      return true;
    });
    setFilteredListings(filtered);
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
      {/* Grid View */}
      {!showMap && (
        <>
          <section className="p-6 flex flex-col gap-6">
            <div className="flex justify-center gap-6">
              <Searchbar />
              <Filter onApplyFilters={handleApplyFilters} />
            </div>
            <h1 className="font-bold text-2xl self-center">All Properties</h1>
            <p className="font-semibold text-gray-500 self-center">
              Handpicked stays for your next adventure
            </p>
          </section>
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex justify-between">
              <h2 className="py-2 px-3 border border-amber-400 font-bold rounded-full w-fit mb-4">
                Phnom Penh
              </h2>
              <button
                onClick={() => setShowMap(true)}
                className="bg-black rounded-full text-white font-bold py-2 px-3 w-fit mb-4"
              >
                View in map
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredListings.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </section>
          <Footer />
        </>
      )}

      {/* Map View */}
      {showMap && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="relative h-screen w-screen overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-full">
              <Map
                zoom={zoom}
                onZoomChanged={(e) => setZoom(e.map.getZoom())}
                defaultCenter={{ lat: 11.5564, lng: 104.9282 }}
                disableDefaultUI={true}
                gestureHandling="greedy"
                mapId="af1b14d4f5d1b9695cb5c9d6"
              />
            </div>

            <div className="absolute top-6 z-10 w-full flex justify-center gap-4 px-6">
              <Searchbar />
              <Filter onApplyFilters={handleApplyFilters} />
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowMap(false)}
              className="absolute top-4 right-4 z-20 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Zoom controls */}
            <div className="absolute top-16 right-4 z-20 flex flex-col gap-2">
              <button
                onClick={() => setZoom((z) => Math.min(z + 1, 21))}
                className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z - 1, 1))}
                className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
              >
                <Minus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </APIProvider>
  );
}
