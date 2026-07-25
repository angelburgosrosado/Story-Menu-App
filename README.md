# Story.Menu — AI Comic Book & Story Creator

> Create stunning AI-generated comic books and interactive stories in minutes. Powered by Gemini.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev

# Open http://localhost:3001
```

## 📦 Project Structure

```
Story-Menu-App/
├── api/                    # Backend API routes
│   ├── v1/                # Developer API v1
│   └── classroom.ts       # Classroom/LMS integration
├── db/                     # Database utilities
│   └── migrate.ts          # Migration runner
├── i18n/                   # Internationalization
├── middleware/              # Express middleware
│   ├── accessibility.tsx   # A11y utilities
│   ├── analytics.ts        # Event tracking
│   ├── collaboration.ts    # Real-time collab
│   ├── emailService.ts     # Email notifications
│   ├── errorTracker.ts     # Error capture
│   ├── featureFlags.ts     # Feature flag system
│   ├── jobQueue.ts         # Background jobs
│   ├── logger.ts           # Structured logging
│   ├── rateLimit.ts        # Rate limiting
│   ├── rbac.ts             # Role-based access
│   ├── security.ts         # Input validation
│   └── subscription.ts     # Subscription mgmt
├── public/                  # Static assets
│   ├── icons/              # PWA icons
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker
├── routes/                  # Extracted route modules
│   ├── admin.ts            # Admin settings, plans, formats
│   ├── admin-ai.ts         # AI providers, models, workflows
│   ├── admin-content.ts    # Personas, glossary, usage modes
│   └── admin-users.ts      # Customer management
├── tests/                   # Test suite
│   ├── api.test.ts         # API route tests
│   ├── auth.test.ts        # Auth flow tests
│   ├── components.test.tsx # Component tests
│   ├── migrations.test.ts  # Migration tests
│   └── stripe-webhook.test.ts # Stripe tests
├── *.tsx                    # React components
├── server.ts                # Express server entry
├── db.ts                    # Database connection
├── pricingIntelligence.ts   # AI cost optimization
└── types.ts                 # TypeScript types
```

## 🔧 Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_key
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional
SMTP_HOST=smtp.example.com
SMTP_USER=user@example.com
SMTP_PASSWORD=password
SMTP_FROM=noreply@storymenu.app
SENTRY_DSN=https://xxx@sentry.io/xxx
ADMIN_EMAIL=admin@storymenu.app
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npx vitest tests/api.test.ts

# Run with coverage
npx vitest --coverage
```

## 🚢 Deployment

```bash
# Build for production
npm run build

# Validate deployment
npm run validate:deploy

# Start production server
npm start
```

See [DEPLOY_CUSTOM_DOMAIN.md](DEPLOY_CUSTOM_DOMAIN.md) for custom domain setup.
See [DEPLOY_MULTI_REGION.md](DEPLOY_MULTI_REGION.md) for multi-region deployment.
See [CDN_SETUP.md](CDN_SETUP.md) for CDN configuration.

## 📚 Documentation

| Document | Purpose |
|---|---|
| [README.md](README.md) | This file — project overview |
| [CHANGELOG.md](CHANGELOG.md) | What changed in each phase |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues & fixes |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [BACKUP_RESTORE.md](BACKUP_RESTORE.md) | Backup & restore procedures |
| [COPPA_COMPLIANCE.md](COPPA_COMPLIANCE.md) | COPPA compliance audit |
| [SECRET_MANAGER_SETUP.md](SECRET_MANAGER_SETUP.md) | GCP Secret Manager |
| [DEPLOY_CUSTOM_DOMAIN.md](DEPLOY_CUSTOM_DOMAIN.md) | Custom domain setup |
| [DEPLOY_MULTI_REGION.md](DEPLOY_MULTI_REGION.md) | Multi-region deployment |
| [CDN_SETUP.md](CDN_SETUP.md) | CDN configuration |
| [I18N_QA.md](I18N_QA.md) | i18n QA checklist |

## 🔐 Security

- RBAC with 5-tier role hierarchy
- Rate limiting (120 req/min general, 10 req/min AI, 5 req/hr checkout)
- Input validation on all endpoints
- Security headers (HSTS, X-Frame-Options, nosniff)
- Stripe webhook signature verification
- Firebase token verification

See [COPPA_COMPLIANCE.md](COPPA_COMPLIANCE.md) for compliance details.

## 📊 Monitoring

- Structured JSON logging with PII redaction
- Request ID tracking (X-Request-Id)
- Error capture with context
- Analytics event tracking (drop-in PostHog ready)

## 🌐 API

### Developer API v1
```bash
# Get stories
curl -H "Authorization: Bearer YOUR_API_KEY" https://storymenu.app/api/v1/stories

# OpenAPI spec
curl https://storymenu.app/api/v1/openapi.json
```

### Feature Flags
```bash
# Check feature flag
curl https://storymenu.app/api/feature-flags/new-feature?email=user@example.com
```

### Subscriptions
```bash
# Get plans
curl https://storymenu.app/api/subscription/plans

# Check user subscription
curl https://storymenu.app/api/subscription/user@example.com
```

## 📄 License

Apache-2.0
