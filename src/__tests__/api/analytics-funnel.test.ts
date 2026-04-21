import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRequest } from "../helpers/mock-request";

/**
 * Tests for Sprint-3 funnel instrumentation:
 *   POST /api/analytics — accepts game_start/game_complete/game_abort/quiz_start/quiz_complete
 *   GET  /api/admin/analytics/funnel — aggregates per-game and per-tier completion rates
 */

// ═══════════════════════════════════════════════════
// Hoisted mocks
// ═══════════════════════════════════════════════════
const mockDb = vi.hoisted(() => ({
  insert: vi.fn(),
  execute: vi.fn(),
}));

const mockGetAuthFromCookie = vi.hoisted(() => vi.fn());
const mockRequireAdminOrCronSecret = vi.hoisted(() => vi.fn());
const mockLoggerError = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  analyticsEvents: { id: "id", event: "event", props: "props" },
  users: { id: "id", isAdmin: "isAdmin" },
}));
vi.mock("@/lib/auth", () => ({
  getAuthFromCookie: mockGetAuthFromCookie,
}));
vi.mock("@/lib/admin", () => ({
  requireAdminOrCronSecret: mockRequireAdminOrCronSecret,
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: mockLoggerError, info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => args),
  sql: Object.assign(
    vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings,
      values,
    })),
    {
      raw: vi.fn((s: string) => s),
    }
  ),
}));

// Import AFTER mocks
import { POST } from "@/app/api/analytics/route";
import { GET as funnelGET } from "@/app/api/admin/analytics/funnel/route";

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════
function captureInsertPayload() {
  const insertValues: Array<Record<string, unknown>> = [];
  mockDb.insert.mockImplementation(() => ({
    values: (v: Record<string, unknown>) => {
      insertValues.push(v);
      // Drizzle returns a thenable — mimic with a resolved promise that also has .catch
      return {
        catch: () => Promise.resolve(),
        then: (fn: (v: unknown) => unknown) => Promise.resolve().then(fn),
      };
    },
  }));
  return insertValues;
}

// ═══════════════════════════════════════════════════
// POST /api/analytics — funnel events
// ═══════════════════════════════════════════════════
describe("POST /api/analytics — funnel events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthFromCookie.mockResolvedValue(null);
  });

  it("accepts game_start with gameId and tier", async () => {
    const values = captureInsertPayload();

    const req = createRequest("POST", "http://localhost:3000/api/analytics", {
      body: {
        event: "game_start",
        props: { gameId: "reaction-speed", tier: "quick", atRound: 0 },
        sessionId: "sess-abc",
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(values.length).toBe(1);
    expect(values[0].event).toBe("game_start");
    expect(values[0].props).toMatchObject({
      gameId: "reaction-speed",
      tier: "quick",
      atRound: 0,
    });
    expect(values[0].sessionId).toBe("sess-abc");
  });

  it("accepts game_complete with durationMs", async () => {
    const values = captureInsertPayload();

    const req = createRequest("POST", "http://localhost:3000/api/analytics", {
      body: {
        event: "game_complete",
        props: { gameId: "pattern", tier: "standard", durationMs: 15432 },
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(values[0].event).toBe("game_complete");
    expect(values[0].props).toMatchObject({
      gameId: "pattern",
      durationMs: 15432,
    });
  });

  it("accepts game_abort with atRound", async () => {
    const values = captureInsertPayload();

    const req = createRequest("POST", "http://localhost:3000/api/analytics", {
      body: {
        event: "game_abort",
        props: { gameId: "risk", tier: "quick", atRound: 2 },
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(values[0].event).toBe("game_abort");
    expect(values[0].props).toMatchObject({ atRound: 2 });
  });

  it("accepts quiz_start and quiz_complete", async () => {
    const values = captureInsertPayload();

    await POST(
      createRequest("POST", "http://localhost:3000/api/analytics", {
        body: { event: "quiz_start", props: { tier: "standard", mode: "standard" } },
      })
    );
    await POST(
      createRequest("POST", "http://localhost:3000/api/analytics", {
        body: { event: "quiz_complete", props: { tier: "standard" } },
      })
    );

    expect(values.length).toBe(2);
    expect(values[0].event).toBe("quiz_start");
    expect(values[1].event).toBe("quiz_complete");
  });

  it("flags invalid structured props on funnel events without rejecting them", async () => {
    const values = captureInsertPayload();

    const req = createRequest("POST", "http://localhost:3000/api/analytics", {
      body: {
        event: "game_start",
        // atRound negative + tier wrong → invalid shape, but event must still record.
        props: { gameId: "x", tier: "SUPER-PRO", atRound: -5 },
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(values.length).toBe(1);
    expect(values[0].event).toBe("game_start");
    expect((values[0].props as Record<string, unknown>)._invalid_props).toBe(true);
  });

  it("silently swallows malformed requests (fire-and-forget)", async () => {
    captureInsertPayload();

    const req = createRequest("POST", "http://localhost:3000/api/analytics", {
      body: { event: "", props: {} }, // invalid: event too short
    });

    const res = await POST(req);
    const json = await res.json();

    // Route always responds success to avoid blocking the UI.
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("still accepts arbitrary event names for backward-compat", async () => {
    const values = captureInsertPayload();

    const req = createRequest("POST", "http://localhost:3000/api/analytics", {
      body: {
        event: "share_click",
        props: { target: "twitter" },
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(values[0].event).toBe("share_click");
  });
});

// ═══════════════════════════════════════════════════
// GET /api/admin/analytics/funnel
// ═══════════════════════════════════════════════════
describe("GET /api/admin/analytics/funnel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdminOrCronSecret.mockResolvedValue({ type: "cron" });
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireAdminOrCronSecret.mockResolvedValue(null);

    const req = createRequest(
      "GET",
      "http://localhost:3000/api/admin/analytics/funnel"
    );
    const res = await funnelGET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it("aggregates per-game completion stats", async () => {
    // 1st call: per-game rows (pivoted). 2nd call: per-tier rows.
    mockDb.execute
      .mockResolvedValueOnce([
        { game_id: "reaction-speed", event_type: "game_start", count: 100 },
        { game_id: "reaction-speed", event_type: "game_complete", count: 75 },
        { game_id: "reaction-speed", event_type: "game_abort", count: 20 },
        { game_id: "pattern", event_type: "game_start", count: 50 },
        { game_id: "pattern", event_type: "game_complete", count: 40 },
      ])
      .mockResolvedValueOnce([
        { tier: "quick", event_type: "quiz_start", count: 80 },
        { tier: "quick", event_type: "quiz_complete", count: 60 },
        { tier: "standard", event_type: "quiz_start", count: 20 },
        { tier: "standard", event_type: "quiz_complete", count: 10 },
      ]);

    const req = createRequest(
      "GET",
      "http://localhost:3000/api/admin/analytics/funnel?days=7"
    );
    const res = await funnelGET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.windowDays).toBe(7);

    const reaction = json.data.perGame.find(
      (g: { gameId: string }) => g.gameId === "reaction-speed"
    );
    expect(reaction).toEqual({
      gameId: "reaction-speed",
      starts: 100,
      completes: 75,
      aborts: 20,
      completionPct: 75,
    });

    const pattern = json.data.perGame.find(
      (g: { gameId: string }) => g.gameId === "pattern"
    );
    expect(pattern.completionPct).toBe(80);
    expect(pattern.aborts).toBe(0); // no abort rows → zero-filled

    // Per-game sorted by starts DESC
    expect(json.data.perGame[0].gameId).toBe("reaction-speed");

    // Per-tier includes all three tiers (zero-filled)
    expect(json.data.perTier).toHaveLength(3);
    const quick = json.data.perTier.find((t: { tier: string }) => t.tier === "quick");
    expect(quick).toEqual({
      tier: "quick",
      quizStarts: 80,
      quizCompletes: 60,
      completionPct: 75,
    });
    const pro = json.data.perTier.find((t: { tier: string }) => t.tier === "pro");
    expect(pro.quizStarts).toBe(0);
    expect(pro.completionPct).toBe(0);
  });

  it("clamps days param to [1, 90]", async () => {
    mockDb.execute.mockResolvedValue([]);

    // Too small
    let req = createRequest(
      "GET",
      "http://localhost:3000/api/admin/analytics/funnel?days=0"
    );
    let res = await funnelGET(req);
    let json = await res.json();
    expect(json.data.windowDays).toBe(1);

    // Too large
    req = createRequest(
      "GET",
      "http://localhost:3000/api/admin/analytics/funnel?days=999"
    );
    res = await funnelGET(req);
    json = await res.json();
    expect(json.data.windowDays).toBe(90);

    // Garbage → default 7
    req = createRequest(
      "GET",
      "http://localhost:3000/api/admin/analytics/funnel?days=abc"
    );
    res = await funnelGET(req);
    json = await res.json();
    expect(json.data.windowDays).toBe(7);
  });

  it("handles db.execute returning { rows: [] } envelope", async () => {
    mockDb.execute
      .mockResolvedValueOnce({
        rows: [
          { game_id: "memory", event_type: "game_start", count: 10 },
          { game_id: "memory", event_type: "game_complete", count: 10 },
        ],
      })
      .mockResolvedValueOnce({ rows: [] });

    const req = createRequest(
      "GET",
      "http://localhost:3000/api/admin/analytics/funnel"
    );
    const res = await funnelGET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.perGame[0].completionPct).toBe(100);
  });

  it("handles DB error gracefully (500 with error message)", async () => {
    mockDb.execute.mockRejectedValue(new Error("boom"));

    const req = createRequest(
      "GET",
      "http://localhost:3000/api/admin/analytics/funnel"
    );
    const res = await funnelGET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe("boom");
  });
});
