"use client";

import { useCallback } from "react";
import { clearClientAuthCookie } from "@/lib/client-auth";

export function useAuth() {
  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    // Also clear client-side cookie (WeChat may not process Set-Cookie on logout response)
    clearClientAuthCookie();
    // Hard navigation for universal browser compatibility (WeChat/X5, Safari, etc.)
    window.location.href = "/login";
  }, []);

  return { logout };
}
