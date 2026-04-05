"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

/**
 * Auto-tracks page_view on every route change.
 * Mount once in root layout. Fire-and-forget, never blocks rendering.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent("page_view", { path: pathname });
  }, [pathname]);

  return null;
}
