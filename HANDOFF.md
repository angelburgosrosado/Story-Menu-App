# HANDOFF.md — Story Menu App Development State

> **Generated:** 2026-07-26
> **Purpose:** Complete development state for AI assistants (Gemini CLI, Claude, etc.) to continue work
> **Status:** All admin routes migrated to extracted routers; server.ts reduced by ~1,535 lines. All gates passing.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Name** | Story Menu App (Infinite Heroes REMIX) |
| **Repo** | `github.com/angelburgosrosado/Story-Menu-App` |
| **Stack** | React 19 + TypeScript + Express 5 + PostgreSQL + Firebase + Stripe + Gemini AI |
| **Deploy** | Google Cloud Run (Docker) |
| **Owner** | Angel Burgos, PE (@ABGLOBALCEO) |
| **Lead** | Mira · Project Lead (Web Delivery Studio) |
| **Engineer** | Mike · Eng Lead (CTO) |

---

## 2. Architecture Summary

```
CLIENT (React 19, Vite, Tailwind, Motion, Spline 3D)
    ↓ HTTP
SERVER (Express 5, Node.js 20)
    ↓
MIDDLEWARE STACK:
  Rate Limiter → Input Validator → Auth (Firebase) → RBAC → Logger → Route Handler
    ↓
ROUTE MODULES:
  routes/admin.ts          — Settings / plans / formats admin routes
  routes/admin-ai.ts       — AI providers / models / workflows / routing rules (legacy paths)
  routes/admin-users.ts    — User/customer management
  routes/admin-content.ts  — Content management
  routes/subscription.ts   — Stripe billing portal + subscription endpoints
  api/v1/index.ts          — Developer API v1
  api/classroom.ts         — Classroom/LMS integration
    ↓
SERVICES:
  Gemini API (AI generation)
  Image Engines (LlamaGen, ConfyUI, Leonardo)
  Web Audio Synthesizer (procedural music)
  TTS Narration
  Email Service (transactional)
    ↓
DATA:
  PostgreSQL (multi-tenant, per-user schemas)
  Firebase Firestore (users, settings)
  Cloud Storage (images, audio)
```

---

## 3. File Structure

```
Story-Menu-App/
├── api/
│   ├── v1/index.ts              # Developer API v1
│   └── classroom.ts             # Classroom/LMS API
├── db/
│   └── migrate.ts               # Database migrations
├── middleware/
│   ├── rateLimit.ts             # Rate limiting + token budgets
│   ├── security.ts              # CSP, headers, input validation
│   ├── rbac.ts                  # 5-tier role hierarchy
│   ├── logger.ts                # Structured JSON logging
│   ├── errorTracker.ts          # Sentry integration
│   ├── analytics.ts             # Event tracking
│   ├── collaboration.ts         # Real-time collaboration
│   ├── emailService.ts          # Transactional emails
│   ├── accessibility.tsx        # A11y middleware
│   ├── featureFlags.ts          # Feature flag system
│   ├── jobQueue.ts              # Background job queue
│   └── subscription.ts          # Subscription management
├── routes/
│   ├── admin.ts                 # Settings / plans / formats
│   ├── admin-ai.ts              # AI engine admin routes
│   ├── admin-users.ts           # User management routes
│   ├── admin-content.ts         # Content management routes
│   └── subscription.ts          # Stripe billing portal
├── tests/
│   ├── api.test.ts              # API route tests
│   ├── auth.test.ts             # Auth flow tests
│   ├── stripe-webhook.test.ts   # Stripe webhook tests
│   ├── components.test.tsx      # Component tests
│   ├── migrations.test.ts       # Migration tests
│   └── setup.ts                 # Vitest setup (fetch stub)
├── vitest.config.ts           # Vitest config (node env + setup file)
├── db.ts                      # Database connection + self-healing
├── server.ts                  # Express entry point (~6,660 lines; shrinking)
├── App.tsx                    # React main app
├── AdminApp.tsx               # Admin panel
├── AdminDashboard.tsx         # Admin dashboard
├── Home.tsx                   # Landing page
├── Setup.tsx                  # Onboarding wizard
├── components/                # Decomposed components
│   └── admin/                   # Admin tab components
│       ├── MembershipsTab.tsx
│       ├── ModerationTab.tsx
│       ├── PlansTab.tsx
│       ├── IntegrationsTab.tsx
│       ├── LandingTab.tsx
│       ├── SecurityTab.tsx
│       ├── DiagnosticsTab.tsx
│       ├── AIEngineTab.tsx
│       ├── AdminSidebarNav.tsx
│       ├── AdminCostAnalyticsView.tsx
│       └── AdminLogsView.tsx
│   └── setup/                   # Onboarding step components
│       ├── SetupStep1Format.tsx
│       └── SetupStep8Review.tsx
├── .github/workflows/
│   ├── deploy.yml               # CI/CD pipeline
│   └── pr-check.yml             # PR validation
├── Dockerfile                   # Container build
├── package.json                 # Dependencies
├── CHANGELOG.md                 # Full change history
├── ARCHITECTURE.md              # System design
├── TROUBLESHOOTING.md           # Common issues + fixes
├── CONTRIBUTING.md              # Development workflow
├── COPPA_COMPLIANCE.md          # Kids privacy audit
├── BACKUP_RESTORE.md            # Backup procedures
├── SECRET_MANAGER_SETUP.md      # Google Cloud secrets
├── CDN_SETUP.md                 # CDN configuration
├── DEPLOY_CUSTOM_DOMAIN.md      # Custom domain setup
├── DEPLOY_MULTI_REGION.md       # Multi-region deployment
└── HANDOFF.md                   # This file
```

---

## 4. What Has Been Delivered

### Phase 1 — Security ✅
- [x] Environment variable audit (no client-side key leakage)
- [x] Admin RBAC (Firestore role-based, no hardcoded emails)
- [x] Stripe webhook handler with signature verification
- [x] Rate limiting on all `/api/*` routes
- [x] Input validation (Zod/Joi schemas)
- [x] Firebase ID token verification
- [x] Security headers (HSTS, CSP, X-Frame-Options)
- [x] Upload validation (MIME type + size)
- [x] Firebase Admin startup assertion
- [x] `requireAdmin` middleware mounted consistently on all admin routers

### Phase 2 — Observability ✅
- [x] Sentry error tracking
- [x] Structured logging (JSON, request IDs, user IDs)
- [x] Analytics event tracking (PostHog-ready)
- [x] RBAC middleware (5-tier hierarchy)
- [x] React error boundaries
- [x] Cloud Run health checks

### Phase 3 — Code Quality ✅
- [x] Server route decomposition (settings/plans/formats → `routes/admin.ts`; AI engine → `routes/admin-ai.ts`)
- [x] AdminDashboard decomposition into tab components
- [x] AdminApp decomposition into nav + view components
- [x] Setup.tsx decomposition into step components
- [x] App.tsx / Home.tsx decomposition (pre-existing)
- [x] Code splitting (React.lazy + Suspense)
- [x] ESLint + Prettier
- [x] Pre-commit hooks (lint-staged + husky)
- [x] Stale file cleanup

### Phase 4 — Testing ✅
- [x] API route tests
- [x] Stripe webhook tests
- [x] Auth flow tests
- [x] Component tests (with jsdom environment + fetch stub)
- [x] Database migration tests
- [x] Vitest config + `tests/setup.ts` to stub external fetches

### Phase 5 — CI/CD ✅
- [x] GitHub Actions pipeline (lint → test → build → deploy)
- [x] Database migration tooling
- [x] Cloud Secret Manager integration
- [x] Backup & restore procedures
- [x] Staging environment docs

### Phase 6 — Compliance ✅
- [x] GDPR/CCPA data export endpoint
- [x] GDPR/CCPA account deletion endpoint
- [x] COPPA compliance audit
- [x] Content moderation automation
- [x] Image upload validation

### Phase 7 — Features ✅
- [x] PDF/EPUB export
- [x] Email notifications (transactional)
- [x] Analytics integration
- [x] SEO / Open Graph meta tags
- [x] Mobile responsive fixes
- [x] Accessibility (ARIA, keyboard nav)
- [x] Subscription management
- [x] Stripe Customer Billing Portal (`POST /api/subscription/portal`)
- [x] Background job queue
- [x] CDN configuration docs
- [x] Custom domain docs
- [x] i18n QA docs
- [x] PWA support
- [x] Feature flags
- [x] Multi-region deployment docs
- [x] Developer API v1
- [x] Real-time collaboration
- [x] Classroom/LMS API
- [x] HSTS enforcement

---

## 5. Current Work In Progress

### This session (2026-07-28)
1. **Interactive AI Cost Analytics Dashboard** — Recharts-supported financial tracking, operation charts, and searchable Firestore telemetry logs.
2. **Firestore-backed Feature Flags Admin UI** — Implemented granular targeting, percentage rollouts, allowed/excluded user lists, and environment gates.
3. **API Rate Limit Dashboard** — Implemented sliding window IP session trackers on client and server.
4. **PWA Service Worker Registration** — Active in Vite entrypoint `index.tsx`.
5. **Native PostHog Integration** — Live direct capture dispatched inside analytics middleware.
6. **Db Auto-Reconnection & Typo Fix** — Resolved a pre-existing typo (`econrefused` -> `econnrefused`) in `db.ts` to ensure TCP exceptions are handled correctly. Added comprehensive unit tests for system diagnostics and database self-healing.

### Verification (all passing)
```bash
npx tsc --noEmit        # 0 errors
npm run test -- --run   # 8 files, 83 tests passed
npm run build           # vite + esbuild success
```

---

## 6. What Remains

### High Priority
| Task | Effort | Notes |
|---|---|---|
| ~~Migrate remaining inline admin routes~~ | ✔ Done | All admin routes extracted to `routes/admin-*.ts`. |
| ~~E2E tests (Playwright)~~ | ✔ Done | Browser-based Playwright framework successfully integrated. |
| ~~FirebaseMockPool replacement~~ | ✔ Done | Completely replaced with a decoupled Repository pattern (`db/repositories.ts`). |
| ~~Real analytics dashboard~~ | ✔ Done | Comprehensive Recharts-powered interactive analytics views live. |

### Medium Priority
| Task | Effort | Notes |
|---|---|---|
| ~~Background job queue (BullMQ)~~ | ✔ Done | Asynchronous generation job queue and processor implemented. |
| ~~CDN for assets~~ | ✔ Done | Fully mapped and configured under `CDN_SETUP.md`. |
| ~~PWA service worker~~ | ✔ Done | Registered and active offline caching service. |
| ~~Feature flags UI~~ | ✔ Done | Full rollout control panel with sliders and environment selectors. |
| ~~Multi-region Cloud Run~~ | ✔ Done | Deployment blueprints mapped in `DEPLOY_MULTI_REGION.md`. |

### Low Priority
| Task | Effort | Notes |
|---|---|---|
| ~~White-label / custom themes~~ | ✔ Done | Brand and plan-based theme layouts built. |
| ~~API rate limit dashboard~~ | ✔ Done | Real-time sliding window traffic counters and UI indicators live. |
| ~~Audit logging UI~~ | ✔ Done | Fully active Webhook logs, bypass logs, and error stream UI. |
| ~~Google Classroom API integration~~ | ✔ Done | Student/teacher sync active in `api/classroom.ts`. |

---

## 7. Environment Variables

```env
# Required
PORT=3000
DATABASE_URL=postgresql://user:***@host:5432/dbname
GEMINI_API_KEY=your_gemini_key
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional (image engines)
LLAMAGEN_API_KEY=your_key
CONFYUI_API_URL=http://127.0.0.1:8188
LEONARDO_API_KEY=your_key

# Optional (features)
SENTRY_DSN=your_sentry_dsn
POSTHOG_API_KEY=your_posthog_key
```

---

## 8. How to Continue Development

### For AI Assistants (Gemini CLI, Claude, etc.)

1. **Clone the repo:**
   ```bash
   git clone https://github.com/angelburgosrosado/Story-Menu-App.git
   cd Story-Menu-App
   npm install
   ```

2. **Read these files first:**
   - `HANDOFF.md` (this file) — full context
   - `ARCHITECTURE.md` — system design
   - `CHANGELOG.md` — what's been done
   - `TROUBLESHOOTING.md` — known issues

3. **Check current state:**
   ```bash
   git status
   git log --oneline -20  # recent commits
   git branch -a          # all branches
   npm run test           # run test suite
   ```

4. **Pick a task from Section 6** and create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   # make changes
   git commit -m "feat(scope): description"
   git push origin feature/your-feature-name
   ```

5. **Code standards:**
   - TypeScript strict mode
   - ESLint + Prettier enforced
   - Conventional commit messages
   - Tests required for new features
   - No hardcoded secrets

### For Human Developers

1. Follow `CONTRIBUTING.md` for workflow
2. All changes go through PRs (no direct pushes to main)
3. PRs require review before merge
4. See `ARCHITECTURE.md` for design decisions

---

## 9. Known Issues & Technical Debt

1. **~~Remaining inline admin routes~~** — Resolved.
2. **~~FirebaseMockPool~~** — Resolved: replaced with formal Repository Pattern (`db/repositories.ts`).
3. **~~Test coverage gaps~~** — Resolved: added 11 unit and resilience tests to verify system routes and database auto-reconnection mechanics. Total test cases increased to 83.
4. **~~No staging environment~~** — Resolved: staging setup configured and documented.
5. **~~Database IP in docs~~** — Resolved: redacted.

---

## 10. Deployment

```bash
# Build
npm run build

# Test
npm test

# Deploy to Cloud Run
gcloud run deploy myiad-comic-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

---

## 11. Contacts

| Role | Name | GitHub |
|---|---|---|
| Owner | Angel Burgos, PE | @angelburgosrosado |
| Project Lead | Mira · Project Lead | Web Delivery Studio |
| Engineer | Mike · Eng Lead (CTO) | Web Delivery Studio |

---

*This document is the single source of truth for continuing development on Story Menu App.*
