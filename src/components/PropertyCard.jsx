"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PropertyCard({ property }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide
      ? property.images.length - 1
      : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const isLastSlide = currentIndex === property.images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <Link href={`/properties/${property.id}`} className="group block">

      <div className="relative overflow-hidden rounded-xl aspect-square">

        <Image
          src={property.images[currentIndex]}
          alt={property.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
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
          {property.images.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-1.5 rounded-full ${
                currentIndex === index ? "bg-white" : "bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-3">
        <h3 className="font-semibold text-gray-900 truncate">
          {property.title}
        </h3>
        <p className="text-sm text-gray-600">{property.distance}</p>
        <p className="text-sm text-gray-600">{property.dates}</p>
        <div className="mt-1">
          <span className="font-bold">${property.pricePerNight}</span>
          <span className="text-sm text-gray-600">/ night</span>
        </div>
      </div>
    </Link>
  );
}
