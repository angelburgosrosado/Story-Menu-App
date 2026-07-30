import { test, expect } from '@playwright/test';
import { loginAsEmailTestUser, loginAsGoogleTestUser } from './helpers';

test.describe('E2E Authentication Tests', () => {
    test.beforeEach(() => {
        // Ensure test environment variables are active in this test runner context
        // Normally set via cross-env or .env.test in package.json scripts
        if (!process.env.E2E_AUTH_SECRET) {
            process.env.E2E_AUTH_SECRET = 'local-test-secret-1234';
        }
    });

    test('should authenticate using the Email test identity and maintain session', async ({ page }) => {
        await loginAsEmailTestUser(page);

        // Verify that the UI reflects a logged in state
        // For example, by looking for a 'Log Out' button or profile icon
        await page.goto('/');
        
        // Wait for auth to resolve
        await page.waitForTimeout(2000); 

        // Let's assert a user-specific element is visible or that auth modal is not required
        const signInBtn = page.getByText(/Sign In \/ Sign Up/i);
        await expect(signInBtn).not.toBeVisible();

        // Let's look for credits or personalized dashboard indicators if they exist
        const credits = page.locator('text=/Credits|Tokens/');
        if (await credits.count() > 0) {
            await expect(credits.first()).toBeVisible();
        }
    });

    test('should authenticate using the Google OAuth test identity and maintain session', async ({ page }) => {
        await loginAsGoogleTestUser(page);

        await page.goto('/');
        
        await page.waitForTimeout(2000); 
        const signInBtn = page.getByText(/Sign In \/ Sign Up/i);
        await expect(signInBtn).not.toBeVisible();
    });
});
