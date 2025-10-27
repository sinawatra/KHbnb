"use client";
import {
  Search,
  FlagTriangleRight,
  Calendar as CalendarIcon,
  UsersRound,
} from "lucide-react";
import { Calendar } from "./ui/calendar";
import { useState } from "react";
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

const provinces = [
  "Phnom Penh",
  "Siem Reap",
  "Sihanouk ville",
  "Kampot",
  "Kep",
  "Koh Kong",
];

export default function Searchbar() {
  const [date, setDate] = useState({ from: undefined, to: undefined });
  const [location, setLocation] = useState("");

  const formatDate = (dateObj) => {
    if (!dateObj) return "Add dates";
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="pl-2 bg-white border-2 border-gray-300 rounded-full flex w-full max-w-5xl items-center">
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex-1 px-6 py-3 border-r flex items-center gap-3 cursor-pointer">
            <FlagTriangleRight />
            <div className="flex flex-col">
              <label className="font-semibold">Where to?</label>
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
              <label className="font-semibold">Check in</label>
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
              <label className="font-semibold">Check out</label>
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
              <label className="font-semibold">Add guests</label>
              <p className="text-sm text-gray-600">0 guests</p>
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
            <div className="border-b flex justify-between items-center pb-4 mb-4">
              <div>
                <p>Adult</p>
                <p>Ages 13+</p>
              </div>
              <div className="flex justify-between items-center">
                <button className="px-3 py-1 border rounded-full">-</button>
                <p className="mr-4 ml-4">0</p>
                <button className="px-3 py-1 border rounded-full">+</button>
              </div>
            </div>
            <div className="border-b flex justify-between items-center pb-4 mb-4">
              <div>
                <p>Children</p>
                <p>Ages 2-12</p>
              </div>
              <div className="flex justify-between items-center">
                <button className="px-3 py-1 border rounded-full">-</button>
                <p className="mr-4 ml-4">0</p>
                <button className="px-3 py-1 border rounded-full">+</button>
              </div>
            </div>
            <div className="border-b flex justify-between items-center pb-4 mb-4">
              <div>
                <p>Infants</p>
                <p>Under 2</p>
              </div>
              <div className="flex justify-between items-center">
                <button className="px-3 py-1 border rounded-full">-</button>
                <p className="mr-4 ml-4">0</p>
                <button className="px-3 py-1 border rounded-full">+</button>
              </div>
            </div>
            <div className="border-b flex justify-between items-center pb-4 mb-4">
              <div>
                <p>Pets</p>
              </div>
              <div className="flex justify-between items-center">
                <button className="px-3 py-1 border rounded-full">-</button>
                <p className="mr-4 ml-4">0</p>
                <button className="px-3 py-1 border rounded-full">+</button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Search Button */}
      <Button className="rounded-full p-3 mr-2 align-center self-center">
        <Search />
      </Button>
    </div>
  );
}
