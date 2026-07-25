# CDN Configuration — Task 7.9

## Cloud CDN Setup

### 1. Backend Bucket

```bash
# Create a bucket for static assets
gsutil mb -l us-central1 gs://story-menu-assets/

# Upload build artifacts
gsutil -m cp -r dist/assets/* gs://story-menu-assets/

# Set public read
gsutil iam ch allUsers:objectViewer gs://story-menu-assets/
```

### 2. Backend Service

```bash
# Create backend bucket for CDN
gcloud compute backend-buckets create story-menu-assets \
    --gcs-bucket-name=story-menu-assets \
    --enable-cdn \
    --cache-mode=CACHE_ALL_STATIC \
    --default-ttl=3600 \
    --max-ttl=86400
```

### 3. URL Map (Route Static Assets to CDN)

```bash
# Create URL map that routes /assets/* to CDN
gcloud compute url-maps create story-menu-cdn-map \
    --default-service=story-menu-backend

# Add path matcher for static assets
gcloud compute url-maps add-path-matcher story-menu-cdn-map \
    --path-matcher-name=assets \
    --default-service=story-menu-backend \
    --path-rules="/assets/*=story-menu-assets"
```

### 4. Cache Invalidation

```bash
# Invalidate CDN cache after deploy
gcloud compute url-maps invalidate-cdn-cache story-menu-cdn-map \
    --path "/assets/*" \
    --async
```

## Vercel/Netlify CDN (Alternative)

If deploying to Vercel or Netlify, CDN is automatic:

### Vercel
```json
// vercel.json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    }
  ]
}
```

### Netlify
```toml
# netlify.toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

## Cache Strategy

| Asset Type | TTL | Strategy |
|---|---|---|
| JS/CSS bundles | 1 year | Immutable (hash in filename) |
| Images | 30 days | Cache-Control: public |
| HTML | 0 | must-revalidate (always check) |
| API responses | 60s | Network-first with cache fallback |
| Fonts | 1 year | Immutable |

## Verification

```bash
# Check if CDN is serving assets
curl -I https://story.menu/assets/index.js
# Should include: x-cache: HIT, x-cdn: Google

# Check cache headers
curl -sI https://story.menu/ | grep -i cache-control
# Should: Cache-Control: public, max-age=0, must-revalidate
```
