"use client";
import {
  Search,
  FlagTriangleRight,
  Calendar as CalendarIcon,
  UsersRound,
} from "lucide-react";
import { Calendar } from "./ui/calendar";
import { useState, useEffect, Suspense } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandEmpty,
  CommandItem,
} from "./ui/command";
import { Button } from "./ui/button";
import { useRouter, useSearchParams } from "next/navigation";

const provinces = [
  "Phnom Penh",
  "Siem Reap",
  "Sihanouk ville",
  "Kampot",
  "Kep",
  "Koh Kong",
];

function SearchBarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [location, setLocation] = useState(searchParams.get("province") || "");
  const [adults, setAdults] = useState(Number(searchParams.get("adults")) || 0);
  const [children, setChildren] = useState(Number(searchParams.get("children")) || 0);
  const [infants, setInfants] = useState(Number(searchParams.get("infants")) || 0);

  const [date, setDate] = useState({ 
    from: searchParams.get("from") ? new Date(searchParams.get("from")) : undefined,
    to: searchParams.get("to") ? new Date(searchParams.get("to")) : undefined 
  });

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const totalGuests = adults + children + infants;

  const formatDate = (dateObj) => {
    if (!dateObj) return "Add dates";
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

const handleSearch = () => {
    if (location) {
      const params = new URLSearchParams();
      
      params.append("province", location);
      
      if (adults > 0) params.append("adults", adults.toString());
      if (children > 0) params.append("children", children.toString());
      if (infants > 0) params.append("infants", infants.toString());
      if (totalGuests > 0) params.append("guests", totalGuests.toString());
      if (date?.from) params.append("from", date.from.toISOString());
      if (date?.to) params.append("to", date.to.toISOString());

      router.push(`/properties?${params.toString()}`);
    } else {
      router.push("/properties");
    }
  };

  return (
    <div className="pl-2 bg-white border-2 border-gray-300 rounded-full flex w-full max-w-5xl items-center shadow-sm hover:shadow-md transition">
      <Popover open={isLocationOpen} onOpenChange={setIsLocationOpen}>
        <PopoverTrigger asChild>
          <div className="flex-1 px-6 py-3 border-r flex items-center gap-3 cursor-pointer">
            <FlagTriangleRight />
            <div className="flex flex-col">
              <label className="font-semibold text-xs">Where to?</label>
              <input
                placeholder="Search destinations"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="outline-none text-sm text-gray-600"
              />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          avoidCollisions={false}
          side="bottom"
          className="w-[300px] p-0"
        >
          <Command>
            <CommandInput placeholder="Search provinces..." />
            <CommandList>
              <CommandEmpty>No province found.</CommandEmpty>
              <CommandGroup heading="Provinces">
                {provinces.map((province) => (
                  <CommandItem
                    key={province}
                    onSelect={() => {
                      setLocation(province);
                      setIsLocationOpen(false);
                    }}
                  >
                    {province}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Check-in */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex-1 px-6 py-3 border-r flex items-center gap-3">
            <CalendarIcon />
            <div className="flex flex-col text-left">
              <label className="font-semibold text-xs">Check in</label>
              <p className="text-sm text-gray-600">{formatDate(date?.from)}</p>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent
          avoidCollisions={false}
          side="bottom"
          align="start"
          sideOffset={5}
          className="w-auto p-0"
        >
          <Calendar
            mode="range"
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            disabled={(date) => date < new Date()}
            showOutsideDays={false}
          />
        </PopoverContent>
      </Popover>

      {/* Check-out */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex-1 px-6 py-3 border-r flex items-center gap-3">
            <CalendarIcon />
            <div className="flex flex-col text-left">
              <label className="font-semibold text-xs">Check out</label>
              <p className="text-sm text-gray-600">{formatDate(date?.to)}</p>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent
          avoidCollisions={false}
          side="bottom"
          align="start"
          sideOffset={5}
          className="w-auto p-0"
        >
          <Calendar
            mode="range"
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            disabled={(date) => date < new Date()}
            showOutsideDays={false}
          />
        </PopoverContent>
      </Popover>

      {/* Guests */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="px-6 py-3 flex items-center gap-3 whitespace-nowrap">
            <UsersRound className="w-5 h-5" />
            <div className="flex flex-col text-left">
              <label className="font-semibold text-xs">Add guests</label>
              <p className="text-sm text-gray-600">
                {totalGuests > 0
                  ? `${totalGuests} guest${totalGuests > 1 ? "s" : ""}`
                  : "Add guests"}
              </p>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={5}
          className="w-[360px] p-0"
          avoidCollisions={false}
        >
          <div className="p-6">
            {/* Adults */}
            <div className="border-b flex justify-between items-center pb-4 mb-4">
              <div>
                <p className="font-semibold">Adult</p>
                <p className="text-sm text-gray-500">Ages 13+</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setAdults(Math.max(0, adults - 1))}
                  className="w-8 h-8 border rounded-full hover:border-black transition disabled:opacity-30"
                  disabled={adults === 0}
                >
                  -
                </button>
                <span className="w-8 text-center">{adults}</span>
                <button
                  onClick={() => setAdults(adults + 1)}
                  className="w-8 h-8 border rounded-full hover:border-black transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Children */}
            <div className="border-b flex justify-between items-center pb-4 mb-4">
              <div>
                <p className="font-semibold">Children</p>
                <p className="text-sm text-gray-500">Ages 2-12</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setChildren(Math.max(0, children - 1))}
                  className="w-8 h-8 border rounded-full hover:border-black transition disabled:opacity-30"
                  disabled={children === 0}
                >
                  -
                </button>
                <span className="w-8 text-center">{children}</span>
                <button
                  onClick={() => setChildren(children + 1)}
                  className="w-8 h-8 border rounded-full hover:border-black transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Infants */}
            <div className="flex justify-between items-center pb-4">
              <div>
                <p className="font-semibold">Infants</p>
                <p className="text-sm text-gray-500">Under 2</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setInfants(Math.max(0, infants - 1))}
                  className="w-8 h-8 border rounded-full hover:border-black transition disabled:opacity-30"
                  disabled={infants === 0}
                >
                  -
                </button>
                <span className="w-8 text-center">{infants}</span>
                <button
                  onClick={() => setInfants(infants + 1)}
                  className="w-8 h-8 border rounded-full hover:border-black transition"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Search Button */}
      <Button
        className="rounded-full p-3 mr-2 align-center self-center bg-red-600 hover:bg-red-700"
        onClick={handleSearch}
        aria-label="Search"
      >
        <Search />
      </Button>
    </div>
  );
}

export default function Searchbar() {
  return (
    <Suspense fallback={<div className="w-full h-16 bg-gray-100 rounded-full animate-pulse" />}>
      <SearchBarContent />
    </Suspense>
  );
}