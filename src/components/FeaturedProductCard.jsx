"use client";
import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCurrency } from "@/components/contexts/CurrencyContext";

export default function FeaturedProductCard({ product }) {
  const { convertPrice } = useCurrency();

  return (
    <Link href={`/properties/${product.id}`}>
      <div className="bg-white shadow-md rounded-lg overflow-hidden w-100 hover:shadow-xl transition-shadow cursor-pointer">
        <div className="relative w-100 h-60">
          <Image
            src={product.image}
            alt={product.title}
            fill={true}
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold">{product.title}</h3>
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-gray-500 mb-1" />
            <p className="text-gray-600 p-2">{product.location}</p>
          </div>

          <div className="flex justify-between items-center mt-4 pb-2">
            <span className="text-primary font-bold">
              {convertPrice(product.price)}
              <span className="text-gray-400 font-semibold">/ night</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
