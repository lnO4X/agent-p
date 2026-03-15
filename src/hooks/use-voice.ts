"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

interface UseVoiceReturn {
  /** Whether the microphone is currently recording */
  isRecording: boolean;
  /** Whether audio is being transcribed */
  isTranscribing: boolean;
  /** Whether TTS audio is playing */
  isPlaying: boolean;
  /** Start recording from microphone */
  startRecording: () => Promise<void>;
  /** Stop recording and transcribe */
  stopRecording: () => void;
  /** Play text as speech */
  speak: (text: string, voice?: string) => Promise<void>;
  /** Stop any playing audio */
  stopPlaying: () => void;
  /** Whether voice services are available (mic + service) */
  isAvailable: boolean;
}

/**
 * Hook for voice input (STT) and output (TTS).
 *
 * STT: Records audio from microphone → sends to /api/voice/stt → returns transcript
 * TTS: Sends text to /api/voice/tts → plays audio response
 *
 * Requires voice-service Docker container to be running.
 */
export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const { onTranscript, onError, language } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Probe voice service availability on mount
  useEffect(() => {
    let cancelled = false;
    async function probe() {
      try {
        // Check if the browser has mic support
        if (!navigator.mediaDevices?.getUserMedia) return;

        // Check if the voice service is up
        const res = await fetch("/api/voice/health", { signal: AbortSignal.timeout(3000) });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.available) setIsAvailable(true);
        }
      } catch {
        // Voice service not available — button stays hidden
      }
    }
    probe();
    return () => { cancelled = true; };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      // Prefer webm/opus for best browser support + compression
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Clean up stream
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        if (audioBlob.size < 100) {
          onError?.("Recording too short");
          return;
        }

        // Transcribe
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          if (language) {
            formData.append("language", language);
          }

          const res = await fetch("/api/voice/stt", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(
              (errData as { error?: string }).error || "Transcription failed"
            );
          }

          const data = await res.json();
          if (data.success && data.data?.text) {
            onTranscript?.(data.data.text);
          } else {
            onError?.("No speech detected");
          }
        } catch (err) {
          console.error("[voice] STT error:", err);
          const msg = err instanceof Error ? err.message : "Transcription failed";
          if (msg.includes("503") || msg.includes("unavailable")) {
            setIsAvailable(false);
          }
          onError?.(msg);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start(250); // Collect data every 250ms
      setIsRecording(true);
    } catch (err) {
      console.error("[voice] Mic access error:", err);
      onError?.("Microphone access denied");
    }
  }, [language, onTranscript, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const speak = useCallback(
    async (text: string, voice = "af_heart") => {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setIsPlaying(true);
      try {
        const res = await fetch("/api/voice/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice }),
        });

        if (!res.ok) {
          throw new Error("TTS request failed");
        }

        const audioBuffer = await res.arrayBuffer();
        const blob = new Blob([audioBuffer], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          audioRef.current = null;
          onError?.("Audio playback failed");
        };

        await audio.play();
      } catch (err) {
        setIsPlaying(false);
        console.error("[voice] TTS error:", err);
        const msg = err instanceof Error ? err.message : "Speech failed";
        if (msg.includes("503") || msg.includes("unavailable")) {
          setIsAvailable(false);
        }
        onError?.(msg);
      }
    },
    [onError]
  );

  const stopPlaying = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  return {
    isRecording,
    isTranscribing,
    isPlaying,
    startRecording,
    stopRecording,
    speak,
    stopPlaying,
    isAvailable,
  };
}
