"use client";
import Link from "next/link";
import {
  User,
  LogOut,
  UserRoundPen,
  Calendar,
  CreditCard,
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

export default function TopNavBar() {
  const { profile, loading, logout } = useAuth();
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
        <div className="flex gap-15 items-center mr-6">
          <Link
            href="/properties"
            className="flex p-2 items-center space-x-2 font-medium text-gray-800 hover:text-primary hover:cursor-pointer"
          >
            Find property
          </Link>

          {profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account"
                  className="flex gap-2 rounded-xs p-2 hover:cursor-pointer group"
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
              className="rounded-4xl bg-primary px-10 py-3 text-sm font-semibold text-white hover:shadow-lg"
            >
              SIGN UP / LOGIN
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
