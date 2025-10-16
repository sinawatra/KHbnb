import Image from "next/image";
import Link from "next/link";
import Searchbar from "@/components/Seachbar";

export default function Home() {
  return (
    <main>
      <section>
        <div className="flex">
          <div>
            <img src="#" alt="images" className="w-100 h-50 bg-green-400" />
          </div>
          <div className="flex flex-col self-center">
            <h1 className="font-bold text-[#FFB400] text-3xl">Find Your Perfect Home Away From Home</h1>
            <h3 className="font-bold text-[#0000004d] text-lg">
              Discover unique properties across Cambodia. From Beachfront,
              villas to city apartments
            </h3>
          </div>
        </div>
        <Searchbar></Searchbar>
      </section>
    </main>
  );
}
