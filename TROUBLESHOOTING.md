# Troubleshooting Guide — Story.Menu

## Quick Diagnostics

```bash
# Check server health
curl http://localhost:3001/api/db-status

# Check Stripe config
curl http://localhost:3001/api/checkout/config

# Check feature flags
curl http://localhost:3001/api/feature-flags

# Check job queue
curl http://localhost:3001/api/jobs/status
```

## Common Issues

### 1. Server Won't Start

**Symptom:** `Error: listen EADDRINUSE: address already in use :::3001`

**Fix:**
```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm run dev
```

### 2. Database Connection Failed

**Symptom:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Fix:**
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# If using Cloud SQL, ensure proxy is running
cloud-sql-proxy PROJECT:REGION:INSTANCE
```

### 3. Gemini API Errors

**Symptom:** `Error: API key not valid`

**Fix:**
```bash
# Check API key is set
echo $GEMINI_API_KEY

# Test API key
curl -H "x-goog-api-key: $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models
```

### 4. Stripe Webhook Failures

**Symptom:** `Webhook signature verification failed`

**Fix:**
1. Check `STRIPE_WEBHOOK_SECRET` is set correctly
2. Ensure webhook endpoint is `/api/webhooks/stripe`
3. Verify Stripe dashboard shows successful deliveries
4. Check raw body is preserved (express.raw middleware)

### 5. Firebase Auth Errors

**Symptom:** `Firebase ID token has expired`

**Fix:**
```bash
# Check service account key
echo $FIREBASE_SERVICE_ACCOUNT_KEY | jq .

# Verify Firebase project
firebase projects:list
```

### 6. Rate Limiting Too Aggressive

**Symptom:** `429 Too Many Requests`

**Fix:**
```bash
# Adjust rate limits in middleware/rateLimit.ts
# General: 120 req/min → 240 req/min
# AI: 10 req/min → 20 req/min
# Checkout: 5 req/hr → 10 req/hr
```

### 7. CORS Errors

**Symptom:** `Access-Control-Allow-Origin header missing`

**Fix:**
```bash
# Add to server.ts after app.use(express.json())
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://storymenu.app');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});
```

### 8. Build Failures

**Symptom:** `error TS2339: Property 'x' does not exist on type 'y'`

**Fix:**
```bash
# Type check without emitting
npx tsc --noEmit

# Fix type errors in the file
# Then rebuild
npm run build
```

### 9. Memory Issues

**Symptom:** `FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed`

**Fix:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Check for memory leaks in middleware/logger.ts
# Ensure job queue is processing (not stuck)
curl http://localhost:3001/api/jobs/status
```

### 10. Feature Flags Not Working

**Symptom:** Feature flag always returns false

**Fix:**
1. Check Firestore `feature_flags` collection exists
2. Verify flag document structure:
   ```json
   {
     "name": "my-feature",
     "enabled": true,
     "percentage": 100,
     "environments": ["production", "development"]
   }
   ```
3. Check cache refresh (60-second interval)
4. Call `featureFlags.setFlag()` to force sync

## Log Analysis

### Structured Log Format
```json
{
  "timestamp": "2026-07-25T15:00:00.000Z",
  "level": "error",
  "message": "AI generation failed",
  "requestId": "req_123456_abc",
  "userId": "user@example.com",
  "endpoint": "/api/gemini/beat",
  "statusCode": 500,
  "latencyMs": 1234
}
```

### Query Logs (Cloud Logging)
```bash
# Filter by level
gcloud logging read "jsonPayload.level=error" --limit=50

# Filter by endpoint
gcloud logging read 'jsonPayload.endpoint="/api/gemini/beat"' --limit=50

# Filter by user
gcloud logging read 'jsonPayload.userId="user@example.com"' --limit=50
```

## Performance Issues

### Slow API Responses
1. Check database query performance:
   ```sql
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```
2. Add indexes for frequently queried columns
3. Check connection pool size (default: 20)

### High Latency
1. Check Cloud Run instance count:
   ```bash
   gcloud run services describe story-menu-app --region=us-central1
   ```
2. Increase `--min-instances` for consistent performance
3. Enable Cloud CDN for static assets

## Recovery Procedures

### Database Recovery
```bash
# Restore from backup
gcloud sql backups restore BACKUP_ID --instance=story-menu-db

# Verify restore
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users"
```

### Firestore Recovery
```bash
# Import from GCS
gcloud firestore import gs://story-menu-backups/firestore/2026-07-25/
```

### Rollback Deployment
```bash
# List revisions
gcloud run revisions list --service=story-menu-app

# Rollback to previous revision
gcloud run services update-traffic story-menu-app \
    --to-revisions=REVISION_NAME=100
```

## Getting Help

1. Check this guide
2. Search error message in codebase
3. Check Cloud Logging for context
4. Review GitHub Issues
5. Contact the team
