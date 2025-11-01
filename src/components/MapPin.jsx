"use client";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useState } from "react";

export default function MapPin({ property, onClick, isSelected }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AdvancedMarker
      position={{ lat: property.lat, lng: property.lng }}
      onClick={() => onClick(property)}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          bg-white rounded-full px-3 py-1.5 font-semibold text-sm
          shadow-md cursor-pointer border border-gray-200
          transition-all duration-200
          ${isHovered || isSelected ? 'scale-110 bg-black text-white z-50' : 'hover:scale-105'}
        `}
      >
        ${property.pricePerNight}
      </div>
    </AdvancedMarker>
  );
}