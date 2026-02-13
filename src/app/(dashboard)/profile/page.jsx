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
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, logout, fetchUserProfile } = useAuth();
  const { t } = useTranslation();

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

  if (loading) return <div className="p-4">{t("profile.loading")}</div>;
  if (!user) return null;
  if (!profile) return <div className="p-4">{t("profile.error_loading")}</div>;

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
        alert(t("profile.profile_updated"));
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
        <h1 className="font-bold text-3xl">{t("profile.title")}</h1>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Edit2 className="h-4 w-4" />
              {t("profile.edit_profile")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("profile.edit_profile")}</DialogTitle>
              <DialogDescription>
                {t("profile.update_name_phone")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="fullName">{t("profile.full_name")}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("profile.full_name_placeholder")}
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">{t("profile.phone_number")}</Label>
                <Input
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={t("profile.phone_placeholder")}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <DialogClose asChild>
                <Button
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-black"
              >
                  {t("profile.cancel")}
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
                    {t("profile.updating")}
                  </>
                ) : (
                  t("profile.save_changes")
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
            {t("profile.profile_photo")}
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
                      {t("profile.change_photo")}
                    </p>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("profile.update_photo")}</DialogTitle>
                <DialogDescription>
                  {t("profile.choose_photo")}
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
                    {t("profile.uploading")}
                  </>
                ) : (
                  t("profile.save_change")
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
            {t("profile.personal_info")}
          </h3>

          <div className="space-y-6">
            {/* Name */}
            <div className="flex items-start gap-3 pb-4 border-b">
              <Edit2 className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">{t("profile.name")}</p>
                <p className="font-semibold text-gray-900">
                  {profile.full_name || t("profile.not_set")}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 pb-4 border-b">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">{t("profile.email")}</p>
                <p className="font-semibold text-gray-900">{profile.email}</p>
              </div>
            </div>

            {/* Country */}
            <div className="flex items-start gap-3 pb-4 border-b">
              <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">{t("profile.country")}</p>
                <p className="font-semibold text-gray-900">{t("profile.cambodia")}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">{t("profile.phone_number")}</p>
                <p className="font-semibold text-gray-900">
                  {profile.phone_number || t("profile.not_set")}
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
                {t("profile.delete_account")}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {t("profile.delete_account_desc")}
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    {t("profile.delete_account")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center text-lg">
                      {t("profile.delete_confirm")} <b>{profile.email}</b>?
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2">
                      {t("profile.delete_warning")}
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
                          {t("profile.deleting")}
                        </>
                      ) : (
                        t("profile.yes_delete")
                      )}
                    </Button>
                    <DialogClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={deleting}
                        className="w-full"
                      >
                        {t("profile.cancel")}
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
