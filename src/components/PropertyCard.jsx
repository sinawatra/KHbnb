"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useCurrency } from "./contexts/CurrencyContext";

const PROVINCE_MAP = {
  1: "Phnom Penh",
  2: "Siem Reap",
  3: "Sihanoukville",
  4: "Kampot",
  5: "Kep",
};

export default function PropertyCard({ property }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const { convertPrice } = useCurrency();
  const images = Array.isArray(property.image_urls)
    ? property.image_urls
    : typeof property.image_urls === "string"
    ? JSON.parse(property.image_urls || "[]")
    : [];

  // Filter out invalid URLs (blob, localhost, etc.) and only keep valid Supabase URLs
  const validImages = images.filter((url) => {
    if (!url || typeof url !== "string") return false;
    // Only accept URLs that start with https:// and contain supabase
    return url.startsWith("https://") && url.includes("supabase");
  });

  const hasValidImages = validImages.length > 0;

  const locationName =
    property.provinces?.name ||
    PROVINCE_MAP[property.province_id] ||
    "Cambodia";

  const goToPrevious = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? validImages.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const isLastSlide = currentIndex === validImages.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <Link
      href={`/properties/${property.properties_id}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-xl aspect-square bg-gray-100">
        {hasValidImages && !imageError ? (
          <>
            <Image
              src={validImages[currentIndex]}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
            {validImages.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/90 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={20} className="text-gray-800" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/90 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight size={20} className="text-gray-800" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                  {validImages.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 w-1.5 rounded-full ${
                        currentIndex === index ? "bg-white" : "bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center group-hover:bg-gray-200 transition-colors">
            <ImageOff
              size={64}
              className="text-gray-300 group-hover:text-gray-400 transition-colors"
            />
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-semibold text-gray-900 truncate">
          {property.title}
        </h3>

        <p className="text-sm text-gray-600">{locationName}</p>

        <div className="mt-1">
          <span className="font-bold">{convertPrice(property.price_per_night)}</span>{" "}
          <span className="text-sm text-gray-600">/ night</span>
        </div>
      </div>
    </Link>
  );
}
