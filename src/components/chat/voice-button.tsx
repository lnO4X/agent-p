"use client";

import { useCallback } from "react";
import { useI18n } from "@/i18n/context";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  /** Whether microphone is recording */
  isRecording: boolean;
  /** Whether audio is being transcribed */
  isTranscribing: boolean;
  /** Start recording */
  onStartRecording: () => void;
  /** Stop recording */
  onStopRecording: () => void;
  /** Whether the button should be disabled */
  disabled?: boolean;
}

/**
 * STT microphone button for chat.
 *
 * - Tap to start recording → tap again to stop → auto-transcribe → auto-send
 * - Shows recording indicator (pulsing red)
 * - Shows transcription spinner
 */
export function VoiceButton({
  isRecording,
  isTranscribing,
  onStartRecording,
  onStopRecording,
  disabled,
}: VoiceButtonProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const handleClick = useCallback(() => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  }, [isRecording, onStartRecording, onStopRecording]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isTranscribing}
      title={
        isRecording
          ? isZh
            ? "停止录音"
            : "Stop recording"
          : isZh
            ? "语音输入"
            : "Voice input"
      }
      className={cn(
        "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
        "transition-all pressable",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        isRecording
          ? "bg-destructive text-destructive-foreground animate-pulse"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
      )}
    >
      {isTranscribing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}
