"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parts: Array<any>;
  isStreaming?: boolean;
}

export function MessageBubble({ role, parts, isStreaming }: MessageBubbleProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  // Extract text content from parts
  const textContent = parts
    .filter((p) => p.type === "text")
    .map((p) => p.text || "")
    .join("");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = textContent;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [textContent]);

  return (
    <div
      className={cn(
        "group flex w-full mb-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className="relative max-w-[85%] md:max-w-[70%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words select-text",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          )}
        >
          {textContent}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-current opacity-70 animate-pulse rounded-sm" />
          )}
        </div>

        {/* Copy button — appears on hover/tap, not during streaming */}
        {!isStreaming && textContent && (
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "absolute -bottom-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity",
              "p-1 rounded-md bg-background/80 backdrop-blur-sm ring-1 ring-foreground/10",
              "hover:bg-muted text-muted-foreground hover:text-foreground",
              isUser ? "right-0" : "left-0",
              copied && "opacity-100"
            )}
            title="Copy"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
