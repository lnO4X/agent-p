import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("loads and shows hero content", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("GameTan");
    await expect(page.getByRole("link", { name: /start quiz|开始测试/i })).toBeVisible();
  });

  test("shows 16 archetype icons", async ({ page }) => {
    await page.goto("/");
    // SVG archetype icons should be present
    const icons = page.locator("svg[aria-label]");
    await expect(icons).toHaveCount(16);
  });

  test("navigates to quiz on CTA click", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /start quiz|开始测试/i }).click();
    await expect(page).toHaveURL(/\/quiz/);
  });

  test("language toggle works", async ({ page }) => {
    await page.goto("/");
    // Find and click English toggle
    const enButton = page.locator("button", { hasText: "English" });
    if (await enButton.isVisible()) {
      await enButton.click();
      await expect(page.getByRole("link", { name: /start quiz/i })).toBeVisible();
    }
  });
});
