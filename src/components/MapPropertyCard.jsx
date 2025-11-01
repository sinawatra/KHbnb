"use client";
import Image from "next/image";
import { X } from "lucide-react";

export default function MapPropertyCard({ property, onClose }) {
  const handleClick = () => {
    window.open(`/properties/${property.id}`, '_blank');
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
        
        <div className="relative h-48 w-full">
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
          <p className="text-gray-500 text-sm mb-1">{property.distance}</p>
          <p className="text-gray-500 text-sm mb-2">{property.dates}</p>
          <p className="font-semibold">
            ${property.pricePerNight} <span className="font-normal">night</span>
          </p>
        </div>
      </div>
    </div>
  );
}