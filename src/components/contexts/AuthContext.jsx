"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscription, setSubscription] = useState({
    isPremium: false,
    tier: "free",
    status: null,
  });

  const supabase = createClientComponentClient();
  const router = useRouter();

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/user/profile");
      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  }, []);

  const fetchUserSubscription = useCallback(async () => {
    setSubscriptionLoading(true);
    try {
      const response = await fetch("/api/user/subscription-status");
      const result = await response.json();
      setSubscription(result);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      setSubscription({ isPremium: false, tier: "free", status: null });
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      setSubscriptionLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        setSession(session);
        await Promise.all([fetchUserProfile(), fetchUserSubscription()]);
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
        setSubscription({ isPremium: false, tier: "free", status: null });
      }
      setLoading(false);
      setSubscriptionLoading(false);
    };

    initAuth();

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setSession(session);
        if (event === "SIGNED_IN") {
          setSubscriptionLoading(true);

          await Promise.all([fetchUserProfile(), fetchUserSubscription()]);

          setSubscriptionLoading(false);
          router.refresh();
        }
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
        setSubscription({ isPremium: false, tier: "free", status: null });
        setSubscriptionLoading(false);
        router.refresh();
      }
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, [supabase, fetchUserProfile, fetchUserSubscription, router]);

  const login = async (email, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setSession(session);
          setUser(session.user);
          await fetchUserProfile();
        }

        router.refresh();
        return { success: true };
      }

      return { success: false, error: result.error || "Login failed" };
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  };

  const signup = async (email, password, fullName, phoneNumber) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone_number: phoneNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Log in the user after successful signup
        const loginResult = await login(email, password);
        if (loginResult.success) {
          return { success: true, message: "Signup and login successful" };
        } else {
          return { 
            success: true, 
            message: "Signup successful, but login failed. Please log in manually." 
          };
        }
      }
      return { success: false, error: result.error || "Signup failed" };
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    router.refresh();
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        subscription,
        isPremium: subscription.isPremium,
        login,
        signup,
        logout,
        loading,
        subscriptionLoading,
        fetchUserProfile,
        refreshSubscription: fetchUserSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
