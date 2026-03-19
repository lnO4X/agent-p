"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useI18n } from "@/i18n/context";
import { MessageBubble } from "./message-bubble";
import { PARTNER_ICON_MAP, PARTNER_ICON_NAMES } from "./partner-icons";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function PartnerInitFlow() {
  const { t, locale } = useI18n();
  const isZh = locale === "zh";
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [definition, setDefinition] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Brain");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/partners/init",
      credentials: "include",
    }),
  });

  const isStreaming = status === "submitted" || status === "streaming";

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detect definition code block in assistant messages
  useEffect(() => {
    if (step !== 1) return;

    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistant) return;

    const text = lastAssistant.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { type: string; text?: string }).text || "")
      .join("");

    const match = text.match(/```definition\s*\n([\s\S]*?)```/);
    if (match) {
      setDefinition(match[1].trim());
      // Extract suggested name from definition
      const nameMatch = match[1].match(/^#\s*(.+)/m);
      if (nameMatch) {
        setName(nameMatch[1].trim());
      }
      // Auto-advance to step 2
      setTimeout(() => setStep(2), 500);
    }
  }, [messages, step]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    sendMessage({ text });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !definition.trim()) return;
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatar: selectedIcon,
          definition: definition,
        }),
      });

      if (res.ok) {
        router.push("/chat");
      } else {
        const data = await res.json().catch(() => ({}));
        setCreateError(data.error || (isZh ? "创建失败，请重试" : "Failed to create, please retry"));
      }
    } catch {
      setCreateError(isZh ? "网络错误，请重试" : "Network error, please retry");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-w-lg mx-auto">
      {/* Nav bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-foreground/10 glass-nav">
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="pressable p-1 -ml-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-sm flex-1">
          {t("partners.init.title")}
        </span>
        {/* Step indicator */}
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                s === step
                  ? "bg-primary"
                  : s < step
                    ? "bg-primary/40"
                    : "bg-foreground/15"
              )}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Mini chat */}
      {step === 1 && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground text-xs py-8">
                {t("partners.init.chatHint")}
              </p>
            )}
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role as "user" | "assistant"}
                parts={msg.parts as Array<{ type: string; text?: string }>}
                isStreaming={
                  isStreaming &&
                  msg.id === messages[messages.length - 1]?.id &&
                  msg.role === "assistant"
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-foreground/10">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("chat.inputPlaceholder")}
                autoComplete="off"
                name="init-chat-message"
                rows={1}
                className={cn(
                  "flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm",
                  "bg-muted/50 border border-foreground/10",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30",
                  "placeholder:text-muted-foreground/50"
                )}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className={cn(
                  "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                  "bg-primary text-primary-foreground",
                  "pressable disabled:opacity-40"
                )}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14M12 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Step 2: Icon selection */}
      {step === 2 && (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <h2 className="text-base font-semibold mb-4 text-center">
            {t("partners.init.step2")}
          </h2>

          <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto mb-8">
            {PARTNER_ICON_NAMES.map((iconName) => {
              const IconComp = PARTNER_ICON_MAP[iconName];
              const isSelected = selectedIcon === iconName;
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedIcon(iconName)}
                  className={cn(
                    "aspect-square rounded-2xl flex items-center justify-center",
                    "transition-all pressable",
                    isSelected
                      ? "bg-primary/15 ring-2 ring-primary"
                      : "bg-muted/50 ring-1 ring-foreground/10 hover:ring-primary/30"
                  )}
                >
                  <IconComp
                    className={cn(
                      "w-6 h-6",
                      isSelected ? "text-primary" : "text-foreground/60"
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setStep(3)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-medium",
                "bg-primary text-primary-foreground",
                "pressable"
              )}
            >
              {t("common.confirm")}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <h2 className="text-base font-semibold mb-6 text-center">
            {t("partners.init.step3")}
          </h2>

          {/* Preview card */}
          <div className="max-w-xs mx-auto mb-6">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-card ring-1 ring-foreground/10">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                {(() => {
                  const IconComp = PARTNER_ICON_MAP[selectedIcon];
                  return <IconComp className="w-5 h-5 text-primary" />;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{name || "..."}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {definition.split("\n").find((l) => l.trim() && !l.startsWith("#"))?.trim() || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Name input */}
          <div className="max-w-xs mx-auto mb-6">
            <label className="text-xs text-muted-foreground mb-1.5 block">
              {t("partners.init.nameLabel")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("partners.init.namePlaceholder")}
              maxLength={20}
              className={cn(
                "w-full rounded-xl px-4 py-2.5 text-sm",
                "bg-muted/50 border border-foreground/10",
                "focus:outline-none focus:ring-2 focus:ring-primary/30"
              )}
            />
          </div>

          {/* Error message */}
          {createError && (
            <div className="max-w-xs mx-auto text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2 text-center">
              {createError}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => setStep(2)}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium",
                "bg-muted text-foreground",
                "pressable"
              )}
            >
              {t("common.back")}
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium",
                "bg-primary text-primary-foreground",
                "pressable disabled:opacity-40",
                "flex items-center justify-center gap-1.5"
              )}
            >
              <Check className="w-4 h-4" />
              {creating ? t("common.loading") : t("partners.init.confirm")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
