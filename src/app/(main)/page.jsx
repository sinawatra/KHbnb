import Image from "next/image";
import Link from "next/link";
import Searchbar from "@/components/Seachbar";
import { Button } from "@/components/ui/button";
import FeaturedProductCard from "@/components/FeaturedProductCard";
import { id } from "date-fns/locale/id";
import Footer from "@/components/Footer";

const properties = [
  {
    id: "P001",
    title: "Beachfront Villa",
    location: "Sihanouk Ville",
    image: "/beachvilla.jpg",
    price: 450,
  },
  {
    id: "P002",
    title: "Cozy Apartment",
    location: "Phnom Penh",
    image: "/hotel.jpg",
    price: 120,
  },
  {
    id: "P003",
    title: "Luxury Resort",
    location: "Kep",
    image: "/resort.jpg",
    price: 230,
  },
  {
    id: "P004",
    title: "Beachfront Villa",
    location: "Sihanouk Ville",
    image: "/beachvilla.jpg",
    price: 450,
  },
  {
    id: "P005",
    title: "Cozy Apartment",
    location: "Phnom Penh",
    image: "/hotel.jpg",
    price: 120,
  },
  {
    id: "P006",
    title: "Luxury Resort",
    location: "Kep",
    image: "/resort.jpg",
    price: 230,
  },
];

export default function Home() {
  return (
    <>
      <main>
        <section className="p-10 bg-[#fcfcfc] border-t">
          <div className="flex mb-10">
            <div className="m-5 justify-center flex flex-1">
              <div className="relative w-full h-[450px] flex items-center justify-center">
                <div className="relative w-[700px] h-[400px]">
                  <div className="absolute top-8 -left-8 w-92 h-80 transform -rotate-6 shadow-lg">
                    <Image
                      src="/temple.jpg"
                      alt="property left"
                      fill={true}
                      className="object-cover rounded-xl"
                    />
                  </div>

                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-100 h-96 z-20 shadow-2xl">
                    <Image
                      src="/beachvilla.jpg"
                      alt="property front"
                      fill={true}
                      className="object-cover rounded-xl"
                    />
                  </div>

                  <div className="absolute top-8 -right-8 w-92 h-80 transform rotate-6 shadow-lg">
                    <Image
                      src="/resort.jpg"
                      alt="property right"
                      fill={true}
                      className="object-cover rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 self-center">
              <div className="w-full flex flex-col items-center">
                <h1 className="font-bold text-[#FFB400] text-4xl mb-4 !text-center w-2/3">
                  Find Your Perfect Home Away From Home
                </h1>
                <h3 className="font-bold text-[#0000004d] text-lg !text-center w-2/3">
                  Discover unique properties across Cambodia. From Beachfront,
                  villas to city apartments
                </h3>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Searchbar />
          </div>
        </section>

        <section className="p-6">
          <div className="flex justify-between p-5">
            <div className="text-left">
              <h1 className="font-bold text-2xl">Featured Properties</h1>
              <h2>Handpicked stays for your next adventure</h2>
            </div>
            <Button variant="outline" className="mt-4 mb-4 bg-white">
              <Link href="/properties">View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-10 p-5">
            {properties.map((property) => (
              <FeaturedProductCard key={property.id} product={property} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
