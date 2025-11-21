"use client";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useState } from "react";

export default function MapPin({ property, onClick, isSelected }) {
  const [isHovered, setIsHovered] = useState(false);

  const lat = Number(property.latitude);
  const lng = Number(property.longitude);

  if (isNaN(lat) || isNaN(lng)) return null;

  return (
    <AdvancedMarker
      position={{ lat: lat, lng: lng }}
      onClick={() => onClick(property)}
      zIndex={isHovered || isSelected ? 100 : 1}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          bg-white rounded-full px-3 py-1.5 font-semibold text-sm
          shadow-md cursor-pointer border border-gray-200
          transition-all duration-200
          ${
            isHovered || isSelected
              ? "scale-110 !bg-black text-white"
              : "hover:scale-105"
          }
        `}
      >
        ${property.price_per_night}
      </div>
    </AdvancedMarker>
  );
}
