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
} from "lucide-react";
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
  const { profile, loading, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading) {
    return (
      <header className="w-full h-16 bg-white border-b flex items-center justify-between p-4">
        <div className="text-3xl font-bold text-primary ml-4">KHbnb</div>
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
      </header>
    );
  }

  return (
    <header className="w-full">
      <nav className="flex items-center justify-between p-4 bg-white">
        <div>
          <Link href="/" className="text-3xl font-bold text-primary ml-4">
            KHbnb
          </Link>
        </div>
        <div className="flex gap-4 items-center mr-6">

          {/* --- CURRENCY SWITCHER START --- */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Change Currency"
              >
                <ArrowRightLeft className="w-4 h-4 text-gray-500" />
                <span>{currency}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCurrency("USD")} className="cursor-pointer justify-between">
                <span>USD ($)</span>
                {currency === "USD" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrency("KHR")} className="cursor-pointer justify-between">
                <span>KHR (៛)</span>
                {currency === "KHR" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* --- CURRENCY SWITCHER END --- */}

          <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>

          <Link
            href="/properties"
            className="flex p-2 items-center space-x-2 font-medium text-gray-800 hover:text-primary hover:cursor-pointer"
          >
            Find property
          </Link>

          {profile ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account"
                  className="flex gap-2 rounded-xs p-2 hover:cursor-pointer group items-center"
                >
                  <User className="h-5 w-5 text-gray-600 group-hover:text-primary" />
                  <span className="font-medium text-gray-800 group-hover:text-primary">
                    {profile.full_name}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <UserRoundPen className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/subscription" className="cursor-pointer">
                    <CircleDollarSign className="mr-2 h-4 w-4" />
                    Subscription
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/payment" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payment
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/booking-history" className="cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    Booking History
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-primary"
                >
                  <LogOut className="mr-2 h-4 w-4 text-primary" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/register"
              className="rounded-4xl bg-primary px-6 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}