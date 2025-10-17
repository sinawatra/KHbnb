import { MapPin } from "lucide-react";

export default function FeaturedProductCard({ product }) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden w-100">
      <img
        src={product.image}
        alt={product.title}
        className="w-100 h-60 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{product.title}</h3>
        <div className="flex items-center">
          <MapPin className="w-5 h-5 text-gray-500 mb-1"/>
          <p className="text-gray-600 p-2">{product.location}</p>
        </div>

        <div className="flex justify-between items-center mt-4 pb-2">
          <span className="text-primary font-bold">
            ${product.price}{" "}
            <span className="text-gray-400 font-semibold">/ night</span>
          </span>
        </div>
      </div>
    </div>
  );
}
