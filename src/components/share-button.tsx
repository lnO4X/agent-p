"use client";

import { useState, useCallback } from "react";
import { Share2 } from "lucide-react";

interface ShareButtonProps {
  url: string;
  title: string;
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [url, title]);

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      <Share2 size={12} />
      {copied ? "Copied" : "Share"}
    </button>
  );
}
