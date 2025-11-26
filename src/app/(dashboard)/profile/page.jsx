"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Camera,
  Loader2,
  Edit2,
  Mail,
  Phone,
  Globe,
  Trash2,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/contexts/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, logout, fetchUserProfile } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/register");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhoneNumber(profile.phone_number || "");
    }
  }, [profile]);

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
        setIsAvatarDialogOpen(false);
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

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone_number: phoneNumber,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchUserProfile();
        setIsEditDialogOpen(false);
        alert("Profile updated successfully!");
      } else {
        alert("Update failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Network error updating profile");
    } finally {
      setIsUpdating(false);
    }
  };

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
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-bold text-3xl">Profile</h1>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your name and phone number
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <DialogClose asChild>
                <Button variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Profile Picture Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">
            PROFILE PHOTO
          </h3>
          <Dialog
            open={isAvatarDialogOpen}
            onOpenChange={setIsAvatarDialogOpen}
          >
            <DialogTrigger asChild>
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-gray-100 bg-gray-50 relative group cursor-pointer overflow-hidden transition-all hover:border-red-200">
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
                  <Camera className="w-12 h-12 text-red-600" />
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-white mx-auto mb-1" />
                    <p className="text-white text-sm font-semibold">
                      Change Photo
                    </p>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Profile Photo</DialogTitle>
                <DialogDescription>
                  Choose a new profile picture
                </DialogDescription>
              </DialogHeader>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="cursor-pointer"
              />
              <Button
                onClick={handleImageUpload}
                disabled={!selectedFile || uploading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Uploading...
                  </>
                ) : (
                  "Save Change"
                )}
              </Button>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Personal Information Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-6">
            PERSONAL INFORMATION
          </h3>

          <div className="space-y-6">
            {/* Name */}
            <div className="flex items-start gap-3 pb-4 border-b">
              <Edit2 className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Name</p>
                <p className="font-semibold text-gray-900">
                  {profile.full_name || "Not set"}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 pb-4 border-b">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-semibold text-gray-900">{profile.email}</p>
              </div>
            </div>

            {/* Country */}
            <div className="flex items-start gap-3 pb-4 border-b">
              <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Country</p>
                <p className="font-semibold text-gray-900">Cambodia</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                <p className="font-semibold text-gray-900">
                  {profile.phone_number || "Not set"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-red-200 bg-red-50/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Trash2 className="h-5 w-5 text-red-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Delete Account
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This account will no longer be available, and all your saved
                data will be permanently deleted.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center text-lg">
                      Delete account associated with <b>{profile.email}</b>?
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2">
                      This action cannot be undone. All your data will be
                      permanently deleted.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 mt-4">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="w-full"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Yes, delete my account"
                      )}
                    </Button>
                    <DialogClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={deleting}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
