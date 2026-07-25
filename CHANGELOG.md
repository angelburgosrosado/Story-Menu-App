# Changelog

All notable changes to Story.Menu are documented here.

## [Unreleased] — Phase 1-7 Complete

### Phase 1 — Security (10 tasks)
- **RBAC Fix** — Removed `x-admin-email` header bypass, added Firestore-backed role checking
- **Stripe Webhooks** — Added signature verification, payment_intent.succeeded handler, subscription activation
- **Rate Limiting** — Sliding window rate limiter (120/min general, 10/min AI, 5/hr checkout)
- **Input Validation** — Zod-like schema validation for checkout, Gemini endpoints
- **Security Headers** — HSTS, X-Frame-Options DENY, nosniff, Permissions-Policy
- **Firebase Assertions** — Proper error handling for Firestore operations
- **Error Tracking** — Structured error capture with context (Sentry-ready)
- **Structured Logging** — JSON logs with PII redaction, request ID tracking
- **HTTPS Enforcement** — HTTP→HTTPS redirect in production, HSTS preload

### Phase 2 — Observability (6 tasks)
- **Sentry Integration** — Error tracker with batching and critical error detection
- **Structured Logger** — JSON output with PII redaction (passwords, tokens, secrets)
- **Request Logging** — Latency, status code, request ID on every request
- **Global Error Handler** — Express error middleware with context
- **React Error Boundaries** — Component-level error catching (utilities created)

### Phase 3 — Code Quality (10 tasks)
- **Route Decomposition** — 75 admin routes extracted from 330KB monolith:
  - `routes/admin.ts` — Settings, plans, formats (30 routes)
  - `routes/admin-ai.ts` — AI providers, models, workflows (19 routes)
  - `routes/admin-users.ts` — Customers, tokens, system users (12 routes)
  - `routes/admin-content.ts` — Personas, glossary, usage modes (14 routes)
- **ESLint + Prettier** — Config files, pre-commit hooks, lint scripts
- **Stale File Cleanup** — Removed App.tsx.bak, App.tsx.compiled, updated .gitignore
- **Pre-commit Hooks** — Husky + lint-staged configuration
- **Setup Script** — One-command dev environment setup

### Phase 4 — Testing (6 tasks)
- **API Route Tests** — Checkout, tokens, settings, v1 API, GDPR, moderation
- **Stripe Webhook Tests** — Signature verification, event processing, activation
- **Auth Flow Tests** — Admin login, RBAC, Firebase tokens, tier resolution
- **Component Tests** — Gallery, story detail, checkout modal, legal pages
- **Migration Tests** — Versioning, rollback, schema changes, idempotency

### Phase 5 — CI/CD (5 tasks)
- **GitHub Actions** — PR check + deploy workflows
- **DB Migrations** — Versioned migration runner with rollback (3 migrations)
- **Secret Manager** — GCP Secret Manager setup docs
- **Backup/Restore** — Automated backup procedures, restore testing schedule

### Phase 6 — Compliance (5 tasks)
- **GDPR Export** — `GET /api/user/export` — full data export as JSON
- **GDPR Deletion** — `POST /api/user/delete-request` — admin-reviewed deletion
- **COPPA Audit** — Age verification, parental consent, data retention checklist
- **Content Moderation** — `POST /api/moderate/check` — keyword-based toxicity screening
- **RBAC Expansion** — `requireRole()` middleware with 5-tier hierarchy

### Phase 7 — Features (6 tasks)
- **Subscription Management** — Plan CRUD, upgrade/downgrade, cancel/reactivate
- **Background Job Queue** — Priority queue with retry, pre-defined job types
- **CDN** — Cloud CDN + Vercel/Netlify config, cache strategy
- **i18n QA** — 7-language QA checklist, testing commands
- **PWA Support** — Manifest, service worker, cache strategies
- **Feature Flags** — Percentage rollouts, user targeting, Firestore-backed
- **Developer API v1** — Bearer auth, rate limits, OpenAPI spec
- **Classroom/LMS** — Create, join, assign, track student progress
- **Real-time Collaboration** — Presence, cursors, conflict-free saves
- **Version History** — Snapshots, list, restore with auto-save
- **Multi-region Docs** — Cloud Run multi-region deployment guide

### Bonus Features
- **Email Service** — Template-based email (welcome, subscription, payment, export)
- **Analytics Module** — Event tracking with PostHog swap ready
- **Accessibility Utilities** — SkipNav, LiveRegion, useFocusTrap
- **PDF Export** — Story data export endpoint for client-side PDF generation
- **Custom Domain Docs** — Cloud Run domain mapping step-by-step

## [1.0.0] — Initial Release
- Core story creation with Gemini AI
- Comic book, visual lesson, bilingual story formats
- Subscription management (Stripe)
- Admin dashboard
- Public gallery
- i18n support (7 languages)
