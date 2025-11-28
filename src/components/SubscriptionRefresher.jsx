"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/contexts/AuthContext";

export default function SubscriptionRefresher() {
  const pathname = usePathname();
  const { user, refreshSubscription } = useAuth();

  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [pathname, user, refreshSubscription]);

  return null;
}
