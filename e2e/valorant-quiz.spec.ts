import { test, expect } from "@playwright/test";

test.describe("Valorant Quiz Full Flow", () => {
  test("completes all 39 questions and shows result", async ({ page }) => {
    // Start Valorant quiz
    await page.goto("/quiz/questions?game=valorant");

    // Should show first question
    await expect(page.locator("h2")).toBeVisible({ timeout: 10000 });

    // Answer all 39 questions — click the middle (3rd) option each time
    for (let i = 0; i < 39; i++) {
      // Wait for question text to be stable
      await page.locator("h2").waitFor({ state: "visible" });

      // Find all answer buttons (5 Likert options)
      const buttons = page.locator("button.pressable");
      const count = await buttons.count();

      if (count >= 3) {
        // Click 3rd option (Neutral)
        await buttons.nth(2).click();
        // Wait for auto-advance animation
        await page.waitForTimeout(400);
      } else {
        // Might be on submit screen
        break;
      }
    }

    // Should show submit button after all questions answered
    const submitBtn = page.locator("button", { hasText: /submit|提交|view result|查看结果/i });
    if (await submitBtn.isVisible({ timeout: 3000 })) {
      await submitBtn.click();
    }

    // Should navigate to result page (either game-specific or generic)
    await expect(page).toHaveURL(/\/quiz\/(valorant\/)?result/, { timeout: 15000 });

    // Should show an archetype or character name
    await expect(page.locator("h1")).toBeVisible({ timeout: 5000 });
  });

  test("game-specific result page loads with valid params", async ({ page }) => {
    // Direct access with valid params — one of Valorant's 6 characters
    await page.goto(
      "/quiz/valorant/result?mode=q&archetype=berserker&scores=reaction_speed:85,hand_eye_coord:70,strategy_logic:45"
    );
    await expect(page.locator("h1")).toBeVisible({ timeout: 5000 });
    // Should show Phoenix (berserker maps to Phoenix in Valorant)
    await expect(page.getByRole("heading", { name: /Phoenix|菲尼克斯/ })).toBeVisible();
  });

  test("game result page redirects for unmapped archetype", async ({ page }) => {
    // "duelist" is not mapped to any Valorant character → should redirect to generic result
    await page.goto(
      "/quiz/valorant/result?mode=q&archetype=duelist&scores=reaction_speed:85,hand_eye_coord:70"
    );
    // Should redirect to generic result page
    await expect(page).toHaveURL(/\/quiz\/result/, { timeout: 10000 });
  });
});
