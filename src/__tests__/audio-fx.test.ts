import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Minimal in-memory localStorage mock attached to globalThis so `typeof localStorage !== "undefined"`
// and storage reads/writes are observable per test.
function installMockLocalStorage(): Storage {
  const store = new Map<string, string>();
  const mock: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? (store.get(k) as string) : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => {
      store.delete(k);
    },
    setItem: (k, v) => {
      store.set(k, String(v));
    },
  };
  (globalThis as unknown as { localStorage: Storage }).localStorage = mock;
  return mock;
}

function removeLocalStorage(): void {
  delete (globalThis as { localStorage?: Storage }).localStorage;
}

describe("audio-fx: isAudioMuted / setAudioMuted", () => {
  beforeEach(() => {
    installMockLocalStorage();
  });
  afterEach(() => {
    removeLocalStorage();
    vi.resetModules();
  });

  it("isAudioMuted() returns false by default (no key set)", async () => {
    const { isAudioMuted } = await import("@/lib/audio-fx");
    expect(isAudioMuted()).toBe(false);
  });

  it("setAudioMuted(true) writes '1' to localStorage", async () => {
    const { setAudioMuted, isAudioMuted } = await import("@/lib/audio-fx");
    setAudioMuted(true);
    expect(localStorage.getItem("gametan-audio-muted")).toBe("1");
    expect(isAudioMuted()).toBe(true);
  });

  it("setAudioMuted(false) removes the key", async () => {
    const { setAudioMuted, isAudioMuted } = await import("@/lib/audio-fx");
    setAudioMuted(true);
    expect(isAudioMuted()).toBe(true);
    setAudioMuted(false);
    expect(localStorage.getItem("gametan-audio-muted")).toBeNull();
    expect(isAudioMuted()).toBe(false);
  });
});

describe("audio-fx: playSound", () => {
  afterEach(() => {
    removeLocalStorage();
    delete (globalThis as { window?: unknown }).window;
    vi.resetModules();
  });

  it("is a no-op in SSR (no window)", async () => {
    // No window, no localStorage — simulates pure Node SSR context.
    const { playSound } = await import("@/lib/audio-fx");
    expect(() => playSound("click")).not.toThrow();
  });

  it("respects mute (returns early without touching window)", async () => {
    installMockLocalStorage();
    localStorage.setItem("gametan-audio-muted", "1");
    // Prove the early-return path: playSound should not try to access `window`,
    // so leaving `window` undefined must not produce any error.
    const { playSound } = await import("@/lib/audio-fx");
    expect(() => playSound("success")).not.toThrow();
  });

  it("does not throw on an unknown sound name", async () => {
    installMockLocalStorage();
    const { playSound } = await import("@/lib/audio-fx");
    // Cast through unknown to bypass the SoundName literal-union check.
    expect(() =>
      playSound("unknown" as unknown as Parameters<typeof playSound>[0]),
    ).not.toThrow();
  });
});
