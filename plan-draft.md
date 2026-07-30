# Implementation Plan

## User Review Required
- The Playwright tests will be configured to use a new hidden client route `/e2e-login`.
- A backend route `/api/e2e/login` will securely generate Firebase Custom Tokens.

## Proposed Changes
### Backend / `server.ts`
- Add `/api/e2e/login` endpoint that:
  - Validates `E2E_AUTH_ENABLED`, `E2E_AUTH_SECRET`, and `E2E_EMAIL_ALLOWLIST`.
  - Looks up the user by email using `firebase-admin`.
  - Generates and returns a `customToken`.
  - If the user doesn't exist (e.g. wiped locally), recreates it safely without wiping credits.

### Frontend / `App.tsx` & `firebase.ts`
- `firebase.ts`: Export `signInWithCustomToken` from `firebase/auth`.
- `App.tsx`: Add a hidden screen component that reads query params (`email`, `secret`), fetches the custom token from `/api/e2e/login`, calls `signInWithCustomToken`, and redirects home.

### Tests / `playwright-helpers.ts` (NEW)
- Implement `loginAsEmailTestUser(page)` and `loginAsGoogleTestUser(page)` using the hidden route.

### Config
- Update `.env` templates.
