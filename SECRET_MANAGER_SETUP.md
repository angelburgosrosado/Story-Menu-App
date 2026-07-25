# Secret Manager Setup — Task 5.4

## Why Secret Manager?
Environment variables in Cloud Run are visible to anyone with IAM access to the service. Google Cloud Secret Manager provides:
- **Encryption at rest** — secrets encrypted with Google-managed keys
- **Access control** — IAM-based, per-secret permissions
- **Audit logging** — who accessed what, when
- **Rotation** — version secrets without redeployment

## Required Secrets

| Secret Name | Purpose | Current Source |
|---|---|---|
| `database-url` | PostgreSQL connection string | `DATABASE_URL` env var |
| `gemini-api-key` | Google Gemini API key | `GEMINI_API_KEY` env var |
| `stripe-secret-key` | Stripe API secret | `STRIPE_SECRET_KEY` env var |
| `stripe-webhook-secret` | Stripe webhook signature | `STRIPE_WEBHOOK_SECRET` env var |
| `firebase-service-account` | Firebase Admin SDK credentials | `FIREBASE_SERVICE_ACCOUNT_KEY` env var |
| `smtp-password` | Email service password | `SMTP_PASSWORD` env var |

## Setup Steps

### 1. Create Secrets
```bash
# For each secret:
echo -n "your-secret-value" | gcloud secrets create database-url --data-file=-
echo -n "your-secret-value" | gcloud secrets create gemini-api-key --data-file=-
echo -n "your-secret-value" | gcloud secrets create stripe-secret-key --data-file=-
echo -n "your-secret-value" | gcloud secrets create stripe-webhook-secret --data-file=-
echo -n "your-service-account-json" | gcloud secrets create firebase-service-account --data-file=-
echo -n "your-smtp-password" | gcloud secrets create smtp-password --data-file=-
```

### 2. Grant Access to Cloud Run Service Account
```bash
SA_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"

for secret in database-url gemini-api-key stripe-secret-key stripe-webhook-secret firebase-service-account smtp-password; do
    gcloud secrets add-iam-policy-binding $secret \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/secretmanager.secretAccessor"
done
```

### 3. Mount Secrets in Cloud Run
```bash
gcloud run services update story-menu-app \
    --update-secrets="DATABASE_URL=database-url:latest" \
    --update-secrets="GEMINI_API_KEY=gemini-api-key:latest" \
    --update-secrets="STRIPE_SECRET_KEY=stripe-secret-key:latest" \
    --update-secrets="STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest" \
    --update-secrets="FIREBASE_SERVICE_ACCOUNT_KEY=firebase-service-account:latest" \
    --update-secrets="SMTP_PASSWORD=smtp-password:latest" \
    --region us-central1
```

### 4. Rotate a Secret (no redeployment needed)
```bash
# Add new version
echo -n "new-secret-value" | gcloud secrets versions add database-url --data-file=-

# Cloud Run automatically picks up the latest version
```

### 5. Verify
```bash
# Check secret access
gcloud secrets versions access latest --secret=database-url

# Verify Cloud Run can read it
gcloud run services describe story-menu-app --region us-central1 --format='value(spec.template.spec.containers[0].env)'
```

## Local Development
For local dev, keep using `.env` file (gitignored). Only use Secret Manager in production.
