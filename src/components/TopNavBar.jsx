"use client";
import Link from "next/link";
import {
  User,
  LogOut,
  UserRoundPen,
  Calendar,
  CreditCard,
  ArrowRightLeft,
  Check,
  CircleDollarSign,
  Globe,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useCurrency } from "./contexts/CurrencyContext";

export default function TopNavBar() {
  const { t, i18n } = useTranslation();
  const { profile, loading, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading) {
    return (
      <header className="fixed top-0 z-50 w-full h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 transition-all duration-300">
        <div className="text-2xl font-bold text-primary">KHbnb</div>
        <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <nav className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <div className="flex-shrink-0">
          <Link href="/" className="text-2xl font-bold text-primary tracking-tight hover:opacity-90 transition-opacity">
            KHbnb
          </Link>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">

          {/* --- LANGUAGE SWITCHER START --- */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full transition-all duration-200"
                aria-label="Change Language"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase text-xs sm:text-sm">{i18n.language}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => i18n.changeLanguage("en")} className="cursor-pointer">
                <span className="flex-1">English</span>
                {i18n.language === "en" && <Check className="h-3.5 w-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => i18n.changeLanguage("km")} className="cursor-pointer">
                <span className="flex-1">Khmer</span>
                {i18n.language === "km" && <Check className="h-3.5 w-3.5" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* --- LANGUAGE SWITCHER END --- */}

          {/* --- CURRENCY SWITCHER START --- */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full transition-all duration-200"
                aria-label="Change Currency"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span className="text-xs sm:text-sm">{currency}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => setCurrency("USD")} className="cursor-pointer">
                <span className="flex-1">USD ($)</span>
                {currency === "USD" && <Check className="h-3.5 w-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrency("KHR")} className="cursor-pointer">
                <span className="flex-1">KHR (៛)</span>
                {currency === "KHR" && <Check className="h-3.5 w-3.5" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* --- CURRENCY SWITCHER END --- */}

          <div className="hidden sm:block">
            <Link
              href="/properties"
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors duration-200"
            >
              {t("nav.find_property")}
            </Link>
          </div>

          {profile ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account"
                  className="flex items-center gap-2 pl-2 pr-4 py-1.5 ml-1 rounded-full border border-gray-200 hover:shadow-md transition-all duration-200 bg-white"
                >
                  <div className="h-7 w-7 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  {/* Truncate long names on mobile if needed, but for now show full */}
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline-block max-w-[100px] truncate">
                    {profile.full_name?.split(' ')[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 mt-2 p-1">
                <div className="px-2 py-1.5 border-b border-gray-50 mb-1">
                  <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer w-full flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                    <UserRoundPen className="mr-2 h-4 w-4 text-gray-500" />
                    {t("nav.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/subscription" className="cursor-pointer w-full flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                    <CircleDollarSign className="mr-2 h-4 w-4 text-gray-500" />
                    {t("nav.subscription")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/payment" className="cursor-pointer w-full flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                    <CreditCard className="mr-2 h-4 w-4 text-gray-500" />
                    {t("nav.payment")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/booking-history" className="cursor-pointer w-full flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                    {t("nav.bookings")}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 mx-2 bg-gray-100" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer w-full flex items-center px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md focus:text-red-700 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/register"
              className="ml-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 hover:shadow-md transition-all duration-200"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}