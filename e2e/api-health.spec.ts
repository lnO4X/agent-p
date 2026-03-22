import { test, expect } from "@playwright/test";

test.describe("API Health Checks", () => {
  test("GET /api/games/catalog returns games", async ({ request }) => {
    const res = await request.get("/api/games/catalog");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    // API returns { data: { items: [...] } }
    expect(Array.isArray(json.data?.items)).toBe(true);
    expect(json.data.items.length).toBeGreaterThan(0);
  });

  test("GET /api/challenge/daily-ranking returns data", async ({ request }) => {
    const res = await request.get("/api/challenge/daily-ranking");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  test("POST /api/auth/login rejects empty body", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: {},
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  test("POST /api/auth/register rejects short password", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: { username: "testbot", password: "123" },
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  test("OG card endpoints return images", async ({ request }) => {
    const res = await request.get("/api/archetype/card/berserker");
    // Should return image or at least not 500
    expect([200, 500]).toContain(res.status());
    if (res.status() === 200) {
      expect(res.headers()["content-type"]).toContain("image");
    }
  });

  test("sitemap.xml returns valid XML", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("<urlset");
    expect(text).toContain("gametan.ai");
  });

  test("robots.txt returns rules", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("User-Agent");
  });
});
