"use client";
import Image from "next/image";
import { X } from "lucide-react";

export default function MapPropertyCard({ property, onClose }) {
  const imageSrc =
    property.images && property.images[0]
      ? property.images[0]
      : "/beachvilla.jpg";

  const handleClick = () => {
    const id = property.properties_id || property.id;
    window.open(`/properties/${id}`, "_blank");
  };

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 w-80">
      <div
        onClick={handleClick}
        className="bg-white rounded-xl shadow-2xl overflow-hidden cursor-pointer hover:shadow-3xl transition-shadow"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2 right-2 z-10 bg-white rounded-full p-1.5 shadow-md hover:shadow-lg"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative h-48 w-full bg-gray-100">
          <Image
            src={imageSrc}
            alt={property.title || "Property"}
            fill
            className="object-cover"
            onError={(e) => {
              e.currentTarget.src = "/beachvilla.jpg";
              e.currentTarget.srcset = "/beachvilla.jpg";
            }}
          />
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 truncate">
            {property.title || "Untitled Property"}
          </h3>
          <p className="text-gray-500 text-sm mb-1">
            {property.distance || "Distance info N/A"}
          </p>
          <p className="text-gray-500 text-sm mb-2">
            {property.dates || "Dates N/A"}
          </p>
          <p className="font-semibold">
            ${property.price_per_night || property.pricePerNight || "0"}{" "}
            <span className="font-normal">night</span>
          </p>
        </div>
      </div>
    </div>
  );
}
