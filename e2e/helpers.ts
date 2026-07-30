import { Page, expect } from '@playwright/test';

/**
 * E2E Helper: Bypasses UI prompts and injects a real server-backed Firebase Custom Token 
 * into the running application via window.e2eSignIn, establishing a true client session.
 */
async function e2eBypassLogin(page: Page, email: string) {
    const secret = process.env.E2E_AUTH_SECRET;
    if (!secret) {
        throw new Error('E2E_AUTH_SECRET is not set in environment.');
    }

    // 1. Fetch custom token from backend using APIRequestContext
    const response = await page.request.post('/api/e2e/login', {
        data: {
            email,
            secret,
        }
    });

    if (!response.ok()) {
        const body = await response.text();
        throw new Error(`E2E Auth endpoint failed: ${response.status()} ${body}`);
    }

    const { customToken } = await response.json();
    if (!customToken) {
        throw new Error('No customToken returned from E2E Auth endpoint.');
    }

    // 2. Navigate to root to ensure app environment is loaded and window.e2eSignIn exists
    await page.goto('/');

    // 3. Inject the token directly into the client-side Firebase Auth instance
    await page.evaluate(async (token) => {
        const win = window as any;
        if (typeof win.e2eSignIn !== 'function') {
            throw new Error('window.e2eSignIn is not defined. Ensure firebase.ts exposes it.');
        }
        await win.e2eSignIn(token);
    }, customToken);

    // 4. Wait for authentication to resolve (UI reacts to onAuthStateChanged)
    // You can adjust this locator based on what appears when logged in (e.g. log out button or account icon)
    await page.waitForTimeout(2000); // Give React/Firebase a moment to transition states
}

/**
 * Helper to log in as the E2E test user for Email flows.
 */
export async function loginAsEmailTestUser(page: Page) {
    const email = 'abglco@protonmail.com';
    await e2eBypassLogin(page, email);
}

/**
 * Helper to log in as the E2E test user for Google OAuth flows.
 */
export async function loginAsGoogleTestUser(page: Page) {
    const email = 'angelburgosrosado@gmail.com';
    await e2eBypassLogin(page, email);
}
