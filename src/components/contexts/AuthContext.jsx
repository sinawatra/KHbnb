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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const initAuth = async () => {
      // Check active session from Supabase (verifies Cookie)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        await fetchUserProfile();
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        if (event === "SIGNED_IN") {
          await fetchUserProfile();
          router.refresh();
        }
      } else {
        setUser(null);
        setProfile(null);
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserProfile, router]);

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
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUser(user);
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
        return { success: true, message: "Signup successful" };
      }
      return { success: false, error: result.error || "Signup failed" };
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.refresh();
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        login,
        signup,
        logout,
        loading,
        fetchUserProfile,
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
