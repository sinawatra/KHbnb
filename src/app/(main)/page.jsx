import Image from "next/image";
import Link from "next/link";
import Searchbar from "@/components/Seachbar";
import { Button } from "@/components/ui/button";
import FeaturedProductCard from "@/components/FeaturedProductCard";
import { id } from "date-fns/locale/id";

const properties = [
  {
    id: "P001",
    title: "Beachfront Villa",
    location: "Sihanouk Ville",
    image: "/temple.jpg",
    price: 450,
  },
  {
    id: "P002",
    title: "Cozy Apartment",
    location: "Phnom Penh",
    image: "/temple.jpg",
    price: 120,
  },
  {
    id: "P003",
    title: "Luxury Resort",
    location: "Kep",
    image: "/temple.jpg",
    price: 230,
  },
];

export default function Home() {
  return (
    <>
      <main>
        <section className="p-10">
          <div className="flex mb-10">
            <div className="m-5 flex-1">
              <img
                src="/temple.jpg"
                alt="images"
                className="w-100 h-50 bg-grey-200"
              />
            </div>
            <div className="flex-1 self-center">
              <div className="w-1/2">
                <h1 className="font-bold text-[#FFB400] text-3xl">
                  Find Your Perfect Home Away From Home
                </h1>
                <h3 className="font-bold text-[#0000004d] text-lg">
                  Discover unique properties across Cambodia. From Beachfront,
                  villas to city apartments
                </h3>
              </div>
            </div>
          </div>
          <Searchbar />
        </section>

        <section className="mt-6 p-6">
          <div className="flex justify-between p-5">
            <div className="text-left">
              <h1 className="font-bold text-2xl">Featured Properties</h1>
              <h2>Handpicked stays for your next adventure</h2>
            </div>
            <Button variant="outline" className="mt-4 mb-4 bg-white">
              <Link href="/properties">View All</Link>
            </Button>
          </div>
          <div className="flex gap-10 p-5">
            {properties.map((property) => (
              <FeaturedProductCard key={property.id} product={property} />
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-10 border-t">
        <div className="p-10 text-center text-black bg-white flex">
          <div className="mx-auto text-left">
            <h1 className="text-primary font-bold text-xl mb-4">KHbnb</h1>
            <p className="text-gray-500 font-semibold">
              Your trusted partner for property rentals in Cambodia
            </p>
          </div>
          <div className="mx-auto text-left">
            <h1 className="font-bold">Province</h1>
            <p>Siem Reap</p>
            <p>Kep</p>
            <p>Kampot</p>
            <p>Sihanouk Ville</p>
            <p>Phnom Penh</p>
          </div>
        </div>
        <div className="p-10 text-center text-black border-t">
          &copy; 2025 KHbnb. All rights reserved.
        </div>
      </footer>
    </>
  );
}
