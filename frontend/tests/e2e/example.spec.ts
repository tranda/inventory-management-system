import { test, expect } from '@playwright/test';

test.describe('Application', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login');

    // Should show login form
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});
