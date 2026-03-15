"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useI18n } from "@/i18n/context";
import { MessageBubble } from "./message-bubble";
import { MemoryBanner } from "./memory-banner";
import { PartnerSettingsSheet } from "./partner-settings-sheet";
import { getPartnerIcon } from "./partner-icons";
import { VoiceButton } from "./voice-button";
import { useVoice } from "@/hooks/use-voice";
import { ArrowLeft, Settings, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Partner } from "@/types/partner";

interface PartnerConversationProps {
  partnerId: string;
}

// Extract text from UIMessage parts
function extractPartText(
  parts: Array<{ type: string; text?: string }>
): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text || "")
    .join("");
}

const SUGGESTION_KEYS = [
  "partners.suggestions.analyze",
  "partners.suggestions.recommend",
  "partners.suggestions.improve",
  "partners.suggestions.compare",
] as const;

export function PartnerConversation({ partnerId }: PartnerConversationProps) {
  const { t, locale } = useI18n();
  const isZh = locale === "zh";
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [greeting, setGreeting] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [retrying, setRetrying] = useState(false);
  const hasAutoRetriedRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Voice state
  const [lastInputWasVoice, setLastInputWasVoice] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [speakLoading, setSpeakLoading] = useState(false);
  const prevMsgCountRef = useRef(0);

  const voiceHook = useVoice({
    onTranscript: useCallback((text: string) => {
      // Voice auto-send: transcript → direct send message
      if (text.trim()) {
        setLastInputWasVoice(true);
        // We'll send via sendMessage in an effect
        setPendingVoiceText(text.trim());
      }
    }, []),
    onError: (err) => {
      console.warn("[voice]", err);
    },
    language: isZh ? "zh" : "en",
  });

  const [pendingVoiceText, setPendingVoiceText] = useState<string | null>(null);

  // Load partner data
  useEffect(() => {
    async function loadPartner() {
      try {
        const res = await fetch("/api/partners");
        if (res.ok) {
          const data = await res.json();
          const found = (data.data as Partner[]).find(
            (p) => p.id === partnerId
          );
          setPartner(found || null);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadPartner();

    // Fetch proactive greeting (Premium only, fire-and-forget)
    fetch(`/api/partners/${partnerId}/greeting`)
      .then((r) => r.json())
      .then((data) => {
        if (data.greeting) setGreeting(data.greeting);
      })
      .catch(() => {});
  }, [partnerId]);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      credentials: "include",
      body: { partnerId },
    }),
  });

  const isStreaming = status === "submitted" || status === "streaming";

  // Send pending voice text as soon as sendMessage is available
  useEffect(() => {
    if (pendingVoiceText && !isStreaming) {
      sendMessage({ text: pendingVoiceText });
      setPendingVoiceText(null);
    }
  }, [pendingVoiceText, isStreaming, sendMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-play TTS when AI finishes responding and last input was voice
  useEffect(() => {
    if (
      lastInputWasVoice &&
      status === "ready" &&
      messages.length > prevMsgCountRef.current
    ) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant") {
        const text = extractPartText(
          lastMsg.parts as Array<{ type: string; text?: string }>
        );
        if (text) {
          // Auto-play TTS for the new assistant message
          handleSpeak(lastMsg.id, text);
        }
      }
      // Reset voice mode after auto-play trigger
      setLastInputWasVoice(false);
    }
    prevMsgCountRef.current = messages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, messages.length, lastInputWasVoice]);

  // Memory extraction on unmount
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const partnerIdRef = useRef(partnerId);
  partnerIdRef.current = partnerId;

  useEffect(() => {
    return () => {
      const msgs = messagesRef.current;
      if (msgs.length > 2) {
        const text = msgs
          .map(
            (m) =>
              `${m.role}: ${extractPartText(m.parts as Array<{ type: string; text?: string }>)}`
          )
          .join("\n");
        fetch(`/api/partners/${partnerIdRef.current}/memory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationText: text }),
        }).catch(() => {});
      }
    };
  }, []);

  // Auto-retry once on error (2s delay before showing error to user)
  useEffect(() => {
    if (!error || hasAutoRetriedRef.current) return;
    hasAutoRetriedRef.current = true;
    setRetrying(true);
    retryTimerRef.current = setTimeout(() => {
      const msgs = messagesRef.current;
      const lastUser = msgs.filter((m) => m.role === "user").pop();
      if (lastUser) {
        const text = extractPartText(
          lastUser.parts as Array<{ type: string; text?: string }>
        );
        if (text) sendMessage({ text });
      }
      setRetrying(false);
    }, 2000);
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [error, sendMessage]);

  // Reset retry state on successful response
  useEffect(() => {
    if (status === "streaming" || status === "ready") {
      hasAutoRetriedRef.current = false;
      setRetrying(false);
    }
  }, [status]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setLastInputWasVoice(false); // Text input — don't auto-play TTS
    sendMessage({ text });
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (key: string) => {
    sendMessage({ text: t(key) });
  };

  // Per-message TTS: speak or stop
  const handleSpeak = useCallback(
    async (msgId: string, text: string) => {
      if (speakingMsgId === msgId) {
        // Stop current playback
        voiceHook.stopPlaying();
        setSpeakingMsgId(null);
        return;
      }

      // Stop any existing playback first
      voiceHook.stopPlaying();
      setSpeakingMsgId(msgId);
      setSpeakLoading(true);

      try {
        await voiceHook.speak(text, { language: isZh ? "zh" : "en" });
        setSpeakLoading(false);
        // speakingMsgId will be cleared when audio ends
      } catch {
        setSpeakingMsgId(null);
        setSpeakLoading(false);
      }
    },
    [speakingMsgId, voiceHook, isZh]
  );

  // Clear speakingMsgId when voice stops playing
  useEffect(() => {
    if (!voiceHook.isPlaying && speakingMsgId && !speakLoading) {
      setSpeakingMsgId(null);
    }
  }, [voiceHook.isPlaying, speakingMsgId, speakLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-muted-foreground">Partner not found</p>
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="text-sm text-primary pressable"
        >
          {t("partners.back")}
        </button>
      </div>
    );
  }

  const Icon = getPartnerIcon(partner.avatar);

  return (
    <div className="flex flex-col h-[calc(100dvh-2.75rem)] md:h-[calc(100dvh-3.5rem)] max-w-lg mx-auto">
      {/* Nav bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-foreground/10 glass-nav">
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="pressable p-1 -ml-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="font-semibold text-sm flex-1">{partner.name}</span>
        {partner.slot !== 0 && (
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="pressable p-1"
          >
            <Settings className="w-4.5 h-4.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Memory banner */}
      <MemoryBanner memory={partner.memory} partnerName={partner.name} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12">
            <Icon className="w-10 h-10 text-primary/30 mx-auto mb-3" />
            <p>{partner.name}</p>
            {greeting && (
              <div className="mt-4 mx-auto max-w-xs">
                <div className="inline-block text-left bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-foreground">
                  {greeting}
                </div>
              </div>
            )}
          </div>
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
            voiceAvailable={voiceHook.isAvailable}
            onSpeak={(text) => handleSpeak(msg.id, text)}
            isSpeaking={speakingMsgId === msg.id && voiceHook.isPlaying}
            isSpeakLoading={speakingMsgId === msg.id && speakLoading}
          />
        ))}
        {status === "submitted" && (
          <div className="flex justify-start mb-3">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        {retrying && (
          <div className="flex justify-center py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{isZh ? "正在重试..." : "Retrying..."}</span>
            </div>
          </div>
        )}
        {error && !retrying && (
          <div className="flex justify-center py-3">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-muted/80 border border-foreground/5 max-w-xs">
              <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">!</span>
              </div>
              <p className="text-xs text-muted-foreground flex-1">
                {error.message === "Failed to fetch"
                  ? (isZh ? "网络连接中断" : "Connection lost")
                  : (isZh ? "发送失败，请重试" : "Failed to send")}
              </p>
              <button
                type="button"
                onClick={() => {
                  const last = messages.filter((m) => m.role === "user").pop();
                  if (last) {
                    const text = extractPartText(last.parts as Array<{ type: string; text?: string }>);
                    if (text) sendMessage({ text });
                  }
                }}
                className="text-xs text-primary font-medium pressable flex-shrink-0"
              >
                {isZh ? "重试" : "Retry"}
              </button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips (only show when no messages yet) */}
      {messages.length === 0 && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SUGGESTION_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSuggestion(key)}
              className={cn(
                "flex-shrink-0 text-xs px-3 py-1.5 rounded-full",
                "bg-primary/10 text-primary",
                "pressable hover:bg-primary/15 transition-colors"
              )}
            >
              {t(key)}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="px-4 pt-2 pb-[calc(0.5rem_+_3.5rem_+_env(safe-area-inset-bottom))] md:pb-2 border-t border-foreground/10 glass-nav">
        <div className="flex items-end gap-2">
          {voiceHook.isAvailable && (
            <VoiceButton
              isRecording={voiceHook.isRecording}
              isTranscribing={voiceHook.isTranscribing}
              onStartRecording={voiceHook.startRecording}
              onStopRecording={voiceHook.stopRecording}
              disabled={isStreaming}
            />
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={t("chat.inputPlaceholder")}
            autoComplete="off"
            enterKeyHint="send"
            name="chat-message"
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm",
              "bg-muted/50 border border-foreground/10",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
              "placeholder:text-muted-foreground/50",
              "max-h-[120px]"
            )}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className={cn(
              "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
              "bg-primary text-primary-foreground",
              "pressable disabled:opacity-40 disabled:cursor-not-allowed",
              "transition-opacity"
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

      {/* Partner settings sheet */}
      {partner.slot !== 0 && (
        <PartnerSettingsSheet
          partner={partner}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onUpdated={(updated) => setPartner(updated)}
        />
      )}
    </div>
  );
}
