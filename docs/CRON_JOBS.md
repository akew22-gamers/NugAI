# Cron Jobs Configuration

## Overview

NugAI uses Vercel Cron Jobs to automate recurring maintenance tasks. All cron jobs are secured with bearer token authentication.

## Cron Jobs Schedule

| Job | Schedule | Timezone | Description |
|-----|----------|----------|-------------|
| **Data Purge** | `0 0 1 * *` | UTC | Monthly (1st day) - Delete old task sessions |
| **Blob Cleanup** | `0 3 * * *` | UTC | Daily (3 AM) - Delete temp uploads older than 24h |
| **Quota Reset** | `0 0 * * *` | UTC | Daily (midnight) - Reset daily usage quota |

## Authentication

All cron jobs require authentication via header:

```bash
curl -X POST "https://your-domain.com/api/cron/purge-data" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Or via Vercel's special header:

```bash
curl -X POST "https://your-domain.com/api/cron/purge-data" \
  -H "x-vercel-protection-bypass: $CRON_SECRET"
```

## Job Details

### 1. Data Purge (`/api/cron/purge-data`)

**Retention Policy:**
- Task sessions older than 12 months are automatically deleted
- Applies to task sessions and their associated task items
- User data (accounts, profiles, courses) are NEVER auto-purged

**Audit Trail:**
- Every purge operation is logged in `DataPurgeLog` table
- Includes: user_id, username_snapshot, sessions_purged, items_purged, reason

**User Notification:**
- Users should be warned 30 days before their data is purged
- Banner message in dashboard: "Your old task data will be deleted in X days"

**Run Command:**
```bash
crontab -e
# 0 0 1 * * curl -X POST "https://your-domain.com/api/cron/purge-data" -H "Authorization: Bearer $CRON_SECRET"
```

### 2. Blob Cleanup (`/api/cron/cleanup-temp-blobs`)

**Cleanup Policy:**
- Deletes temporary uploads in `temp-uploads/` prefix older than 24 hours
- Temporary uploads include: OCR images, draft uploads
- Permanent uploads (logos, fonts) are NOT affected

**Blob Prefix:**
- Only deletes blobs with prefix: `temp-uploads/`

**Run Command:**
```bash
# Daily at 3 AM
curl -X POST "https://your-domain.com/api/cron/cleanup-temp-blobs" -H "Authorization: Bearer $CRON_SECRET"
```

### 3. Quota Reset (`/api/cron/reset-quotas`)

**Reset Policy:**
- Resets `daily_usage_count` to 0 for all student users
- Runs daily at midnight UTC
- Users start fresh with their daily quota (FREE: 5 tasks/day, PREMIUM: unlimited)

**Schedule Consideration:**
- UTC midnight = 7 AM WIB (Western Indonesia Time)
- For midnight WIB, adjust schedule to `0 17 * * *`

**Run Command:**
```bash
# Daily at midnight UTC
curl -X POST "https://your-domain.com/api/cron/reset-quotas" -H "Authorization: Bearer $CRON_SECRET"
```

## Environment Variables

Add to `.env.local` and Vercel dashboard:

```bash
CRON_SECRET="your-secret-key-min-32-chars"
```

Generate with:
```bash
openssl rand -hex 32
```

## Vercel Configuration

Cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/purge-data",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/cron/cleanup-temp-blobs",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/reset-quotas",
      "schedule": "0 0 * * *"
    }
  ]
}
```

After deployment, verify in Vercel Dashboard > Cron Jobs tab.

## Testing Locally

Test cron jobs manually with curl:

```bash
# Generate secret
export CRON_SECRET=$(openssl rand -hex 32)

# Test data purge
curl -X POST "http://localhost:3000/api/cron/purge-data" \
  -H "Authorization: Bearer $CRON_SECRET"

# Expected response
{
  "success": true,
  "message": "Data purge completed",
  "sessionsPurged": 0,
  "itemsPurged": 0
}
```

## Monitoring

Check cron job status:

1. **Vercel Dashboard** > Cron Jobs tab
2. **Application Logs** > Filter by "[Cron]" prefix
3. **Database** > Check `data_purge_logs` table for audit trail

## Troubleshooting

### Job Not Running

- Verify `vercel.json` is committed and deployed
- Check Vercel Cron Jobs tab for job status
- Verify environment variable `CRON_SECRET` is set

### Authentication Fails

- Ensure `CRON_SECRET` matches between environment and curl command
- Check for whitespace in secret (copy-paste issues)

### Blob Cleanup Not Deleting

- Verify `VERCEL_BLOB_READ_WRITE_TOKEN` is set
- Check blob prefix is `temp-uploads/`
- Review logs for blob permission errors

## Security Notes

- Never expose `CRON_SECRET` in client-side code
- Rotate `CRON_SECRET` periodically
- Use different secrets for staging/production
- Monitor logs for unauthorized access attempts