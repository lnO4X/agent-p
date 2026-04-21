import { z } from "zod";

/**
 * Known funnel events. Extending this list is the only way to add structured
 * validation for a new event type — other event names still pass through the
 * generic `/api/analytics` endpoint without structural checks.
 */
export const FUNNEL_EVENTS = [
  "game_start",
  "game_complete",
  "game_abort",
  "quiz_start",
  "quiz_complete",
] as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

/**
 * Optional structured-prop shape for funnel events. Unknown extra keys are
 * still allowed (catchall), so harness/analytics callers can attach ad-hoc
 * diagnostic fields without breaking validation.
 */
export const funnelPropsSchema = z
  .object({
    gameId: z.string().max(100).optional(),
    sessionId: z.string().max(100).optional(),
    tier: z.enum(["quick", "standard", "pro"]).optional(),
    atRound: z.number().int().min(0).max(100).optional(),
    durationMs: z.number().nonnegative().max(24 * 60 * 60 * 1000).optional(),
    mode: z.string().max(50).optional(),
    archetype: z.string().max(100).optional(),
  })
  .catchall(z.unknown());

export type FunnelProps = z.infer<typeof funnelPropsSchema>;
