import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/story|infinite heroes/i, { timeout: 10000 });
    await expect(page.locator('body')).toContainText(/story|create|menu/i, { timeout: 10000 });
});

test('admin login page loads', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('input[name="username"], input[name="email"], input[type="text"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 10000 });
});

test('admin login rejects empty credentials', async ({ page }) => {
    await page.goto('/admin');
    const submit = page.locator('button[type="submit"]').first();
    await submit.click();
    await expect(page.locator('body')).toContainText(/missing|required|invalid|error/i, { timeout: 10000 });
});
