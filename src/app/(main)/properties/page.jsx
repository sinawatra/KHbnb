"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ListFilterPlus, X, Plus, Minus } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import Searchbar from "@/components/Seachbar";
import Footer from "@/components/Footer";
import Filter from "@/components/Filter";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import MapPin from "@/components/MapPin";
import MapPropertyCard from "@/components/MapPropertyCard";
import { useAuth } from "@/components/contexts/AuthContext";
import { createClient } from "@supabase/supabase-js";

// Define coordinates for major provinces
const PROVINCE_COORDINATES = {
  "Phnom Penh": { lat: 11.5564, lng: 104.9282, zoom: 12 },
  "Siem Reap": { lat: 13.3633, lng: 103.8564, zoom: 12 },
  Sihanoukville: { lat: 10.6253, lng: 103.5234, zoom: 12 },
  Kampot: { lat: 10.6104, lng: 104.1815, zoom: 12 },
  Kep: { lat: 10.4829, lng: 104.3167, zoom: 13 },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function PropertiesContent() {
  const searchParams = useSearchParams();
  const { session } = useAuth(); // Get Session from Context

  const [filteredListings, setFilteredListings] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const [center, setCenter] = useState(PROVINCE_COORDINATES["Phnom Penh"]);
  const [zoom, setZoom] = useState(12);

  const [loading, setLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState({});

  // Effect to sync Map Center with Search Params (Province)
  useEffect(() => {
    const provinceParam = searchParams.get("province");

    if (provinceParam) {
      const provinceKey = Object.keys(PROVINCE_COORDINATES).find(
        (key) => key.toLowerCase() === provinceParam.toLowerCase()
      );

      if (provinceKey) {
        const location = PROVINCE_COORDINATES[provinceKey];
        setCenter({ lat: location.lat, lng: location.lng });
        setZoom(location.zoom);
      }
    }
  }, [searchParams]);

  // Fetch properties function
  const fetchProperties = useCallback(
    async (filters = {}) => {
      setLoading(true);
      const province = searchParams.get("province");
      const guests = searchParams.get("guests");
      const params = new URLSearchParams();

      if (province) params.append("province", province);
      if (guests) params.append("guests", guests);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.beds && filters.beds !== "any")
        params.append("beds", filters.beds);
      if (filters.amenities?.length > 0) {
        params.append("amenities", filters.amenities.join(","));
      }

      const url = `/api/properties${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      // Use the session token from context first
      const accessToken = session?.access_token;

      fetch(url, {
        headers: {
          "Content-Type": "application/json",
          // Only attach Authorization if the token exists
          ...(accessToken && {
            Authorization: `Bearer ${accessToken}`,
          }),
        },
      })
        .then((res) => res.json())
        .then((data) => {
          // console.log("API Response:", data);
          if (data.success) {
            const validProperties = data.data.map((p) => ({
              ...p,
              latitude: Number(p.latitude),
              longitude: Number(p.longitude),
            }));
            setFilteredListings(validProperties);
          } else {
            console.warn("Filter failed:", data.data?.details);

            // UX Fix: Alert user if premium is required
            if (data.data?.details === "Premium subscription required") {
              alert("You need a Premium subscription to use these filters.");
            } else if (
              data.data?.details === "Login required for premium filters"
            ) {
              alert("Please log in to use Premium filters.");
            }

            setFilteredListings([]);
          }
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => setLoading(false));
    },
    // Add session to dependency array so it refetches when auth loads
    [searchParams, session]
  );

  // Initial load
  useEffect(() => {
    fetchProperties(appliedFilters);
  }, [fetchProperties, appliedFilters]);

  // Handle filter application
  const handleApplyFilters = (filters) => {
    // console.log("Applying filters:", filters);
    setAppliedFilters(filters);
    fetchProperties(filters);
  };

  const groupedByProvince = filteredListings.reduce((acc, property) => {
    const provinceName = property.provinces?.name || "Unknown";
    const provinceId = property.province_id;
    if (!acc[provinceName]) {
      acc[provinceName] = {
        id: provinceId,
        properties: [],
      };
    }
    acc[provinceName].properties.push(property);
    return acc;
  }, {});

  const sortedProvinces = Object.entries(groupedByProvince).sort(
    ([, a], [, b]) => a.id - b.id
  );

  const getActiveFilterCount = () => {
    let count = 0;
    if (appliedFilters.minPrice > 0) count++;
    if (appliedFilters.maxPrice < 500) count++;
    if (appliedFilters.beds && appliedFilters.beds !== "any") count++;
    if (appliedFilters.amenities && appliedFilters.amenities.length > 0) {
      count += appliedFilters.amenities.length;
    }
    return count;
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
      {/* Grid View */}
      {!showMap && (
        <>
          <section className="p-6 flex flex-col gap-6">
            <div className="flex justify-center gap-6">
              <Searchbar />
              <Filter
                onApplyFilters={handleApplyFilters}
                currentFilters={appliedFilters}
                activeCount={getActiveFilterCount()}
              />
            </div>
            <h1 className="font-bold text-2xl self-center">All Properties</h1>
            <p className="font-semibold text-gray-500 self-center">
              Handpicked stays for your next adventure
            </p>
          </section>

          {filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No properties found matching your filters
              </p>
            </div>
          ) : (
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {sortedProvinces.map(([provinceName, { properties }], index) => (
                <div key={provinceName} className="mb-12">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="py-2 px-3 border border-amber-400 font-bold rounded-full w-fit">
                      {provinceName}
                    </h2>
                    {index === 0 && (
                      <button
                        onClick={() => setShowMap(true)}
                        className="bg-black rounded-full text-white font-bold py-2 px-3"
                      >
                        View in map
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {properties.map((property) => (
                      <PropertyCard
                        key={property.properties_id}
                        property={property}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}
          <Footer />
        </>
      )}
      {/* Map View */}
      {showMap && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="relative h-screen w-screen overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-full">
              <Map
                defaultCenter={center}
                defaultZoom={zoom}
                disableDefaultUI={true}
                gestureHandling="greedy"
                mapId="af1b14d4f5d1b9695cb5c9d6"
                onClick={() => setSelectedProperty(null)}
                onCameraChanged={(ev) => {
                  setCenter(ev.detail.center);
                  setZoom(ev.detail.zoom);
                }}
              >
                {filteredListings
                  .filter(
                    (property) =>
                      property.latitude != null &&
                      property.longitude != null &&
                      !isNaN(Number(property.latitude)) &&
                      !isNaN(Number(property.longitude))
                  )
                  .map((property) => (
                    <MapPin
                      key={property.properties_id}
                      property={property}
                      position={{
                        lat: Number(property.latitude),
                        lng: Number(property.longitude),
                      }}
                      onClick={setSelectedProperty}
                      isSelected={
                        selectedProperty?.properties_id ===
                        property.properties_id
                      }
                    />
                  ))}
              </Map>
            </div>
            {selectedProperty && (
              <MapPropertyCard
                property={selectedProperty}
                onClose={() => setSelectedProperty(null)}
                activeCount={getActiveFilterCount()}
              />
            )}
            <div className="absolute top-6 z-10 w-full flex justify-center gap-4 px-6">
              <Searchbar />
              <Filter
                onApplyFilters={handleApplyFilters}
                currentFilters={appliedFilters}
                activeCount={getActiveFilterCount()}
              />
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

export default function Properties() {
  return (
    <Suspense
      fallback={<div className="p-6 text-center">Loading properties...</div>}
    >
      <PropertiesContent />
    </Suspense>
  );
}
