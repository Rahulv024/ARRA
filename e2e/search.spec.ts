import { test, expect } from '@playwright/test';

test('home renders primary CTAs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Smart Recipe Discovery')).toBeVisible();
  await expect(page.getByRole('link', { name: /create account/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
});

// Note: The search UI lives on /dashboard and is server-side gated by NextAuth.
// To E2E test the search experience, either:
// 1) run the app in a test mode that bypasses auth for /dashboard; or
// 2) keep E2E focused on public pages and rely on unit tests for search logic.
