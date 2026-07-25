# Troubleshooting Guide

Common issues and solutions for Story Menu App development and deployment.

---

## Table of Contents

1. [Server Won't Start](#1-server-wont-start)
2. [Database Connection Issues](#2-database-connection-issues)
3. [AI Generation Failures](#3-ai-generation-failures)
4. [Image Engine Errors](#4-image-engine-errors)
5. [Stripe Payment Issues](#5-stripe-payment-issues)
6. [Firebase Authentication Errors](#6-firebase-authentication-errors)
7. [Build Failures](#7-build-failures)
8. [Cloud Run Deployment Issues](#8-cloud-run-deployment-issues)
9. [Rate Limiting Errors](#9-rate-limiting-errors)
10. [Performance Issues](#10-performance-issues)

---

## 1. Server Won't Start

### Symptoms
- `exit(1)` on startup
- Health check handshake failures in logs

### Common Causes & Fixes

**Missing environment variables:**
```bash
# Check required vars
echo $DATABASE_URL
echo $GEMINI_API_KEY
echo $FIREBASE_SERVICE_ACCOUNT_KEY

# Server will fail loudly if Firebase Admin is missing (Task 1.8)
```

**Port binding issues:**
```bash
# Cloud Run injects PORT env var
# Server binds to process.env.PORT || 3000
# Ensure no other process is using the port
lsof -i :3000
```

**Vite not available in production:**
```bash
# Server has fallback to serve pre-compiled static assets from dist/
# If Vite fails to load, check that npm run build completed successfully
ls -la dist/
```

---

## 2. Database Connection Issues

### Symptoms
- `ECONNREFUSED` errors
- Connection pool failures on startup
- App enters sandbox mode unexpectedly

### Common Causes & Fixes

**Invalid connection string:**
```bash
# Self-healing URL guard blocks invalid strings
# Check for placeholder values:
# ❌ postgresql://username:password@base:5432
# ❌ postgresql://placeholder:placeholder@your_host:5432
# ✅ postgresql://user:pass@host:5432/dbname
```

**Database offline:**
```bash
# Self-healing protocol conducts background TCP probes
# If database is unreachable, app enters interactive sandbox mode
# Check database status:
npm test  # Runs test-db-queries.cjs
```

**Connection pool exhaustion:**
```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'your_database';

# Solution: Add PgBouncer for connection pooling
# Especially important for Cloud Run scale-to-zero
```

**Foreign key violations (guest users):**
```bash
# Self-Healing User/Creator Auto-Seeding Engine handles this
# Server dynamically seeds userId UUID in users table before writes
# If you see FK violations, check that the auto-seeding middleware is active
```

---

## 3. AI Generation Failures

### Symptoms
- Gemini API errors
- Story generation timeout
- Image generation returns empty

### Common Causes & Fixes

**API key issues:**
```bash
# Verify key is set and valid
echo $GEMINI_API_KEY

# Check API quota
# Gemini 2.5 Flash has rate limits per project
# Add retry logic with exponential backoff
```

**Content filtering:**
```bash
# Gemini has safety settings (HarmCategory, HarmBlockThreshold)
# Check server.ts for HarmBlockThreshold configuration
# Adjust thresholds if legitimate content is being blocked
```

**Missing keys for other engines:**
```bash
# Each engine has its own API key
# Missing keys trigger graceful fallback to Gemini
# Check console for warnings about missing keys
LLAMAGEN_API_KEY=your_key    # LlamaGen.ai
CONFYUI_API_URL=your_url     # ConfyUI server
LEONARDO_API_KEY=your_key    # Leonardo.ai
```

---

## 4. Image Engine Errors

### Symptoms
- ConfyUI connection refused
- Leonardo persona generation fails
- LlamaGen timeout

### Common Causes & Fixes

**ConfyUI server offline:**
```bash
# API has built-in fallback to Gemini
# Check ConfyUI server status
curl http://127.0.0.1:8188/system_stats

# If offline, images fall back to Gemini generation
# No crash, no data loss
```

**Leonardo character consistency:**
```bash
# Leonardo requires character reference images
# Ensure reference images are uploaded before persona generation
# Check /api/leonardo/persona endpoint
```

---

## 5. Stripe Payment Issues

### Symptoms
- Checkout fails
- Webhook signature verification fails
- Payment not reflected in user account

### Common Causes & Fixes

**Webhook signature mismatch:**
```bash
# Verify STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
# Webhook endpoint: /api/stripe/webhook
# Must use stripe.webhooks.constructEvent()

# Test webhook locally:
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Test vs Live mode:**
```bash
# Ensure using correct keys
# Test mode: sk_test_...
# Live mode: sk_live_...

# Sandbox mode is default until explicitly authorized
# Never switch to live without owner confirmation
```

**Missing webhook handler:**
```bash
# Task 1.3 added checkout.session.completed handler
# Verify webhook is registered in Stripe Dashboard
# Dashboard → Developers → Webhooks → Add endpoint
```

---

## 6. Firebase Authentication Errors

### Symptoms
- Token verification fails
- Admin endpoints return 403
- User creation fails

### Common Causes & Fixes

**Missing service account key:**
```bash
# Server fails loudly if FIREBASE_SERVICE_ACCOUNT_KEY is missing
# Verify in Google Cloud Console:
# IAM → Service Accounts → Create key → JSON

# Set in Secret Manager:
gcloud secrets create FIREBASE_SERVICE_ACCOUNT_KEY --data-file=serviceAccountKey.json
```

**Token expired:**
```bash
# Firebase tokens expire after 1 hour
# Client must refresh tokens automatically
# Check firebase/auth on client side for token refresh logic
```

**RBAC role not set:**
```bash
# Admin access requires role field in Firestore user document
# Check: users/{uid}/role = "admin" | "superadmin" | "owner"
# Hardcoded admin emails have been removed (Task 1.7)
```

---

## 7. Build Failures

### Symptoms
- `npm run build` fails
- TypeScript compilation errors
- esbuild bundling errors

### Common Causes & Fixes

**TypeScript errors:**
```bash
# Run type check separately
npx tsc --noEmit

# Fix type errors before building
# Common issues: missing imports, type mismatches
```

**esbuild bundling:**
```bash
# Build command:
npm run build
# Equivalent to: vite build && esbuild server.ts --bundle --platform=node

# If esbuild fails, check for:
# - Dynamic imports that can't be resolved
# - Node.js built-in modules not marked as external
```

**Dependency conflicts:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check for version conflicts
npm ls --depth=0
```

---

## 8. Cloud Run Deployment Issues

### Symptoms
- Container fails to start
- Health check timeout
- Service not accessible

### Common Causes & Fixes

**Docker build issues:**
```bash
# Test locally first
docker build -t story-menu-app .
docker run -p 3000:3000 story-menu-app

# Check Dockerfile uses node:20-slim
# Ensure npm install runs during build
```

**PORT not configured:**
```bash
# Cloud Run injects PORT env var
# Server must bind to process.env.PORT || 3000
# Always use 0.0.0.0 as host

# Verify in Dockerfile:
# CMD ["npm", "start"]
# start script: node dist/server.cjs
```

**Health check failures:**
```bash
# Cloud Run expects health check on / or /health
# Ensure server responds to GET requests
# Check server.ts for health check endpoint
```

**Secret Manager access:**
```bash
# Verify Cloud Run service account has access to secrets
# gcloud run services describe myiad-comic-app --region us-central1

# Grant access if needed:
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member=serviceAccount:SERVICE_ACCOUNT_EMAIL \
  --role=roles/secretmanager.secretAccessor
```

---

## 9. Rate Limiting Errors

### Symptoms
- `429 Too Many Requests` responses
- Legitimate requests being blocked

### Common Causes & Fixes

**Too restrictive limits:**
```bash
# Check rate limit configuration in middleware/rateLimit.ts
# Default limits may be too low for production

# Adjust per-route limits:
# - Image generation: higher limits (expensive but expected)
# - API endpoints: standard limits
# - Admin endpoints: higher limits for batch operations
```

**Shared IP addresses:**
```bash
# Multiple users behind same IP (office, VPN)
# Consider per-user limits instead of per-IP
# Use Firebase UID for user-based limiting
```

---

## 10. Performance Issues

### Symptoms
- Slow page loads
- High memory usage
- API response timeouts

### Common Causes & Fixes

**Large bundle size:**
```bash
# Check bundle size
npm run build
ls -la dist/

# Task 3.7 added code splitting
# Verify lazy loading is working:
# - Route-based chunks should be separate files
# - Initial load should be smaller
```

**Database query performance:**
```bash
# Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

# Add indexes for frequent queries
# Consider read replicas for heavy read workloads
```

**AI generation timeouts:**
```bash
# Gemini API can take 10-30 seconds for complex stories
# Implement progress polling for long-running requests
# Task 7.8 (Background Job Queue) addresses this
```

**Memory leaks:**
```bash
# Monitor Node.js memory
node --max-old-space-size=4096 dist/server.cjs

# Check for:
# - Unclosed database connections
# - Event listener accumulation
# - Large object retention in memory
```

---

## Getting Help

- **Logs:** Google Cloud Logging Explorer
  ```
  resource.type="cloud_run_revision" AND resource.labels.service_name="myiad-comic-app"
  ```
- **Tests:** `npm test` (database connectivity + write-through)
- **Validation:** `npm run validate:deploy` (file structure + build output)
- **Architecture:** See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Changelog:** See [CHANGELOG.md](./CHANGELOG.md)
