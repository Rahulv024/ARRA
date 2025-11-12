import { test, expect } from '@playwright/test';

// End-to-end happy path flow:
// - Register new user
// - Invalid login attempt shows error
// - Valid login redirects to dashboard
// - Search (stubbed backend) shows a known recipe
// - Favorite the recipe (real API to persist favorite + upsert recipe)
// - View recipe page
// - Ingredient substitution (stubbed backend) renders suggestions

test('user can register, login, search, favorite, view, and check substitutions', async ({ page }) => {
  const unique = Date.now();
  const email = `tester+${unique}@example.com`;
  const password = 'Passw0rd!';

  // Register a new user via UI
  await page.goto('/register');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password (min 8)').fill(password);
  await page.getByRole('button', { name: /create account/i }).click();

  // Either success banner then redirect, or direct redirect to /login
  await Promise.race([
    expect(page).toHaveURL(/.*\/login.*/),
    expect(page.getByText(/Account created/i)).toBeVisible(),
  ]);

  // Navigate to login if still on register
  if (!/\/login/.test(page.url())) {
    await page.waitForURL(/.*\/login.*/);
  }

  // Invalid login shows error
  await page.getByPlaceholder('Email or username').fill(email);
  await page.getByPlaceholder('Password').fill('Wrong' + password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByText(/Invalid email or password/i)).toBeVisible();

  // Valid login -> dashboard
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/.*\/dashboard.*/);

  // Stub the search API to return a deterministic result
  const mockRecipe = {
    id: 'local-1',
    title: 'Mock Pasta',
    image: '/placeholder.png',
    readyInMinutes: 15,
    servings: 2,
    cuisines: ['italian'],
    diets: ['vegetarian'],
    sourceUrl: null,
  };

  await page.route('**/api/search**', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [mockRecipe] }),
      });
      return;
    }
    await route.fallback();
  });

  // Perform search from dashboard
  await page.getByPlaceholder(/Try:/).fill('pasta');
  await page.getByRole('button', { name: /^Search$/ }).click();

  // Expect mocked result to render and scope actions to that card
  await expect(page.getByText('Mock Pasta')).toBeVisible();
  const card = page.locator('.card', { hasText: 'Mock Pasta' });
  await expect(card.getByRole('link', { name: 'View' })).toBeVisible();

  // Favorite the recipe (relies on authenticated session)
  const favButton = card.getByRole('button', { name: 'Favorite' });
  await favButton.click();
  await expect(favButton).toHaveAttribute('title', /Unfavorite/);

  // View the recipe page (will render from local DB record created by favorite upsert)
  await card.getByRole('link', { name: 'View' }).click();
  await page.waitForURL(/.*\/recipe\//);
  await expect(page.getByRole('heading', { name: /Mock Pasta/i })).toBeVisible();

  // Stub ingredient substitution API and validate output
  await page.route('**/api/ai/substitute', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestions: [
            { for: 'milk', alt: 'oat milk', note: '1:1 swap' },
          ],
          source: 'test',
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.getByPlaceholder('e.g., coconut cream').fill('milk');
  await page.getByRole('button', { name: /Suggest/i }).click();
  await expect(page.getByText(/oat milk/i)).toBeVisible();
});
