# Story-Menu-App next-steps plan

Context: localhost dev environment + real Firebase/Firestore. FirebaseMockPool is not in scope.

## Phase 1 — Validation & foundation
1. Install / configure Playwright
2. Add E2E smoke tests for critical paths (login, create story, admin login)
3. Wire E2E into CI (`pr-check.yml`)
4. Redact database IP from `PROJECT_DOCUMENTATION.md`

## Phase 2 — Async infrastructure
5. Add BullMQ + Redis dependency and configuration
6. Convert image/audio generation route to enqueue jobs
7. Add job progress polling endpoint + UI indicator
8. Add background job dashboard (admin view)

## Phase 3 — Admin observability
9. Build real analytics dashboard backend (aggregate events from analytics middleware)
10. Build analytics dashboard UI in `AdminDashboard.tsx`
11. Add audit logging UI (admin action trail)
12. Add API rate-limit hits view

## Phase 4 — Production hardening
13. Add PWA service worker for offline reading
14. Add Cloud CDN / Cloudflare asset config
15. Add feature-flags UI in admin panel
16. Document multi-region Cloud Run deployment

## Phase 5 — Integrations & white-label
17. Implement real Google Classroom API sync beyond stub
18. Add white-label / custom theme support

## Out-of-scope
- FirebaseMockPool replacement (real Firebase in use)

## Suggested start
Begin with Phase 1: Playwright E2E setup. It validates the admin route migration end-to-end and gives a safety net before Phase 2 changes.
