"use client";

import { useState, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import { Check, Copy, Volume2, VolumeX, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

/** Custom markdown components for assistant message styling */
const mdComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-muted-foreground">{children}</em>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-foreground/5 px-1.5 py-0.5 rounded text-xs font-mono">
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-foreground/5 rounded-lg p-3 mb-2 overflow-x-auto text-xs">
      {children}
    </pre>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="font-semibold text-sm mb-1.5 mt-2 first:mt-0">{children}</h3>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="font-semibold text-sm mb-1.5 mt-2 first:mt-0">{children}</h3>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="font-semibold text-[13px] mb-1 mt-1.5 first:mt-0">{children}</h4>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-foreground/10" />,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto mb-2">
      <table className="text-xs w-full border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border border-foreground/10 px-2 py-1 text-left font-semibold bg-foreground/5">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-foreground/10 px-2 py-1">{children}</td>
  ),
};

export const MessageBubble = memo(function MessageBubble({
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
            "rounded-2xl px-4 py-2.5 text-sm select-text",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap break-words leading-relaxed"
              : "bg-muted text-foreground rounded-bl-md break-words"
          )}
        >
          {isUser ? (
            textContent
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={mdComponents}
            >
              {textContent}
            </ReactMarkdown>
          )}
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
});
