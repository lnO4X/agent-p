"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Check, Copy, Volume2, VolumeX, Loader2 } from "lucide-react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parts: Array<any>;
  isStreaming?: boolean;
  /** Called when the user clicks the TTS button on this message */
  onSpeak?: (text: string) => void;
  /** Whether TTS is currently playing for this message */
  isSpeaking?: boolean;
  /** Whether TTS audio is being loaded for this message */
  isSpeakLoading?: boolean;
  /** Whether voice services are available */
  voiceAvailable?: boolean;
}

export function MessageBubble({
  role,
  parts,
  isStreaming,
  onSpeak,
  isSpeaking,
  isSpeakLoading,
  voiceAvailable,
}: MessageBubbleProps) {
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

        {/* Action buttons — always visible on mobile, hover on desktop */}
        {!isStreaming && textContent && (
          <div
            className={cn(
              "absolute -bottom-2 flex items-center gap-1 transition-opacity",
              "opacity-60 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100",
              isUser ? "right-0" : "left-0",
              (copied || isSpeaking) && "!opacity-100"
            )}
          >
            {/* TTS button — assistant messages only */}
            {!isUser && voiceAvailable && onSpeak && (
              <button
                type="button"
                onClick={() => onSpeak(textContent)}
                disabled={isSpeakLoading}
                className={cn(
                  "p-1.5 rounded-lg bg-background/80 backdrop-blur-sm ring-1 ring-foreground/10",
                  "hover:bg-muted text-muted-foreground hover:text-foreground",
                  "active:scale-95 transition-transform",
                  isSpeaking && "text-primary ring-primary/30"
                )}
                title={isSpeaking ? "Stop" : "Read aloud"}
              >
                {isSpeakLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSpeaking ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            )}
            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "p-1.5 rounded-lg bg-background/80 backdrop-blur-sm ring-1 ring-foreground/10",
                "hover:bg-muted text-muted-foreground hover:text-foreground",
                "active:scale-95 transition-transform"
              )}
              title="Copy"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
