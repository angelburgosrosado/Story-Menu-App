# Changelog

All notable changes to the Story Menu App will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased] — 2026-07-25

### Phase 1 — Security & Critical Blockers

#### Added
- **Admin RBAC** — Replaced hardcoded admin email with Firestore role-based access control. `isAdminUser()` now checks `role` field in Firestore user document. Removed `x-admin-email` header fallback (privilege escalation fix). (`mike/fix-admin-rbac`)
- **Environment variable audit** — Verified no API keys (Gemini, LlamaGen, ConfyUI, Leonardo, Stripe) leak to client bundle via Vite `VITE_*` prefix. (`mike/fix-admin-rbac`)
- **Stripe webhook handler** — Implemented `checkout.session.completed` with signature verification using `stripe.webhooks.constructEvent`. Prevents payment spoofing. (`mike/feat-stripe-webhooks`)
- **Rate limiting** — Added `express-rate-limit` on all `/api/*` routes with per-user and per-route limits. Token budget enforcement for AI generation endpoints. (`mike/feat-rate-limiting`)
- **Input validation** — Server-side schema validation on all `req.body` usage. No unvalidated input reaches the database or AI APIs. (`mike/feat-security-headers`)
- **Security headers** — HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Content Security Policy (CSP). (`mike/feat-security-headers`)
- **Upload validation** — MIME type and max size checks on all image upload endpoints. (`mike/feat-security-headers`)
- **Firebase Admin startup assertion** — Fails loudly if `FIREBASE_SERVICE_ACCOUNT_KEY` is missing instead of silent fallback. (`mike/feat-sentry`)

### Phase 2 — Observability & Reliability

#### Added
- **Structured logging** — Replaced console.log with structured JSON logging. Includes request IDs, user IDs, and timestamps. (`mike/feat-sentry`)
- **Error tracking** — Sentry integration for frontend error boundaries + backend error capture. (`mike/feat-sentry`)
- **Analytics event tracking** — Event module with pre-defined events (signup, payment, story creation, AI generation). Drop-in PostHog ready. (`mike/feat-analytics`)
- **RBAC middleware** — `requireRole('moderator')` middleware with 5-tier hierarchy (user → moderator → admin → superadmin → owner). (`mike/feat-rbac-expansion`)

### Phase 3 — Code Quality & Maintainability

#### Added
- **Server route decomposition** — Extracted 154 route handlers from monolithic `server.ts` (330KB) into modular route files:
  - `routes/admin.ts` — Admin CRUD endpoints
  - `routes/admin-ai.ts` — AI admin routes
  - `routes/admin-users.ts` — User/customer management
  - `routes/admin-content.ts` — Content management
  - `api/v1/index.ts` — Developer API v1 with version history
  - `middleware/collaboration.ts` — Real-time collaboration module
  - `api/classroom.ts` — Classroom/LMS API
  (`mike/refactor-routes-admin`, `mike/refactor-routes-ai`, `mike/refactor-routes-users-content`, `mike/feat-phase3-api`, `mike/feat-phase3-collab`, `mike/feat-phase3-classroom-multiregion`)
- **ESLint + Prettier** — Consistent code style, automated formatting. (`mike/feat-lint-stale-hooks`)
- **Pre-commit hooks** — lint-staged + husky for format-on-commit. (`mike/feat-lint-stale-hooks`)
- **Stale file cleanup** — Removed `App.tsx.bak`, `App.tsx.compiled`, `.agents/` directory. (`mike/feat-lint-stale-hooks`)
- **Code splitting** — Route-based lazy loading via React.lazy + Suspense. (`mike/feat-phase3-classroom-multiregion`)
- **Accessibility middleware** — ARIA labels, keyboard navigation support. (`mike/feat-accessibility-infra`)
- **Mobile responsive fixes** — Key flow adjustments for tablet and phone. (`mike/feat-hsts-export-mobile`)

### Phase 4 — Testing

#### Added
- **API route tests** — Unit tests for all `/api/*` endpoints with mocked DB + AI calls. (`mike/test-api-stripe-auth`)
- **Stripe webhook tests** — Signature checking, idempotency, and order fulfillment verification. (`mike/test-api-stripe-auth`)
- **Auth flow tests** — Login, signup, token verification, role checks, session persistence. (`mike/test-api-stripe-auth`)
- **Component tests** — React Testing Library for story creation, gallery browsing, checkout flows. (`mike/test-api-stripe-auth`)
- **E2E test suite** — Critical path testing: login → create story → generate → view → share. (`mike/test-api-stripe-auth`)
- **Database migration tests** — Schema change validation, data integrity checks. (`mike/test-api-stripe-auth`)

### Phase 5 — CI/CD & Deployment

#### Added
- **GitHub Actions pipeline** — lint → test → build → deploy. Trigger on merge to main. (`mike/feat-cicd`)
- **Database migration tooling** — Structured migration system replacing manual SQL. (`mike/feat-db-migrations-secrets`)
- **Cloud Secret Manager integration** — DATABASE_URL, GEMINI_API_KEY, Stripe keys managed via Google Cloud Secret Manager. (`mike/feat-db-migrations-secrets`)
- **Backup & restore procedures** — Documented backup strategy for Firestore and PostgreSQL. (`mike/feat-backup-coppa`)

### Phase 6 — Compliance & Legal

#### Added
- **GDPR/CCPA data export** — `GET /api/user/export` endpoint for full user data export. (`mike/feat-gdpr-export`)
- **GDPR/CCPA account deletion** — `POST /api/user/delete-request` with admin-reviewed deletion workflow. (`mike/feat-gdpr-export`)
- **COPPA compliance audit** — Full audit document for kids features targeting under-13 users. (`mike/feat-backup-coppa`)
- **Content moderation automation** — Toxicity/NSFW detection before public gallery publish. (`mike/feat-hsts-export-mobile`)
- **Auto-moderation** — Automated content filtering for user-generated content. (`mike/feat-hsts-export-mobile`)

### Phase 7 — Product & Growth Features

#### Added
- **PDF/EPUB export** — Polished story export as printable books using jspdf. (`mike/feat-hsts-export-mobile`)
- **Email notifications** — Transactional email service: welcome, story published, payment receipt, moderation alerts. (`mike/feat-db-migrations-secrets`)
- **SEO / Open Graph meta tags** — Dynamic `<title>`, `<meta>`, OpenGraph, and Twitter cards on story detail and gallery pages. (`mike/feat-seo-story-pages`)
- **Developer API v1** — Public API with version history for third-party integrations. (`mike/feat-phase3-api`)
- **Real-time collaboration** — Multi-user editing within story workspaces. (`mike/feat-phase3-collab`)
- **Classroom/LMS API** — Education integration for teacher/classroom workflows. (`mike/feat-phase3-classroom-multiregion`)
- **HSTS enforcement** — HTTP → HTTPS redirect with HSTS headers. (`mike/feat-hsts-export-mobile`)

---

## [0.0.0] — Initial Release

- AI-powered comic generation (Gemini 2.5 Flash)
- Multi-engine image pipeline (Gemini, LlamaGen, ConfyUI, Leonardo)
- Procedural audio synthesis + TTS narration
- PostgreSQL multi-tenant database with self-healing fallback
- Firebase Authentication
- Stripe payments
- Admin dashboard
- Community gallery + creator profiles
- Education/kids mode
- Docker + Google Cloud Run deployment
