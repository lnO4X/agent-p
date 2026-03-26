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
