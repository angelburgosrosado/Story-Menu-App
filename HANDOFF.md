# Story.Menu — Full Development Review & Handoff Document

> **Purpose:** This document provides a complete record of all development work completed on the Story.Menu codebase. It is designed to be consumed by Gemini CLI, AI assistants, or human developers to continue development, deploy, or troubleshoot the project.

> **Date:** 2026-07-25
> **Repo:** https://github.com/angelburgosrosado/Story-Menu-App
> **Branch:** `main` (all work merged)
> **Total files modified/created:** 120 TypeScript/TSX files, 118 Markdown docs

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [What Was Built](#2-what-was-built)
3. [File Inventory](#3-file-inventory)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema](#5-database-schema)
6. [API Endpoints](#6-api-endpoints)
7. [Middleware Stack](#7-middleware-stack)
8. [Testing](#8-testing)
9. [Deployment Checklist](#9-deployment-checklist)
10. [Known Issues & Technical Debt](#10-known-issues--technical-debt)
11. [Next Steps for AI Assistant](#11-next-steps-for-ai-assistant)

---

## 1. Project Summary

**Story.Menu** is an AI-powered comic book and interactive story creator. Users choose a hero, genre, and language — Gemini AI writes and illustrates their multiverse adventure.

**Tech Stack:**
- Frontend: React + TypeScript + Vite
- Backend: Express.js + TypeScript
- Database: PostgreSQL (Cloud SQL) + Firestore (Firebase) + in-memory fallback
- AI: Google Gemini API
- Payments: Stripe
- Auth: Firebase Auth
- Deployment: Cloud Run (Google Cloud)
- CI/CD: GitHub Actions

**Current State:** All code merged to `main`. Ready for environment variable setup and deployment.

---

## 2. What Was Built

### Phase 1 — Security (10 tasks)
| Task | File(s) | What It Does |
|---|---|---|
| RBAC Fix | `middleware/rbac.ts` | Removed `x-admin-email` header bypass, added Firestore-backed role checking |
| Stripe Webhooks | `server.ts` (line ~3100) | Added `express.raw()` for signature verification, `payment_intent.succeeded` handler |
| Rate Limiting | `middleware/rateLimit.ts` | Sliding window: 120/min general, 10/min AI, 5/hr checkout |
| Input Validation | `middleware/security.ts` | Schema validation for checkout, Gemini endpoints |
| Security Headers | `middleware/security.ts` | HSTS, X-Frame-Options DENY, nosniff, Permissions-Policy |
| Error Tracking | `middleware/errorTracker.ts` | Structured error capture with batching |
| Structured Logging | `middleware/logger.ts` | JSON logs with PII redaction, request ID tracking |
| HTTPS Enforcement | `server.ts` (line ~1650) | HTTP→HTTPS redirect, HSTS preload header |

### Phase 2 — Observability (6 tasks)
| Task | File(s) | What It Does |
|---|---|---|
| Sentry Integration | `middleware/errorTracker.ts` | Error tracker with critical error detection |
| Structured Logger | `middleware/logger.ts` | JSON output, PII redaction for passwords/tokens/secrets |
| Request Logging | `middleware/logger.ts` | Latency, status code, request ID on every request |
| Global Error Handler | `middleware/errorTracker.ts` | Express error middleware with context |
| Analytics | `middleware/analytics.ts` | Event tracking with PostHog swap ready |

### Phase 3 — Code Quality (10 tasks)
| Task | File(s) | What It Does |
|---|---|---|
| Route Decomposition | `routes/admin.ts` | 30 routes: settings, plans, formats CRUD |
| Route Decomposition | `routes/admin-ai.ts` | 19 routes: AI providers, models, workflows |
| Route Decomposition | `routes/admin-users.ts` | 12 routes: customers, tokens, system users |
| Route Decomposition | `routes/admin-content.ts` | 14 routes: personas, glossary, usage modes |
| ESLint + Prettier | `.eslintrc.json`, `.prettierrc.json` | Linting and formatting config |
| Pre-commit Hooks | `.huskyrc.json`, `package.json` | Husky + lint-staged |
| Stale File Cleanup | `.gitignore` | Removed App.tsx.bak, App.tsx.compiled |
| Setup Script | `scripts/setup.sh` | One-command dev environment setup |

### Phase 4 — Testing (6 tasks)
| Task | File(s) | What It Does |
|---|---|---|
| API Tests | `tests/api.test.ts` | Checkout, tokens, settings, v1 API, GDPR, moderation |
| Stripe Tests | `tests/stripe-webhook.test.ts` | Signature verification, event processing |
| Auth Tests | `tests/auth.test.ts` | Admin login, RBAC, Firebase tokens, tier resolution |
| Component Tests | `tests/components.test.tsx` | Gallery, story detail, checkout modal |
| Migration Tests | `tests/migrations.test.ts` | Versioning, rollback, schema changes |

### Phase 5 — CI/CD (5 tasks)
| Task | File(s) | What It Does |
|---|---|---|
| GitHub Actions | `.github/workflows/` | PR check + deploy workflows |
| DB Migrations | `db/migrate.ts` | Versioned migration runner (3 migrations) |
| Secret Manager | `SECRET_MANAGER_SETUP.md` | GCP Secret Manager docs |
| Backup/Restore | `BACKUP_RESTORE.md` | Automated backup procedures |

### Phase 6 — Compliance (5 tasks)
| Task | File(s) | What It Does |
|---|---|---|
| GDPR Export | `server.ts` (line ~3230) | `GET /api/user/export` — full data export |
| GDPR Deletion | `server.ts` (line ~3260) | `POST /api/user/delete-request` — admin-reviewed |
| COPPA Audit | `COPPA_COMPLIANCE.md` | Age verification, parental consent checklist |
| Content Moderation | `server.ts` (line ~3280) | `POST /api/moderate/check` — keyword screening |
| RBAC Expansion | `middleware/rbac.ts` | `requireRole()` with 5-tier hierarchy |

### Phase 7 — Features (6 tasks)
| Task | File(s) | What It Does |
|---|---|---|
| Subscription Mgmt | `middleware/subscription.ts` | Plan CRUD, upgrade/downgrade, cancel/reactivate |
| Job Queue | `middleware/jobQueue.ts` | Priority queue with retry, pre-defined job types |
| CDN | `CDN_SETUP.md` | Cloud CDN + Vercel/Netlify config |
| i18n QA | `I18N_QA.md` | 7-language QA checklist |
| PWA | `public/manifest.json`, `public/sw.js` | Manifest, service worker, cache strategies |
| Feature Flags | `middleware/featureFlags.ts` | Percentage rollouts, user targeting |

### Bonus Features
| Feature | File(s) | What It Does |
|---|---|---|
| Developer API v1 | `api/v1/index.ts` | Bearer auth, rate limits, OpenAPI spec |
| Classroom/LMS | `api/classroom.ts` | Create, join, assign, track progress |
| Real-time Collab | `middleware/collaboration.ts` | Presence, cursors, conflict-free saves |
| Version History | `server.ts` (line ~3300) | Snapshots, list, restore with auto-save |
| Email Service | `middleware/emailService.ts` | Template-based email notifications |
| Accessibility | `middleware/accessibility.tsx` | SkipNav, LiveRegion, useFocusTrap |
| PDF Export | `server.ts` (line ~3220) | Story data export endpoint |

---

## 3. File Inventory

### New Files Created (not in original codebase)
```
middleware/
├── accessibility.tsx       # A11y utilities (SkipNav, LiveRegion, useFocusTrap)
├── analytics.ts            # Event tracking (PostHog-ready)
├── collaboration.ts        # Real-time collaboration (Firestore-based)
├── emailService.ts         # Email notification templates
├── errorTracker.ts         # Structured error capture
├── featureFlags.ts         # Feature flag system
├── jobQueue.ts             # Background job queue
├── logger.ts               # Structured JSON logging
├── rateLimit.ts            # Sliding window rate limiter
├── rbac.ts                 # Role-based access control
├── security.ts             # Input validation + security headers
├── subscription.ts         # Subscription management

routes/
├── admin.ts                # Admin settings, plans, formats (30 routes)
├── admin-ai.ts             # AI providers, models, workflows (19 routes)
├── admin-content.ts        # Personas, glossary, usage modes (14 routes)
├── admin-users.ts          # Customers, tokens, system users (12 routes)

api/
├── v1/index.ts             # Developer API v1 (Bearer auth, OpenAPI)
├── classroom.ts            # Classroom/LMS integration

db/
├── migrate.ts              # Versioned migration runner

tests/
├── api.test.ts             # API route tests
├── auth.test.ts            # Auth flow tests
├── components.test.tsx     # React component tests
├── migrations.test.ts      # Migration tests
├── stripe-webhook.test.ts  # Stripe webhook tests

public/
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker

scripts/
├── setup.sh                # Dev environment setup

docs/
├── README.md               # Project overview
├── CHANGELOG.md            # Phase-by-phase changest
├── ARCHITECTURE.md         # System diagrams
├── TROUBLESHOOTING.md      # Common issues & fixes
├── CONTRIBUTING.md         # Dev workflow guide
├── BACKUP_RESTORE.md       # Backup procedures
├── COPPA_COMPLIANCE.md     # COPPA audit
├── SECRET_MANAGER_SETUP.md # GCP Secret Manager
├── DEPLOY_CUSTOM_DOMAIN.md # Domain setup
├── DEPLOY_MULTI_REGION.md  # Multi-region deploy
├── CDN_SETUP.md            # CDN configuration
├── I18N_QA.md              # i18n QA checklist
```

### Modified Files
```
server.ts                  # 330KB → ~340KB (new imports, mounted routers, Phase 7 endpoints)
index.html                 # Added PWA manifest link, theme-color, apple-mobile-web-app
package.json               # Added lint scripts, lint-staged config
.gitignore                 # Added *.bak, *.compiled, coverage/
```

---

## 4. Environment Variables

### Required (app won't start without these)
```bash
GEMINI_API_KEY=your_gemini_api_key
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
DATABASE_URL=postgresql://user:password@host:5432/storymenu
```

### Optional (features degrade gracefully without these)
```bash
# Email
SMTP_HOST=smtp.example.com
SMTP_USER=user@example.com
SMTP_PASSWORD=password
SMTP_FROM=noreply@storymenu.app

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx

# Admin
ADMIN_EMAIL=admin@storymenu.app

# Stripe (publishable key for frontend)
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

---

## 5. Database Schema

### PostgreSQL Tables (created by migrations)

**users**
```sql
id SERIAL PRIMARY KEY
email VARCHAR(255) UNIQUE
tokens INTEGER DEFAULT 0
tier VARCHAR(100)
subscription_id VARCHAR(100)
payment_method VARCHAR(50)
role VARCHAR(50) DEFAULT 'viewer'
subscription_status VARCHAR(50) DEFAULT 'active'
created_at TIMESTAMP DEFAULT NOW()
```

**subscription_plans**
```sql
id SERIAL PRIMARY KEY
name VARCHAR(255)
description TEXT
price_subscription DECIMAL(10,2)
price_one_time DECIMAL(10,2)
features JSONB
created_at TIMESTAMP DEFAULT NOW()
```

**starting_formats**
```sql
id SERIAL PRIMARY KEY
slug VARCHAR(100)
title VARCHAR(255)
short_description TEXT
long_description TEXT
icon VARCHAR(10)
sort_order INT DEFAULT 0
is_featured BOOLEAN DEFAULT false
created_at TIMESTAMP DEFAULT NOW()
```

**app_settings**
```sql
key_name VARCHAR(100) PRIMARY KEY
key_value TEXT NOT NULL
is_secret BOOLEAN DEFAULT false
description TEXT
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**deletion_requests** (GDPR)
```sql
id SERIAL PRIMARY KEY
email VARCHAR(255) NOT NULL
reason TEXT
status VARCHAR(50) DEFAULT 'pending'
requested_at TIMESTAMP DEFAULT NOW()
processed_at TIMESTAMP
processed_by VARCHAR(255)
```

**audit_log**
```sql
id SERIAL PRIMARY KEY
actor_email VARCHAR(255) NOT NULL
action VARCHAR(100) NOT NULL
target_type VARCHAR(50)
target_id VARCHAR(255)
metadata JSONB
created_at TIMESTAMP DEFAULT NOW()
```

**_migrations** (migration tracking)
```sql
version INTEGER PRIMARY KEY
name VARCHAR(255) NOT NULL
applied_at TIMESTAMP DEFAULT NOW()
```

### Firestore Collections
```
users/{email}/
├── characters/
├── projects/
│   └── versions/     (version history)
├── saved_stories/
└── ai_usage_logs/

classrooms/{classId}/
├── members/
└── assignments/

subscriptions/{email}

feature_flags/{flagName}

collaboration_sessions/{storyId}/
└── presence/{userId}

deletion_requests/
```

---

## 6. API Endpoints

### Public Endpoints
```
POST /api/checkout                 # Create Stripe checkout session
GET  /api/checkout/config          # Get Stripe publishable key
POST /api/webhooks/stripe          # Stripe webhook handler
GET  /api/user/tokens              # Get user token balance
POST /api/gemini/beat              # Generate story beat
POST /api/gemini/character-sheet   # Generate character sheet
POST /api/gemini/narration         # Generate narration
POST /api/public/moderate/check    # Content moderation
GET  /api/public/plans             # List subscription plans
```

### Developer API v1 (`/api/v1/*`)
```
GET  /api/v1/stories               # List stories (paginated)
GET  /api/v1/stories/:id           # Get story by ID
POST /api/v1/stories/:id/export    # Export story
GET  /api/v1/genres                # List genres
GET  /api/v1/formats               # List formats
GET  /api/v1/usage                 # API usage stats
GET  /api/v1/openapi.json          # OpenAPI spec
```

### Admin Endpoints (`/api/admin/*`)
```
POST /api/admin/login              # Admin authentication
GET  /api/admin/settings           # List app settings
POST /api/admin/settings           # Update setting
GET  /api/admin/plans              # List subscription plans
POST /api/admin/plans              # Create plan
DELETE /api/admin/plans/:id        # Delete plan
GET  /api/admin/formats            # List formats
POST /api/admin/formats            # Create format
PUT  /api/admin/formats/:id        # Update format
DELETE /api/admin/formats/:id      # Delete format
GET  /api/admin/customers          # List customers
POST /api/admin/customers          # Create customer
PUT  /api/admin/customers/:email   # Update customer
DELETE /api/admin/customers/:email # Delete customer
POST /api/admin/customers/:email/tokens  # Modify tokens
GET  /api/admin/ai-providers       # List AI providers
POST /api/admin/ai-providers       # Create provider
PUT  /api/admin/ai-providers/:id   # Update provider
DELETE /api/admin/ai-providers/:id # Delete provider
GET  /api/admin/ai-models          # List AI models
POST /api/admin/ai-models          # Create model
PUT  /api/admin/ai-models/:id      # Update model
DELETE /api/admin/ai-models/:id    # Delete model
GET  /api/admin/ai-workflows       # List workflows
POST /api/admin/ai-workflows       # Create workflow
PUT  /api/admin/ai-workflows/:id   # Update workflow
DELETE /api/admin/ai-workflows/:id # Delete workflow
GET  /api/admin/ai-routing-rules   # List routing rules
POST /api/admin/ai-routing-rules   # Create rule
PUT  /api/admin/ai-routing-rules/:id  # Update rule
DELETE /api/admin/ai-routing-rules/:id # Delete rule
GET  /api/admin/ai-routing/resolve # Dry-run resolver
GET  /api/admin/personas           # List personas
POST /api/admin/personas           # Create persona
PUT  /api/admin/personas/:id       # Update persona
DELETE /api/admin/personas/:id     # Delete persona
GET  /api/admin/glossary           # List glossary
POST /api/admin/glossary           # Create term
PUT  /api/admin/glossary/:id       # Update term
DELETE /api/admin/glossary/:id     # Delete term
GET  /api/admin/usage-modes        # List usage modes
POST /api/admin/usage-modes        # Create mode
PUT  /api/admin/usage-modes/:id    # Update mode
GET  /api/admin/cost-analytics     # Cost analytics
GET  /api/admin/landing            # Landing page config
POST /api/admin/landing            # Update landing config
```

### Classroom API (`/api/classroom/*`)
```
POST /api/classroom/create         # Create class
POST /api/classroom/join           # Join class with code
GET  /api/classroom/:id            # Get class details
GET  /api/classroom/:id/students   # List students + progress
POST /api/classroom/:id/assign     # Create assignment
```

### Phase 7 Endpoints
```
GET  /api/feature-flags            # List all flags
GET  /api/feature-flags/:flagName  # Check flag
POST /api/feature-flags            # Create/update flag
GET  /api/subscription/plans       # List plans
GET  /api/subscription/:email      # Get user subscription
POST /api/subscription/change-plan # Upgrade/downgrade
POST /api/subscription/cancel      # Cancel subscription
POST /api/subscription/reactivate  # Reactivate subscription
GET  /api/jobs/status              # Job queue status
GET  /api/user/export              # GDPR data export
POST /api/user/delete-request      # GDPR deletion request
POST /api/story/:id/snapshot       # Save version
GET  /api/story/:id/versions       # List versions
GET  /api/story/:id/versions/:vid  # Get version
POST /api/story/:id/restore/:vid   # Restore version
POST /api/collab/create            # Create collab session
POST /api/collab/join              # Join session
POST /api/collab/cursor            # Update cursor
POST /api/collab/leave             # Leave session
POST /api/collab/save              # Save with conflict detection
POST /api/moderate/check           # Content moderation
GET  /api/export/story/:id         # Export story data
```

---

## 7. Middleware Stack

Applied in order (server.ts):

```
1. express.json({ limit: '50mb' })
2. express.urlencoded({ extended: true, limit: '50mb' })
3. CORS headers (if configured)
4. HSTS + HTTPS redirect (production)
5. Rate limiting (sliding window)
6. Request ID injection (X-Request-Id)
7. Structured request logging
8. Route handlers (extracted modules mounted first)
9. Error tracking middleware (catches all)
```

---

## 8. Testing

### Run Tests
```bash
npm test                    # All tests
npx vitest tests/api.test.ts     # API tests only
npx vitest --coverage             # With coverage
```

### Test Files
| File | Tests | Coverage |
|---|---|---|
| `tests/api.test.ts` | 12 tests | Checkout, tokens, settings, v1 API, GDPR, moderation |
| `tests/stripe-webhook.test.ts` | 6 tests | Signature verification, event processing |
| `tests/auth.test.ts` | 9 tests | Login, RBAC, Firebase, tier resolution |
| `tests/components.test.tsx` | 8 tests | Gallery, story detail, checkout, legal pages |
| `tests/migrations.test.ts` | 7 tests | Versioning, rollback, idempotency |

---

## 9. Deployment Checklist

### Step 1: Environment Variables
Set these in Cloud Run or `.env` for local:
```bash
GEMINI_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
FIREBASE_SERVICE_ACCOUNT_KEY=...
DATABASE_URL=...
ADMIN_EMAIL=admin@storymenu.app
```

### Step 2: Install Dependencies
```bash
npm install
bash scripts/setup.sh  # Installs dev deps + pre-commit hooks
```

### Step 3: Database Setup
```bash
# Create PostgreSQL database
createdb storymenu

# Run migrations
npx tsx db/migrate.ts
```

### Step 4: Build
```bash
npm run build
```

### Step 5: Deploy to Cloud Run
```bash
gcloud run deploy story-menu-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=$GEMINI_API_KEY" \
  --set-secrets="STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,DATABASE_URL=DATABASE_URL:latest"
```

### Step 6: Configure Stripe Webhook
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-url.app/api/webhooks/stripe`
3. Events: `payment_intent.succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Step 7: Verify
```bash
# Health check
curl https://your-url.app/api/db-status

# Test checkout
curl https://your-url.app/api/checkout/config

# Test API
curl -H "Authorization: Bearer YOUR_KEY" https://your-url.app/api/v1/stories
```

---

## 10. Known Issues & Technical Debt

### Merge Conflicts
- 12 branches had merge conflicts when merging to main
- Resolved using `git merge -X theirs` (accepted incoming branch code)
- **Action:** Review `server.ts` for any duplicate route definitions

### Duplicate Routes
- Original routes in `server.ts` are still present alongside extracted routes
- Extracted routes (`routes/admin.ts`, etc.) are mounted first, so they take precedence
- **Action:** Remove the old route blocks from `server.ts` to avoid confusion

### Memory DB Fallback
- Many routes use in-memory fallback when PostgreSQL is unavailable
- This is fine for development but data is lost on restart
- **Action:** Ensure PostgreSQL is always running in production

### Missing Icons
- PWA manifest references icons that don't exist yet (`/icons/icon-*.png`)
- **Action:** Generate PWA icons or update manifest with actual icon paths

### Test Coverage
- Tests are mostly placeholder/structure tests
- **Action:** Add real assertions and mock database calls properly

### Frontend Component Decomposition
- `AdminDashboard.tsx` (250KB), `App.tsx` (79KB), `Setup.tsx` (85KB) are still monolithic
- **Action:** Extract into smaller components (future sprint)

---

## 11. Next Steps for AI Assistant

If you are an AI assistant (Gemini CLI, Claude, etc.) picking up this project, here's what to do:

### Immediate (Deployment)
1. Read `README.md` for project overview
2. Set environment variables (see Section 4)
3. Run `npm install && npm run build`
4. Deploy to Cloud Run (see Section 9)
5. Configure Stripe webhook

### Short-term (Cleanup)
1. Remove duplicate routes from `server.ts` (keep extracted routes only)
2. Generate PWA icons for `public/icons/`
3. Add real test assertions (not just placeholders)
4. Verify all middleware imports resolve correctly

### Medium-term (Features)
1. Add Perspective API for content moderation (replace keyword screening)
2. Implement real-time collaboration frontend (WebSocket client)
3. Add PostHog analytics (replace console.log in `middleware/analytics.ts`)
4. Set up Cloud CDN for static assets

### Long-term (Scale)
1. Multi-region Cloud Run deployment
2. Component decomposition (AdminDashboard, App, Setup)
3. E2E test suite (Playwright)
4. Performance monitoring (APM)

---

## Appendix: Git Branches

All 25 branches merged to `main`:

```
mike/fix-admin-rbac              # Phase 1: Security fix
mike/feat-stripe-webhooks        # Phase 1: Payments
mike/feat-rate-limiting          # Phase 1: Security
mike/feat-security-headers       # Phase 1: Security
mike/feat-sentry                 # Phase 2: Observability
mike/feat-cicd                   # Phase 5: CI/CD
mike/feat-gdpr-export            # Phase 6: Compliance
mike/feat-rbac-expansion         # Phase 2: Security
mike/feat-analytics              # Phase 2: Observability
mike/feat-seo-story-pages        # Phase 2: SEO
mike/feat-phase3-api             # Phase 3: Developer API
mike/feat-phase3-classroom-multiregion  # Phase 3: Classroom + Multi-region
mike/feat-phase3-collab          # Phase 3: Real-time Collab
mike/feat-phase7-features        # Phase 7: All features
mike/test-api-stripe-auth        # Phase 4: Test suite
mike/refactor-routes-admin       # Phase 3: Route decomposition
mike/refactor-routes-ai          # Phase 3: Route decomposition
mike/refactor-routes-users-content  # Phase 3: Route decomposition
mike/docs-project-tracking       # Documentation
mike/feat-backup-coppa           # Phase 5+6: Docs
mike/feat-hsts-export-mobile     # Phase 2+3: Security + Features
mike/feat-accessibility-infra    # Phase 3: A11y + Domain docs
mike/feat-lint-stale-hooks       # Phase 3: Code quality
mike/feat-db-migrations-secrets  # Phase 5: Infrastructure
mike/feat-seo-story-pages        # Phase 2: SEO
```

---

**End of handoff document.**
