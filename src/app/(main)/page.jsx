"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

const Searchbar = dynamic(() => import("@/components/Seachbar"), {
  loading: () => <div className="w-full max-w-5xl h-16 bg-gray-100 rounded-full animate-pulse" />,
});
const FeaturedPropertiesSection = dynamic(() => import("@/components/FeaturedPropertiesSection"), {
  loading: () => <div className="h-96 w-full animate-pulse bg-gray-50" />,
});
const Footer = dynamic(() => import("@/components/Footer"));

export default function Home() {
  const { t } = useTranslation();

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
                      priority
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
                <h1 className="font-bold text-amber-600 text-4xl mb-4 !text-center w-2/3">
                  {t("home.hero_title")}
                </h1>
                <p className="font-bold text-gray-600 text-lg !text-center w-2/3">
                  {t("home.hero_subtitle")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Searchbar />
          </div>
        </section>

        <FeaturedPropertiesSection />
      </main>

      <Footer />
    </>
  );
}
