"use client";

import { useRef, type KeyboardEvent, type FormEvent } from "react";
import { Send } from "lucide-react";
import { useI18n } from "@/i18n/context";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export function ChatInput({ value, onChange, onSend, isLoading }: ChatInputProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSend();
      }
    }
  };

  // Auto-resize textarea
  const handleInput = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSend();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3 border-t border-border bg-background/80 glass-nav">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          handleInput();
        }}
        onKeyDown={handleKeyDown}
        placeholder={t("chat.inputPlaceholder")}
        autoComplete="off"
        name="chat-message"
        rows={1}
        className="flex-1 resize-none rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 max-h-[120px]"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={!value.trim() || isLoading}
        className="pressable flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        <Send size={18} />
      </button>
    </form>
  );
}
