"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/contexts/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push("/register");
    }
  }, [user, router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  const handleImageUpload = (file) => {
    console.log("Uploaded file:", file);
  };

  return (
    <div className="pl-4">
      <h1 className="font-bold text-2xl">Profile</h1>
      <p>Photo</p>
      <Dialog>
        <DialogTrigger asChild>
          <div className="mb-10 mt-3 flex h-32 w-32 items-center justify-center rounded-full border bg-[#9797974D] relative group cursor-pointer">
            {profile.image_url ? (
              <Image
                src={profile.image_url}
                alt="Profile Picture"
                width={128}
                height={128}
                className="rounded-full object-cover"
              />
            ) : (
              <Camera className="w-12 h-12 text-primary" />
            )}

            <div className="absolute inset-0 bg-[#0000004D] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white font-semibold">Upload Image</p>
            </div>
          </div>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select an Image to Upload</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <Input
              type="file"
              accept="image/*"
              onClick={(e) => handleImageUpload(e.target.files[0])}
              id="profile-upload"
            />
          </DialogDescription>
          <Button type="button" variant="destructive" className="mt-4 w-full">
            Save
          </Button>
        </DialogContent>
      </Dialog>

      <h3 className="text-[#00000080] font-semibold">Name</h3>
      <p className="font-medium mb-6">{profile.full_name}</p>

      <h3 className="text-[#00000080] font-semibold">Email</h3>
      <p className="font-medium mb-6">{profile.email}</p>

      <h3 className="text-[#00000080] font-semibold">Password</h3>
      <p className="font-medium mb-6">Reset password</p>

      <h3 className="text-[#00000080] font-semibold">Country</h3>
      <div className="flex gap-10 mb-6">
        <p className="font-medium">Cambodia</p>
        <button className="font-bold mr-10 hover:cursor-pointer">Edit</button>
      </div>

      <h3 className="text-[#00000080] font-semibold">Phone Number</h3>
      <div className="flex gap-10 mb-10">
        <p className="font-medium">
          {profile.phone_number ? profile.phone_number : "Enter Phone Number"}
        </p>
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
              <DialogTitle className="text-center text-lg">
                Do you wish to delete the account associated with{" "}
                <b>user.email@example.com</b>
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 mt-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="shadow-md"
                >
                  No, take me back
                </Button>
              </DialogClose>
              <Button type="button" variant="ghost">
                Yes, continue with the deletion of the account
              </Button>
            </div>
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
