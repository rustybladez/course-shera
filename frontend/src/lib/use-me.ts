"use client";

import { useEffect, useState } from "react";
import { getMe, type Me } from "./api";

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
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
      setLoading(false);
      return;
    }

    getMe(token)
      .then((m) => {
        if (!cancelled) setMe(m);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          // Clear invalid token
          localStorage.removeItem("auth_token");
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
