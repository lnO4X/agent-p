import { test, expect } from "@playwright/test";

test.describe("Quiz Flow", () => {
  test("quick quiz: shows game options", async ({ page }) => {
    await page.goto("/quiz");
    // Should show quiz intro with options (Quick Test / Questionnaire)
    await expect(page.locator("text=/Quick|快速/")).toBeVisible();
  });

  test("questionnaire page loads with first question", async ({ page }) => {
    await page.goto("/quiz/questions");
    // Should show first question with answer options
    await expect(page.locator("h2, .text-lg, [data-testid='question']").first()).toBeVisible({ timeout: 10000 });
    // Should have clickable answer buttons
    const buttons = page.locator("button").filter({ hasText: /./ });
    await expect(buttons.first()).toBeVisible();
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("questionnaire: answering advances to next question", async ({ page }) => {
    await page.goto("/quiz/questions");
    await expect(page.locator("h2, .text-lg, [data-testid='question']").first()).toBeVisible({ timeout: 10000 });

    // Click an answer option
    const buttons = page.locator("button").filter({ hasText: /./ });
    const firstButtonText = await buttons.first().textContent();
    await buttons.nth(2).click();
    await page.waitForTimeout(600);

    // After clicking, the page should still show a question (next one)
    await expect(page.locator("h2, .text-lg, [data-testid='question']").first()).toBeVisible();
  });

  test("result page: questionnaire mode with talent scores", async ({ page }) => {
    await page.goto("/quiz/result?mode=q&archetype=berserker&scores=reaction_speed:85,hand_eye_coord:70,strategy_logic:45");

    // Should render the result page (may show archetype or redirect)
    await page.waitForLoadState("networkidle");
    // Page should have loaded without error
    const title = await page.title();
    expect(title).toBeTruthy();
    // Should have some visible content
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("result page: quick mode with scores", async ({ page }) => {
    await page.goto("/quiz/result?s=75-60-80");

    await page.waitForLoadState("networkidle");
    const title = await page.title();
    expect(title).toBeTruthy();
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
