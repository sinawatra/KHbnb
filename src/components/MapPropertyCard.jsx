import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

export default function MapPropertyCard({ property, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const rawImages = property.images || property.image_urls;

  const images = Array.isArray(rawImages)
    ? rawImages
    : typeof rawImages === "string"
    ? JSON.parse(rawImages || "[]")
    : [];

  // Filter for valid Supabase URLs
  const validImages = images.filter((url) => {
    if (!url || typeof url !== "string") return false;
    return url.startsWith("https://") || url.startsWith("/");
  });

  const hasValidImages = validImages.length > 0;

  const handleClick = () => {
    const id = property.properties_id || property.id;
    window.open(`/properties/${id}`, "_blank");
  };

  const goToPrevious = (e) => {
    e.stopPropagation();
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? validImages.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = (e) => {
    e.stopPropagation();
    const isLastSlide = currentIndex === validImages.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 w-80">
      <div
        onClick={handleClick}
        className="bg-white rounded-xl shadow-2xl overflow-hidden cursor-pointer hover:shadow-3xl transition-shadow group"
      >
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2 right-2 z-20 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition-colors"
        >
          <X className="w-4 h-4 text-gray-700" />
        </button>

        {/* Image Carousel Container */}
        <div className="relative h-48 w-full bg-gray-100">
          {hasValidImages && !imageError ? (
            <>
              <img
                src={validImages[currentIndex]}
                alt={property.title || "Property"}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
                onError={() => setImageError(true)}
              />

              {/* Navigation Arrows - Only show if > 1 image */}
              {validImages.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <ChevronLeft size={16} className="text-gray-800" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <ChevronRight size={16} className="text-gray-800" />
                  </button>

                  {/* Dots Indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                    {validImages.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 w-1.5 rounded-full shadow-sm transition-all ${
                          currentIndex === index
                            ? "bg-white scale-125"
                            : "bg-white/60 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            /* Fallback State */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200">
              <ImageOff className="text-gray-400 w-10 h-10 mb-2" />
              <span className="text-xs text-gray-500">No images available</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 truncate text-gray-900">
            {property.title || "Untitled Property"}
          </h3>
          <p className="text-gray-500 text-sm mb-1 truncate">
            {property.distance || "Location info available"}
          </p>
          <p className="text-gray-500 text-sm mb-2">
            {property.dates || "Available now"}
          </p>
          <p className="font-semibold text-gray-900">
            ${property.price_per_night || property.pricePerNight || "0"}{" "}
            <span className="font-normal text-gray-600">night</span>
          </p>
        </div>
      </div>
    </div>
  );
}
