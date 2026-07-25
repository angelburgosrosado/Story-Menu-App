# Multi-Region Deployment — Task 3.7

## Architecture

```
                    ┌─────────────┐
                    │ Cloud CDN   │
                    │ (static)    │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    ┌───────▼──────┐ ┌────▼───────┐ ┌────▼───────┐
    │ Cloud Run    │ │ Cloud Run  │ │ Cloud Run  │
    │ us-central1  │ │ eu-west1   │ │ asia-east1 │
    └───────┬──────┘ └────┬───────┘ └────┬───────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                    ┌──────▼──────┐
                    │ Firestore   │
                    │ (multi-reg) │
                    └─────────────┘
```

## Setup

### 1. Deploy to Multiple Regions

```bash
REGIONS="us-central1 eu-west1 asia-east1"

for region in $REGIONS; do
    echo "Deploying to $region..."
    gcloud run services update story-menu-app \
        --region=$region \
        --image=gcr.io/PROJECT_ID/story-menu-app:latest \
        --memory=512Mi \
        --cpu=1 \
        --min-instances=0 \
        --max-instances=10 \
        --concurrency=80 \
        --timeout=300
done
```

### 2. Configure Cloud CDN

```bash
# Create backend service
gcloud compute backend-services create story-menu-backend \
    --global \
    --protocol=HTTPS \
    --port-name=https \
    --health-checks=story-menu-health \
    --enable-cdn

# Add each region as a backend
for region in us-central1 eu-west1 asia-east1; do
    gcloud compute backend-services add-backend story-menu-backend \
        --global \
        --instance-group=story-menu-ig-$region \
        --instance-group-region=$region \
        --balancing-mode=UTILIZATION \
        --max-utilization=0.8
done

# Create URL map
gcloud compute url-maps create story-menu-map \
    --default-service=story-menu-backend

# Create HTTPS proxy
gcloud compute target-https-proxies create story-menu-proxy \
    --url-map=story-menu-map \
    --ssl-certificates=story-menu-cert

# Reserve static IP
gcloud compute addresses create story-menu-ip --global

# Forward traffic
gcloud compute forwarding-rules create story-menu-https \
    --global \
    --target-https-proxy=story-menu-proxy \
    --ports=443
```

### 3. Configure Cloud Run Routing

Cloud Run automatically routes to the nearest region. No additional config needed.

### 4. Firestore Multi-Region

Firestore is already multi-region by default when using regional instances. For global access:

```bash
# Verify Firestore location
gcloud firestore databases describe --format='value(locationId)'

# For true multi-region, use:
# nam5 (us-central) or eur1 (europe) for automatic replication
```

### 5. Verify

```bash
# Test latency from different regions
for region in us-central1 europe-west1 asia-east1; do
    echo "Testing from $region..."
    gcloud run services describe story-menu-app \
        --region=$region \
        --format='value(status.url)'
done
```

## Failover

Cloud Run handles failover automatically:
- If one region goes down, traffic routes to the next nearest healthy region
- `--min-instances=1` keeps at least one instance warm per region
- `--max-instances=10` scales under load

## Cost Considerations

| Component | Cost Impact |
|---|---|
| Cloud Run (3 regions) | ~$50-150/mo at low traffic |
| Cloud CDN | ~$0.02-0.08/GB transferred |
| Firestore (multi-region) | Same as single region |
| Static IP | ~$1/mo |

**Recommendation:** Start with `us-central1` + `eu-west1`. Add `asia-east1` only when you have users in that region.

## Monitoring

```bash
# Check each region's health
gcloud run services describe story-menu-app --region=us-central1 --format='value(status.conditions)'
gcloud run services describe story-menu-app --region=eu-west1 --format='value(status.conditions)'
```
