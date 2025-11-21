"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
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
  const { user, profile, loading, logout, fetchUserProfile } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/register");
    }
  }, [user, loading, router]);

  if (loading) return <div className="p-4">Loading profile...</div>;
  if (!user) return null;
  if (!profile) return <div className="p-4">Error loading profile data.</div>;

  const handleImageUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const res = await fetch("/api/user/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        await fetchUserProfile();
        setIsDialogOpen(false);
        setSelectedFile(null);
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Network error uploading image");
    } finally {
      setUploading(false);
    }
  };

  // --- HANDLE ACCOUNT DELETION ---
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        await logout();
        router.push("/");
      } else {
        alert("Failed to delete: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("Network error deleting account");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="pl-4">
      <h1 className="font-bold text-2xl">Profile</h1>
      <p>Photo</p>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <div className="mb-10 mt-3 flex h-32 w-32 items-center justify-center rounded-full border bg-[#9797974D] relative group cursor-pointer overflow-hidden">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Profile Picture"
                fill
                className="object-cover"
                sizes="128px"
                priority
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
            <DialogTitle>Update Profile Photo</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </DialogDescription>
          <Button
            onClick={handleImageUpload}
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              "Save Change"
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {/* INFO SECTION */}
      <h3 className="text-[#00000080] font-semibold">Name</h3>
      <p className="font-medium mb-6">{profile.full_name}</p>

      <h3 className="text-[#00000080] font-semibold">Email</h3>
      <p className="font-medium mb-6">{profile.email}</p>

      <h3 className="text-[#00000080] font-semibold">Password</h3>
      <p className="font-medium mb-6">Reset password</p>

      <h3 className="text-[#00000080] font-semibold">Country</h3>
      <div className="flex gap-10 mb-6">
        <p className="font-medium">Cambodia</p>
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
                <b>{profile.email}</b>
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 mt-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="shadow-md"
                  disabled={deleting}
                >
                  No, take me back
                </Button>
              </DialogClose>

              <Button
                type="button"
                variant="ghost"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting
                  ? "Deleting..."
                  : "Yes, continue with the deletion of the account"}
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
