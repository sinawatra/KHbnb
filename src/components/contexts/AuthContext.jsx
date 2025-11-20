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

  const fetchUserProfile = useCallback(
    async (userId) => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select(
            "user_id, full_name, email, phone_number, avatar_url, stripe_customer_id"
          )
          .eq("user_id", userId)
          .single();

        if (error) {
          console.warn("Profile fetch warning:", error.message);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
      }
    },
    [supabase]
  );

  useEffect(() => {
    const loadUserFromStorage = async () => {
      if (typeof window !== "undefined") {
        const storedSession = localStorage.getItem("session");
        const storedRole = localStorage.getItem("role");

        if (storedSession && storedRole) {
          try {
            const session = JSON.parse(storedSession);

            setUser({
              session,
              role: storedRole,
            });

            if (session?.user?.id) {
              await fetchUserProfile(session.user.id);
            }
          } catch (error) {
            console.error("Failed to parse session:", error);
            localStorage.removeItem("session");
            localStorage.removeItem("role");
            setUser(null);
            setProfile(null);
          }
        }
      }
      setLoading(false);
    };

    loadUserFromStorage();
  }, [fetchUserProfile]);

  const login = async (email, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("session", JSON.stringify(result.data.session));
        localStorage.setItem("role", result.data.role);

        setUser(result.data);

        if (result.data.session?.user?.id) {
          await fetchUserProfile(result.data.session.user.id);
        }

        router.refresh();
        return { success: true };
      }

      return { success: false, error: result.data?.details || "Login failed" };
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  };

  const signup = async (email, password, fullName, phoneNumber) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, phoneNumber }),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          message: result.data?.details || "Signup successful",
        };
      }

      return { success: false, error: result.data?.details || "Signup failed" };
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    localStorage.removeItem("session");
    localStorage.removeItem("role");
    setUser(null);
    setProfile(null);

    supabase.auth.signOut();
    router.refresh();
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
