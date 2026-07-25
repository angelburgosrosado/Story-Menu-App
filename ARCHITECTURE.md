# Architecture

System architecture and design decisions for Story Menu App.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React 19)                     │
│  Vite + TypeScript · Tailwind CSS · Motion · Spline 3D  │
│  i18next · React Helmet Async · Recharts                │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/HTTPS
┌──────────────────────▼──────────────────────────────────┐
│                 SERVER (Express 5)                       │
│  Rate Limiting · Input Validation · RBAC Middleware     │
│  Structured Logging · Error Tracking (Sentry)           │
├─────────────────────────────────────────────────────────┤
│  ROUTES                                                 │
│  ├── routes/admin.ts        (Admin CRUD)                │
│  ├── routes/admin-ai.ts     (AI Admin)                  │
│  ├── routes/admin-users.ts  (User Management)           │
│  ├── routes/admin-content.ts (Content Management)       │
│  ├── api/v1/index.ts        (Developer API v1)          │
│  ├── api/classroom.ts       (Classroom/LMS)             │
│  └── middleware/             (Auth, RBAC, Analytics)     │
├─────────────────────────────────────────────────────────┤
│  SERVICES                                               │
│  ├── Gemini API (AI Generation)                         │
│  ├── Image Engines (LlamaGen, ConfyUI, Leonardo)        │
│  ├── Web Audio Synthesizer (Procedural Music)           │
│  ├── TTS Narration                                      │
│  └── Email Service (Transactional)                      │
├─────────────────────────────────────────────────────────┤
│  DATA                                                   │
│  ├── PostgreSQL (Multi-tenant, per-user schemas)        │
│  ├── Firebase Firestore (User data, settings)           │
│  └── Cloud Storage (Generated images, audio)            │
└─────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Multi-Tenant Database Isolation

Each creator gets a distinct PostgreSQL schema (`vault_app_<username>`). This ensures:
- Intellectual property isolation between creators
- Per-user character attributes, comic chapters, and cast selections
- Clean data deletion on account removal

### 2. Self-Healing Database Connection

The server conducts background TCP socket probes on port 5432. If the database is unreachable:
- Connection state flips to offline
- App enters interactive sandbox mode
- No crash, no data loss
- Automatic reconnection when database returns

### 3. Multi-Engine Image Pipeline

Four image generation engines with graceful fallback:

| Engine | Use Case | Fallback |
|---|---|---|
| Gemini 2.5 Flash | Default cloud generation | Always available |
| LlamaGen.ai | Comic panel sequences | → Gemini |
| ConfyUI | Custom diffusion workflows | → Gemini |
| Leonardo.ai | Character consistency | → Gemini |

### 4. Server-Side Route Decomposition

Routes are organized by domain:

```
server.ts (slim entry point)
├── routes/admin.ts          — 95 admin endpoints
├── routes/admin-ai.ts       — AI configuration routes
├── routes/admin-users.ts    — User/customer CRUD
├── routes/admin-content.ts  — Content management
├── api/v1/index.ts          — Public developer API
└── api/classroom.ts         — Education integration
```

### 5. Middleware Stack

```
Request → Rate Limiter → Input Validator → Auth (Firebase) → RBAC → Route Handler
                                                                   ↓
                                                            Analytics Event
                                                                   ↓
                                                            Response + Logging
```

## File Structure

```
Story-Menu-App/
├── api/
│   ├── v1/index.ts          # Developer API v1
│   └── classroom.ts         # Classroom/LMS API
├── middleware/
│   ├── rateLimit.ts         # Rate limiting
│   ├── security.ts          # Security headers + CSP
│   ├── rbac.ts              # Role-based access control
│   ├── logger.ts            # Structured logging
│   ├── errorTracker.ts      # Sentry integration
│   ├── analytics.ts         # Event tracking
│   ├── accessibility.tsx    # A11y middleware
│   ├── collaboration.ts     # Real-time collaboration
│   └── emailService.ts      # Transactional emails
├── routes/
│   ├── admin.ts             # Admin CRUD routes
│   ├── admin-ai.ts          # AI admin routes
│   ├── admin-users.ts       # User management routes
│   └── admin-content.ts     # Content management routes
├── db.ts                    # Database connection + self-healing
├── server.ts                # Express app entry point
├── tests/                   # Test suite
│   ├── api.test.ts
│   ├── auth.test.ts
│   ├── stripe-webhook.test.ts
│   ├── components.test.tsx
│   └── migrations.test.ts
├── *.tsx                    # React components (40+)
├── Dockerfile               # Container build
├── .github/workflows/       # CI/CD pipeline
└── docs/                    # Documentation
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default: 3000) | Server port |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Yes | Firebase Admin SDK credentials |
| `STRIPE_SECRET_KEY` | Yes | Stripe payment processing |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signature verification |
| `LLAMAGEN_API_KEY` | No | LlamaGen.ai image engine |
| `CONFYUI_API_URL` | No | ConfyUI workflow server |
| `LEONARDO_API_KEY` | No | Leonardo.ai character consistency |

## Deployment

- **Platform:** Google Cloud Run
- **Build:** Vite (frontend) + esbuild (server) → single CJS bundle
- **Container:** Node.js 20 slim
- **CI/CD:** GitHub Actions (lint → test → build → deploy)
- **Secrets:** Google Cloud Secret Manager
- **Database:** Cloud SQL (PostgreSQL) + Firebase Firestore
