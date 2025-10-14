"use client";

import Image from "next/image";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage({ imageURL = null }) {
  return (
    <div className="pl-4">
      <h1 className="font-bold text-2xl">Profile</h1>
      <p>Photo</p>
      <div className="mb-10 mt-3 flex h-32 w-32 items-center justify-center rounded-full border bg-[#9797974D]">
        {imageURL ? (
          <label
            htmlFor="profile-upload"
            className="relative w-32 h-32 group cursor-pointer block"
          >
            <Image
              src={imageURL}
              alt="Profile Picture"
              width={128}
              height={128}
              className="rounded-full object-cover"
            />

            <div className="absolute inset-0 bg-[#0000004D] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white font-semibold rounded">Change Photo</p>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files[0])}
              className="hidden"
              id="profile-upload"
            />
          </label>
        ) : (
          <Camera className="h-10 w-10 text-primary" />
        )}
      </div>

      <h3 className="text-[#00000080] font-semibold">Name</h3>
      <p className="font-medium mb-6">Cheata</p>

      <h3 className="text-[#00000080] font-semibold">Email</h3>
      <p className="font-medium mb-6">cheata@example.com</p>

      <h3 className="text-[#00000080] font-semibold">Password</h3>
      <p className="font-medium mb-6">Reset password</p>

      <h3 className="text-[#00000080] font-semibold">Country</h3>
      <div className="flex gap-10 mb-6">
        <p className="font-medium">Cambodia</p>
        <button className="font-bold mr-10 hover:cursor-pointer">Edit</button>
      </div>

      <h3 className="text-[#00000080] font-semibold">Phone Number</h3>
      <div className="flex gap-10 mb-10">
        <p className="font-medium">+855 123 456 789</p>
        <button className="font-bold mr-10 hover:cursor-pointer">Edit</button>
      </div>

      <div className="flex pt-4 border-t mt-4">
        <Dialog>
          <DialogTrigger asChild>
            <button className="text-primary font-bold mr-10 hover:cursor-pointer">
              Delete Account
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Are you sure you wish to delete the account?
              </DialogTitle>
              <Label className="mt-4" htmlFor="reason">
                cheata@example.com
              </Label>
            </DialogHeader>

            <DialogFooter className="sm:justify-start">
              <DialogClose asChild>
                <Button type="button" variant="destructive">
                  No, take me back
                </Button>
              </DialogClose>
              <Button type="button" variant="ghost">
                Yes, continue with the deletion of the account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <p>
          This account will no longer be available, and all your saved data will
          be permanently deleted.
        </p>
      </div>
    </div>
  );
}
