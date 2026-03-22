import { test, expect } from "@playwright/test";

test.describe("Public Pages (no auth required)", () => {
  test("explore page loads without login", async ({ page }) => {
    await page.goto("/explore");
    await expect(page).not.toHaveURL(/\/login/);
    // Should show game cards or search
    await expect(page.locator("input, [data-testid='search']").first()).toBeVisible({ timeout: 10000 });
  });

  test("archetype index loads", async ({ page }) => {
    await page.goto("/archetype");
    await expect(page.locator("text=/archetype|原型/i").first()).toBeVisible({ timeout: 5000 });
  });

  test("archetype detail loads", async ({ page }) => {
    await page.goto("/archetype/berserker");
    await expect(page.locator("h1")).toBeVisible({ timeout: 5000 });
  });

  test("compatibility page loads", async ({ page }) => {
    await page.goto("/archetype/compatibility");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("community page loads without login", async ({ page }) => {
    await page.goto("/community");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("leaderboard loads without login", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("PK page loads", async ({ page }) => {
    await page.goto("/pk");
    await expect(page).not.toHaveURL(/\/login/);
  });
});
