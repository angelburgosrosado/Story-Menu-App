# Architecture — Story.Menu

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CDN (Cloud CDN)                          │
│                    Static assets, images                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    Cloud Run (us-central1)                      │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Express.js  │  │  React SPA   │  │  Developer API v1    │  │
│  │  Server      │  │  (Vite)      │  │  /api/v1/*           │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────────┘  │
│         │                                                       │
│  ┌──────▼───────────────────────────────────────────────────┐  │
│  │                  Route Modules                            │  │
│  │  routes/admin.ts    (settings, plans, formats)           │  │
│  │  routes/admin-ai.ts (providers, models, workflows)       │  │
│  │  routes/admin-users.ts (customers, tokens)               │  │
│  │  routes/admin-content.ts (personas, glossary)            │  │
│  │  api/classroom.ts   (classroom/LMS)                      │  │
│  └──────┬───────────────────────────────────────────────────┘  │
│         │                                                       │
│  ┌──────▼───────────────────────────────────────────────────┐  │
│  │                  Middleware Layer                          │  │
│  │  rateLimit.ts  │  rbac.ts  │  security.ts                │  │
│  │  logger.ts     │  errorTracker.ts  │  analytics.ts        │  │
│  │  featureFlags.ts  │  jobQueue.ts  │  collaboration.ts     │  │
│  └──────┬───────────────────────────────────────────────────┘  │
│         │                                                       │
│  ┌──────▼───────────────────────────────────────────────────┐  │
│  │                  Data Layer                               │  │
│  │  PostgreSQL (Cloud SQL)  │  Firestore  │  Memory DB      │  │
│  └──────────────────────────────────────────────────────────┘  │
│         │                                                       │
│  ┌──────▼───────────────────────────────────────────────────┐  │
│  │                  External Services                        │  │
│  │  Google Gemini API  │  Stripe  │  Firebase Auth           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Story Creation
```
User → Setup Wizard → Gemini API → Generated Story → Firestore → Public Gallery
                                    ↓
                              Image Generation → Cloud Storage
                                    ↓
                              Voice Narration → Audio Storage
```

### Payment Flow
```
User → Checkout Modal → Stripe Checkout → Webhook → Server
                                                    ↓
                                            Activate Subscription
                                                    ↓
                                            Send Confirmation Email
```

### Real-time Collaboration
```
User A edits → Firestore Write → Real-time Listener → User B sees changes
                           ↓
                    Presence Update → Cursor Positions
```

## Key Design Decisions

### 1. Memory DB Fallback
- PostgreSQL is primary, Firestore is secondary, Memory DB is fallback
- All CRUD operations try PostgreSQL first, then Firestore, then memory
- Enables development without database setup

### 2. Route Decomposition
- 75 admin routes extracted from monolith into 4 modules
- Each module uses Express Router with shared memoryDb bridge
- Generic `memoryCrud()` helper reduces boilerplate

### 3. Feature Flags
- Firestore-backed with 60-second in-memory cache
- Deterministic percentage rollouts (user hash + flag name)
- Environment gates (production/staging/development)

### 4. Job Queue
- In-memory priority queue with retry logic
- 3 max attempts per job, configurable priority
- Pre-defined handlers for email, export, moderation

## Security Layers

```
┌─────────────────────────────────────────┐
│  Layer 1: HTTPS + HSTS                  │
├─────────────────────────────────────────┤
│  Layer 2: Rate Limiting                 │
├─────────────────────────────────────────┤
│  Layer 3: Input Validation              │
├─────────────────────────────────────────┤
│  Layer 4: RBAC (5-tier)                 │
├─────────────────────────────────────────┤
│  Layer 5: API Key Auth (Developer API)  │
├─────────────────────────────────────────┤
│  Layer 6: Firebase Token Verification   │
└─────────────────────────────────────────┘
```

## Deployment Architecture

### Single Region (Default)
```
Cloud Run (us-central1) → Cloud SQL (us-central1) → Firestore (nam5)
```

### Multi-Region (Optional)
```
Cloud Run (us-central1) ─┐
Cloud Run (eu-west1)    ─┼→ Cloud SQL (us-central1) → Firestore (nam5)
Cloud Run (asia-east1)  ─┘
         │
    Cloud CDN (global)
```

## Performance Considerations

| Area | Strategy |
|---|---|
| Static assets | CDN + immutable cache (1 year) |
| API responses | Network-first with cache fallback |
| Database queries | Connection pooling, indexed queries |
| AI generation | Token budget enforcement, cost optimization |
| Images | Cloud Storage + CDN, lazy loading |
