"use client";
import { Search } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Command, CommandInput, CommandList, CommandGroup, CommandEmpty, CommandItem } from "./ui/command";
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
  const [checkIn, setCheckIn] = useState();
  const [checkOut, setCheckOut] = useState();
  const [location, setLocation] = useState("");


  return (
    <div className="p-6 bg-white border-b rounded-full">
      <Popover>
        <PopoverTrigger asChild>
          <div className="px-6 py-3 border-r flex flex-col cursor-pointer">
            <label className="text-xs font-semibold">Where to?</label>
            <input
              placeholder="Search destinations"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="outline-none"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
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
        <PopoverTrigger>
          <div className="px-6 py-3 border-r">
            <label className="text-xs font-semibold">Check in</label>
            <p>Add dates</p>
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} />
        </PopoverContent>
      </Popover>

      {/* Check-out */}
      <Popover>
        <PopoverTrigger>
          <div className="px-6 py-3 border-r">
            <label className="text-xs font-semibold">Check out</label>
            <p>Add dates</p>
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} />
        </PopoverContent>
      </Popover>

      {/* Guests */}
      <Popover>
        <PopoverTrigger>
          <div className="px-6 py-3">
            <label className="text-xs font-semibold">Add guests</label>
            <p>0 guests</p>
          </div>
        </PopoverTrigger>
        <PopoverContent>{/* Custom guest counter */}</PopoverContent>
      </Popover>

      {/* Search Button */}
      <Button className="rounded-full">
        <Search />
      </Button>
    </div>
  );
}
