/**
 * Audio feedback library for GameTan games.
 *
 * Design constraints:
 * - No external files (oscillator-generated for zero bundle cost)
 * - Lazy AudioContext init (must wait for user gesture per browser autoplay policy)
 * - Respects localStorage mute toggle
 * - For Tier B precision games: only use playSound() AFTER response is recorded,
 *   never during stimulus onset or during-response. Stimulus-time audio confounds RT.
 */

type SoundName = "click" | "success" | "error" | "pop" | "coin" | "warn";

// Lazy-initialized context (must be created on first user gesture)
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

export function isAudioMuted(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem("gametan-audio-muted") === "1";
  } catch {
    return false;
  }
}

export function setAudioMuted(muted: boolean): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (muted) localStorage.setItem("gametan-audio-muted", "1");
    else localStorage.removeItem("gametan-audio-muted");
  } catch {
    // localStorage can throw in private browsing / quota errors — swallow.
  }
}

/**
 * Play a short sound. No-op if muted, context unavailable, or SSR.
 * Safe to call often — cheap (< 1ms per call).
 */
export function playSound(name: SoundName, volume = 0.3): void {
  if (isAudioMuted()) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") {
    // Resume on first interaction (handled automatically by browser on user gesture,
    // but some envs require explicit resume)
    c.resume().catch(() => {});
  }
  const now = c.currentTime;
  switch (name) {
    case "click": {
      // Short tick — 200 Hz square, 20ms
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "square";
      osc.frequency.value = 200;
      g.gain.setValueAtTime(volume * 0.5, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.connect(g);
      g.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.03);
      break;
    }
    case "success": {
      // Upward chime — 400 -> 800 Hz sine, 150ms
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
      g.gain.setValueAtTime(volume, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(g);
      g.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.16);
      break;
    }
    case "error": {
      // Short buzzer — 120 Hz square, 80ms
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "square";
      osc.frequency.value = 120;
      g.gain.setValueAtTime(volume * 0.4, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(g);
      g.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.09);
      break;
    }
    case "pop": {
      // Burst — brief noise + envelope
      const bufferSize = Math.max(1, Math.floor(c.sampleRate * 0.05));
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() - 0.5) * 2;
      const src = c.createBufferSource();
      src.buffer = buffer;
      const g = c.createGain();
      g.gain.setValueAtTime(volume, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      src.connect(g);
      g.connect(c.destination);
      src.start(now);
      break;
    }
    case "coin": {
      // Two-tone — 800 -> 1200 Hz sine, 120ms
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1200, now + 0.06);
      g.gain.setValueAtTime(volume * 0.7, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(g);
      g.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.13);
      break;
    }
    case "warn": {
      // Short beep — 300 Hz sawtooth, 100ms
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 300;
      g.gain.setValueAtTime(volume * 0.4, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(g);
      g.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.11);
      break;
    }
  }
}

export type { SoundName };
