"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FeaturedProductCard from "@/components/FeaturedProductCard";

export default function FeaturedPropertiesSection() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/properties/featured")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          const allProperties = Object.values(result.data).flat().slice(0, 6);
          setProperties(allProperties);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="p-6 text-center">Loading properties...</div>;

  return (
    <section className="p-6">
      <div className="flex justify-between p-5">
        <div className="text-left">
          <h1 className="font-bold text-2xl">Featured Properties</h1>
          <h2>Handpicked stays for your next adventure</h2>
        </div>
        <Link href="/properties" passHref>
          <Button variant="outline" className="mt-4 mb-4 bg-white">
            View All
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-10 p-5">
        {properties.map((property) => (
          <FeaturedProductCard
            key={property.properties_id}
            product={{
              id: property.properties_id,
              title: property.title,
              location: property.provinces?.name || "Cambodia",
              image: property.image_urls?.[0] || "/beachvilla.jpg",
              price: property.price_per_night,
            }}
          />
        ))}
      </div>
    </section>
  );
}
