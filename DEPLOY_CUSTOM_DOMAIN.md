# Custom Domain Setup — Story.Menu (Task 3.4)

## Prerequisites
- DNS access for `story.menu`
- Google Cloud CLI authenticated
- Cloud Run service deployed in `us-central1`

## Steps

### 1. Map Custom Domain
```bash
gcloud run domain-mappings create \
  --service story-menu-app \
  --domain story.menu \
  --region us-central1
```

### 2. Get DNS Records
```bash
gcloud run domain-mappings describe \
  --domain story.menu \
  --region us-central1
```

### 3. Add DNS Records
Add these to your DNS provider (Cloudflare, Route53, etc.):

| Type | Name | Value |
|------|------|-------|
| A | @ | 216.239.32.21 |
| A | @ | 216.239.34.21 |
| A | @ | 216.239.36.21 |
| A | @ | 216.239.38.21 |
| AAAA | @ | 2001:4860:4802:32::36 |
| AAAA | @ | 2001:4860:4802:34::36 |
| AAAA | @ | 2001:4860:4802:36::36 |
| AAAA | @ | 2001:4860:4802:38::36 |
| CNAME | www | story.menu |

### 4. Verify & Wait
- SSL certificate provisioning: 15-60 minutes
- DNS propagation: up to 48 hours
- Verify: `dig story.menu` should show Cloud Run IPs

### 5. Update App URLs
After domain is live:
1. Update `canonical` URL in `index.html` to `https://story.menu`
2. Update all OpenGraph `og:url` tags
3. Update all `hreflang` links
4. Deploy the updated frontend

### 6. Verify HTTPS
```bash
curl -I https://story.menu
# Should return 200 with HSTS header
```

## Troubleshooting
- **SSL not provisioning:** Check that DNS records point to Google-managed IPs
- **502 errors:** Service may not be deployed yet — verify with `gcloud run services list`
- **Mixed content:** Ensure all asset URLs use `https://`
