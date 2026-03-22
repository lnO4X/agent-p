import { test, expect } from "@playwright/test";

test.describe("Auth Pages", () => {
  test("login page loads with form", async ({ page }) => {
    await page.goto("/login");
    // Form has username + password inputs (may not have name/type attributes)
    await expect(page.locator("input").first()).toBeVisible();
    await expect(page.locator("input").nth(1)).toBeVisible();
    // Submit button says "登录" or "Login" (use type=submit to avoid matching Google button)
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("login page has Google OAuth button", async ({ page }) => {
    await page.goto("/login");
    // Google OAuth is a button (onClick redirect), not a link
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });

  test("login page has forgot password link", async ({ page }) => {
    await page.goto("/login");
    // Link text: "忘记密码？" or "Forgot password?"
    await expect(page.locator("a").filter({ hasText: /forgot|忘记/i })).toBeVisible();
  });

  test("register page loads with form", async ({ page }) => {
    await page.goto("/register");
    // Form has username + password + referral inputs
    await expect(page.locator("input").first()).toBeVisible();
    await expect(page.locator("input").nth(1)).toBeVisible();
    // Submit button says "注册" or "Register" (use type=submit to avoid matching Google button)
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("register page has Google OAuth button", async ({ page }) => {
    await page.goto("/register");
    // Google OAuth is a button (onClick redirect), not a link
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });

  test("forgot password page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("input").first()).toBeVisible();
  });

  test("protected pages redirect to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("settings redirects to login", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);
  });
});
