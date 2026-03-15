"use client";

import { useCallback, useEffect, useState } from "react";
import { useVoice } from "@/hooks/use-voice";
import { useI18n } from "@/i18n/context";
import { Mic, MicOff, Loader2, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  /** Called when speech is transcribed to text */
  onTranscript: (text: string) => void;
  /** Text to speak (pass latest assistant message for TTS) */
  speakText?: string;
  /** Whether the chat is currently streaming */
  disabled?: boolean;
}

/**
 * Voice input/output button for chat.
 *
 * - Tap: start recording → release: transcribe → inject into input
 * - Long-press listen icon: play TTS of last assistant message
 * - Shows recording indicator (pulsing red dot)
 * - Shows transcription spinner
 * - Gracefully degrades when voice service unavailable
 */
export function VoiceButton({ onTranscript, speakText, disabled }: VoiceButtonProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [showTts, setShowTts] = useState(false);

  const {
    isRecording,
    isTranscribing,
    isPlaying,
    startRecording,
    stopRecording,
    speak,
    stopPlaying,
    isAvailable,
  } = useVoice({
    onTranscript,
    onError: (err) => {
      console.warn("[voice-button]", err);
    },
    language: isZh ? "zh" : "en",
  });

  // Toggle TTS button visibility when there's speakText
  useEffect(() => {
    setShowTts(!!speakText);
  }, [speakText]);

  const handleMicClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleTtsClick = useCallback(() => {
    if (isPlaying) {
      stopPlaying();
    } else if (speakText) {
      speak(speakText);
    }
  }, [isPlaying, stopPlaying, speak, speakText]);

  if (!isAvailable) return null;

  return (
    <div className="flex items-center gap-1">
      {/* STT Button */}
      <button
        type="button"
        onClick={handleMicClick}
        disabled={disabled || isTranscribing}
        title={isRecording
          ? (isZh ? "停止录音" : "Stop recording")
          : (isZh ? "语音输入" : "Voice input")}
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

      {/* TTS Button (only when there's text to speak) */}
      {showTts && speakText && (
        <button
          type="button"
          onClick={handleTtsClick}
          disabled={disabled}
          title={isPlaying
            ? (isZh ? "停止播放" : "Stop playing")
            : (isZh ? "朗读回复" : "Read aloud")}
          className={cn(
            "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
            "transition-all pressable",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            isPlaying
              ? "bg-primary/20 text-primary"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          {isPlaying ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}
