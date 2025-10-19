"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("user_id, full_name, email, phone_number, image_url")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  };

  useEffect(() => {
    const storedSession = localStorage.getItem("session");
    const storedRole = localStorage.getItem("role");

    if (storedSession && storedRole) {
      try {
        const session = JSON.parse(storedSession);
        setUser({
          session,
          role: storedRole,
        });
        fetchUserProfile(session.user.id);
      } catch (error) {
        localStorage.removeItem("session");
        localStorage.removeItem("role");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
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
      await fetchUserProfile(result.data.session.user.id);
      return { success: true };
    }

    return { success: false, error: result.data.details };
  };

  const signup = async (email, password, fullName, phoneNumber) => {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, phoneNumber }),
    });

    const result = await response.json();

    if (result.success) {
      localStorage.setItem("session", JSON.stringify(result.data.session));
      localStorage.setItem("role", result.data.role);
      setUser(result.data);
      await fetchUserProfile(result.data.session.user.id);
      return { success: true };
    }

    return { success: false, error: result.data.details };
  };

  const logout = () => {
    localStorage.removeItem("session");
    localStorage.removeItem("role");
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, login, signup, logout, loading, fetchUserProfile }}
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