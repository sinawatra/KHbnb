"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CancelSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to cancel");

      alert(
        "Subscription cancelled. You will retain access until the end of your billing period."
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      className="w-full"
      onClick={handleCancel}
      disabled={isLoading}
    >
      {isLoading ? "Cancelling..." : "Cancel Subscription"}
    </Button>
  );
}
