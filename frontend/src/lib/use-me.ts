"use client";

import { useEffect, useState } from "react";
import { getMe, type Me } from "./api";

export function useMe() {
  const [me, setMe] = useState<Me | null>(() => {
    // Initialize with cached role if available for instant rendering
    if (typeof window !== "undefined") {
      const cachedRole = localStorage.getItem("user_role");
      if (cachedRole === "admin" || cachedRole === "student") {
        return { user_id: "", role: cachedRole };
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    
    // Get token from localStorage
    const token = localStorage.getItem("auth_token");
    
    if (!token) {
      setMe(null);
      localStorage.removeItem("user_role");
      setLoading(false);
      return;
    }

    getMe(token)
      .then((m) => {
        if (!cancelled) {
          setMe(m);
          // Cache role for instant access on next load
          localStorage.setItem("user_role", m.role);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          // Clear invalid token and cached role
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_role");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    
    return () => {
      cancelled = true;
    };
  }, []);

  const getToken = async () => {
    return localStorage.getItem("auth_token");
  };

  return {
    me,
    loading,
    error,
    getToken,
    isAdmin: me?.role === "admin",
  };
}
