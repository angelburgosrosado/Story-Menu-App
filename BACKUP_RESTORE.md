# Automated Backup & Restore — Task 5.7

## Architecture

```
Cloud SQL (PostgreSQL)
    │
    ├── Daily automated backup (7-day retention)
    ├── Point-in-time recovery (WAL archiving)
    └── Weekly export to GCS (90-day retention)

Firestore
    │
    ├── Daily export to GCS (native export)
    └── On-demand export via gcloud

GCS (Backup Bucket)
    │
    ├── Cross-region replication (us + eu)
    └── Lifecycle: 90 days standard, then archive
```

## Setup

### 1. Cloud SQL Automated Backups

```bash
# Enable automated backups (already default for new instances)
gcloud sql instances patch story-menu-db \
    --backup-start-time=03:00 \
    --retained-backups=7 \
    --enable-point-in-time-recovery \
    --region=us-central1
```

### 2. GCS Backup Bucket

```bash
# Create bucket with lifecycle rules
gsutil mb -l us-central1 gs://story-menu-backups/
gsutil lifecycle set backup-lifecycle.json gs://story-menu-backups/

# backup-lifecycle.json:
# {
#   "rule": [
#     {"action": {"type": "SetStorageClass", "storageClass": "NEARLINE"}, "condition": {"age": 30}},
#     {"action": {"type": "SetStorageClass", "storageClass": "COLDLINE"}, "condition": {"age": 60}},
#     {"action": {"type": "Delete"}, "condition": {"age": 90}}
#   ]
# }
```

### 3. Automated Firestore Export

```bash
# Create Cloud Scheduler job for daily Firestore export
gcloud scheduler jobs create firestore-export \
    --schedule="0 4 * * *" \
    --time-zone="America/New_York" \
    --uri="https://firestore.googleapis.com/v1/projects/PROJECT_ID/databases/(default):exportDocuments" \
    --message-body='{"outputUriPrefix": "gs://story-menu-backups/firestore/$(date +%Y-%m-%d)"}' \
    --oidc-service-account-email=backup-sa@PROJECT_ID.iam.gserviceaccount.com
```

### 4. Verify Backups

```bash
# List Cloud SQL backups
gcloud sql backups list --instance=story-menu-db

# List Firestore exports
gsutil ls gs://story-menu-backups/firestore/

# Test restore (dry run)
gcloud sql backups restore BACKUP_ID --instance=story-menu-db
```

## Restore Procedure

### Cloud SQL Restore
```bash
# List available backups
gcloud sql backups list --instance=story-menu-db --limit=10

# Restore to a specific backup
gcloud sql backups restore BACKUP_ID --instance=story-menu-db

# Or restore to a new instance (safest)
gcloud sql instances create story-menu-db-restore \
    --source-backup-id=BACKUP_ID \
    --region=us-central1
```

### Firestore Restore
```bash
# Import from GCS
gcloud firestore import gs://story-menu-backups/firestore/2026-07-25/ \
    --collection-group=users
```

## Monitoring

```bash
# Check backup status
gcloud sql operations list --instance=story-menu-db --limit=5

# Alert on failed backups
gcloud alpha monitoring policies create \
    --notification-channels=CHANNEL_ID \
    --condition-display-name="Backup Failed" \
    --condition-filter="resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/backup_run_count\""
```

## Restore Test Schedule

| Test | Frequency | Duration | Notes |
|------|-----------|----------|-------|
| Cloud SQL backup restore | Monthly | ~15 min | Restore to test instance |
| Firestore export/import | Monthly | ~30 min | Full collection restore |
| Full DR simulation | Quarterly | ~2 hours | Complete environment restore |
