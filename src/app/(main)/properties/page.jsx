import Link from "next/link";
import Searchbar from "@/components/Seachbar";
import Footer from "@/components/Footer";

export default function Properties() {
  return (
    <>
      <section className="p-6 flex flex-col items-center gap-6">
        <Searchbar />
        <h1 className="font-bold text-2xl">All Properties</h1>
        <p className="font-semibold text-gray-500">Handpicked stays for your next adventure</p>
      </section>

      <section className="p-6">
        <h2>Phnom Penh</h2>
      </section>
      t
      <Footer />
    </>
  );
}
