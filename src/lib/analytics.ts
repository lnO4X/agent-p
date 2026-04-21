/**
 * Self-hosted analytics tracker — replaces Vercel Analytics Pro custom events.
 * Fire-and-forget: never blocks UI, never throws.
 */

let _sessionId: string | null = null;

function getSessionId(): string {
  if (_sessionId) return _sessionId;
  if (typeof window === "undefined") return "ssr";
  try {
    const stored = sessionStorage.getItem("gt-sid");
    if (stored) {
      _sessionId = stored;
      return stored;
    }
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("gt-sid", id);
    _sessionId = id;
    return id;
  } catch {
    return "unknown";
  }
}

/**
 * Track a custom event. Fire-and-forget.
 * @param event Event name (e.g. "quiz_start", "share_click")
 * @param props Optional properties (e.g. { mode: "quick", archetype: "berserker" })
 */
export function trackEvent(
  event: string,
  props?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;

  try {
    const payload = {
      event,
      props,
      page: window.location.pathname,
      referrer: document.referrer || undefined,
      sessionId: getSessionId(),
    };

    // Use sendBeacon for reliability (survives page navigation)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
    } else {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Never throw
  }
}

// ═══════════════════════════════════════════════════
// Game funnel instrumentation (Sprint 3)
// ═══════════════════════════════════════════════════

/** Tiers of the quiz test — matches TIER_CONFIGS in lib/test-tiers.ts. */
export type AnalyticsTier = "quick" | "standard" | "pro";

/** Known game-funnel event names — mirrors FUNNEL_EVENTS in /api/analytics. */
export type GameFunnelEvent =
  | "game_start"
  | "game_complete"
  | "game_abort"
  | "quiz_start"
  | "quiz_complete";

/** Structured props for funnel events. All fields optional but validated server-side. */
export interface GameEventProps {
  gameId?: string;
  sessionId?: string;
  tier?: AnalyticsTier;
  /** For game_abort: 0-indexed position of the game in the current quiz session. */
  atRound?: number;
  /** For game_complete: ms elapsed between game_start and game_complete. */
  durationMs?: number;
  /** For quiz_start: "quick" | "standard" | "pro" | "scenario" | "questionnaire" | "game". */
  mode?: string;
  archetype?: string;
  [key: string]: unknown;
}

/**
 * Track a per-game funnel event. Fire-and-forget.
 *
 * Thin wrapper around `trackEvent` that narrows the event name to the known
 * funnel set so the compiler catches typos, and documents the expected props
 * shape without adding a second code path.
 *
 * @example
 *   trackGameEvent("game_start", { gameId: "reaction-speed", tier: "quick", atRound: 0 });
 *   trackGameEvent("game_complete", { gameId: "reaction-speed", tier: "quick", durationMs: 12345 });
 *   trackGameEvent("game_abort", { gameId: "reaction-speed", tier: "quick", atRound: 1 });
 */
export function trackGameEvent(
  event: GameFunnelEvent,
  props?: GameEventProps
): void {
  trackEvent(event, props as Record<string, unknown> | undefined);
}
