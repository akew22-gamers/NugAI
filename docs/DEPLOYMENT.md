# NugAI Deployment Guide

## Production Deployment to Vercel

This guide covers the complete deployment process for NugAI to Vercel.

---

## Prerequisites

- ✅ GitHub account with repository set up
- ✅ Vercel account (free or pro)
- ✅ Vercel Postgres database provisioned
- ✅ Vercel Blob storage enabled
- ✅ Domain name (optional, for production URL)

---

## Step 1: GitHub Repository Setup

### 1.1 Initialize Git (if not already)
```bash
git init
git add .
git commit -m "Initial commit: NugAI v1.0 production ready"
```

### 1.2 Create GitHub Repository
```bash
# Visit: https://github.com/new
# Repository name: NugAI (or your preferred name)
# Visibility: Private (recommended) or Public
# DO NOT initialize with README (we already have one)
```

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/your-username/NugAI.git
git branch -M main
git push -u origin main
```

---

## Step 2: Vercel Project Setup

### 2.1 Create Vercel Project

1. **Visit Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New"** > **"Project"**
3. **Import Git Repository**:
   - Select your GitHub account
   - Search for "NugAI" repository
   - Click **"Import"**

### 2.2 Configure Project Settings

**Project Configuration:**
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)

**Install Command**: `npm install` (auto-detected)

---

## Step 3: Environment Variables Configuration

### 3.1 Required Environment Variables

Add these in **Vercel Dashboard > Project Settings > Environment Variables**:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | From Vercel Postgres | All |
| `NEXTAUTH_SECRET` | Generate (see below) | All |
| `NEXTAUTH_URL` | Your production URL | All |
| `CRON_SECRET` | Generate (see below) | All |
| `API_KEY_ENCRYPTION_KEY` | Generate (see below) | All |
| `VERCEL_BLOB_READ_WRITE_TOKEN` | From Vercel Blob | All |
| `ADMIN_USERNAME` | Admin username | All |
| `ADMIN_PASSWORD` | Temp password | All |
| `SENTRY_DSN` | Optional (Sentry) | Production |

### 3.2 Generate Secrets

**NEXTAUTH_SECRET** (min 32 chars):
```bash
openssl rand -base64 32
# Example output: "xYz123AbC456DeF789GhI012JkL345MnO678PqR901StU="
```

**CRON_SECRET** (64 hex chars):
```bash
openssl rand -hex 32
# Example output: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
```

**API_KEY_ENCRYPTION_KEY** (64 hex chars):
```bash
openssl rand -hex 32
# Example output: "036dc0f622028371a6353fb071c44df1c9ab8635753485c064db15ffe35912db"
```

### 3.3 Add Variables to Vercel

**Dashboard > Settings > Environment Variables > Add New:**

```
Name: DATABASE_URL
Value: postgres://user:password@host:port/database
Environment: Production, Preview, Development
→ Click Save
```

Repeat for all required variables.

---

## Step 4: Vercel Storage Setup

### 4.1 Vercel Postgres

1. **Visit**: https://vercel.com/dashboard/postgres
2. **Click "Create Database"**
3. **Configure**:
   - Name: `nugai-db`
   - Region: `Singapore (sin1)` (or closest to users)
4. **Copy Connection String**:
   - Click database > **Connect** > **App**
   - Copy `POSTGRES_PRISMA_URL` or `DATABASE_URL`
5. **Paste to Project Environment Variables** (Step 3)

### 4.2 Vercel Blob

1. **Visit**: https://vercel.com/docs/storage/vercel-blob/quickstart
2. **Enable Blob Storage**:
   - Dashboard > Storage > **Browse Storage**
   - Click **Blob** > **Connect**
   - Select your project
3. **Copy Token**:
   - Copy `BLOB_READ_WRITE_TOKEN`
4. **Paste to Project Environment Variables**:
   - Use variable name: `VERCEL_BLOB_READ_WRITE_TOKEN`

---

## Step 5: First Deployment

### 5.1 Trigger Deployment

**Option A: Deploy from GitHub**
```bash
# Already connected via Vercel Dashboard
# Deployment triggers automatically on git push
```

**Option B: Deploy via Vercel CLI** (for testing)
```bash
npm i -g vercel
vercel login
vercel --prod
```

### 5.2 Monitor Deployment

1. **Vercel Dashboard** > Your Project
2. **View deployment status** (should show "Building" → "Ready")
3. **Check deployment logs** for errors

### 5.3 Access Deployment

- **Preview URL**: `https://your-repo-username.vercel.app`
- **Production URL**: Configure custom domain or use Vercel subdomain

---

## Step 6: Post-Deployment Verification

### 6.1 Database Migration

After first deployment, run database migration:

**Via Vercel Functions (temporary route):**

1. **Create temporary file** `app/api/admin/migrate/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { exec } from 'child_process'

export async function POST() {
  try {
    exec('npx prisma migrate deploy', (error, stdout, stderr) => {
      if (error) return NextResponse.json({ error: error.message })
      if (stderr) return NextResponse.json({ stderr })
      return NextResponse.json({ stdout })
    })
  } catch (error) {
    return NextResponse.json({ error: 'Migration failed' })
  }
}
```

2. **Call via curl**:
```bash
curl -X POST "https://your-domain.com/api/admin/migrate"
```

3. **Remove temporary file** after migration

**Or run locally with production DB:**
```bash
# Copy DATABASE_URL from Vercel to .env.local
DATABASE_URL="postgres://..."

# Run migration
npx prisma migrate deploy

# Remove DATABASE_URL from .env.local for security
```

### 6.2 Seed Initial Data

**Seed admin user and test data:**

Create seed script `prisma/seed-production.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 10)
  
  await prisma.user.upsert({
    where: { username: process.env.ADMIN_USERNAME || 'admin' },
    update: {},
    create: {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      subscription_tier: 'FREE',
    },
  })
  
  console.log('✅ Admin user created')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

**Run seed:**
```bash
npx prisma db seed
```

### 6.3 Verify Functionality

**Checklist:**

- [ ] Login page loads at `https://your-domain.com/login`
- [ ] Admin can login with credentials
- [ ] Dashboard accessible at `https://your-domain.com/admin`
- [ ] Provider AI page loads (no errors)
- [ ] Search API page loads (no errors)
- [ ] Users page shows no users (or test users)
- [ ] Analytics page loads
- [ ] No console errors in browser DevTools

---

## Step 7: AI & Search Provider Configuration

### 7.1 Configure AI Provider

1. **Login as Admin**: Navigate to admin dashboard
2. **Provider AI Menu**: `/admin/providers`
3. **Click "Tambah Provider"**
4. **Select Provider Type**:
   - DeepSeek (recommended for cost-effectiveness)
   - OpenAI
   - Groq
   - Together AI
   - Custom (any OpenAI-compatible endpoint)
5. **Enter API Key**: Get from provider dashboard
6. **Fetch Models**: Click button to load available models
7. **Select Default Model**: Choose from dropdown
8. **Save**: Click "Tambah"
9. **Activate**: Click "Aktifkan" on the provider card

### 7.2 Configure Search Providers

**Tavily:**
1. **Get API Key**: https://tavily.com/api
2. **Dashboard** > Search API > `/admin/search-providers`
3. **Tavily Card** > Enter API Key
4. **Check "Aktifkan segera"**
5. **Simpan**

**Exa (Optional):**
1. **Get API Key**: https://exa.ai/
2. **Exa Card** > Enter API Key
3. **Check "Aktifkan segera"**
4. **Simpan**

---

## Step 8: Custom Domain (Optional)

### 8.1 Add Domain in Vercel

1. **Dashboard** > Project > **Settings** > **Domains**
2. **Add Domain**: `your-domain.com`
3. **Verify**: Add DNS records

### 8.2 Configure DNS Records

**For apex domain (nugai.example.com):**
```
Type: CNAME
Name: @ or (leave blank)
Value: cname.vercel-dns.com
```

**For subdomain (app.nugai.com):**
```
Type: CNAME
Name: app (or your subdomain)
Value: cname.vercel-dns.com
```

### 8.3 Update Environment Variable

Change `NEXTAUTH_URL` to your domain:
```
NEXTAUTH_URL="https://your-domain.com"
```

---

## Step 9: Cron Jobs Configuration

### 9.1 Verify Cron Jobs

Cron jobs are already configured in `vercel.json`:

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

### 9.2 Verify in Vercel Dashboard

1. **Dashboard** > Project
2. **Cron Jobs** tab
3. Should show:
   - ✅ Data Purge (monthly)
   - ✅ Blob Cleanup (daily)
   - ✅ Quota Reset (daily)

### 9.3 Enable Cron Jobs

**Important:** Cron jobs are PRO feature on Vercel

**Options:**

**A. Upgrade to Vercel Pro** ($20/month)
- Includes unlimited cron jobs
- Enables all cron features

**B. Alternative (Free): Use GitHub Actions**
```yaml
# .github/workflows/cron-daily.yml
name: Daily Cron Jobs

on:
  schedule:
    - cron: '0 0 * * *' # midnight UTC
  workflow_dispatch:

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cron endpoint
        run: |
          curl -X POST "https://your-domain.com/api/cron/reset-quotas" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**C. Alternative (Free): Use Cron-job.org**
- Free external cron service
- Configure HTTP requests to your endpoints
- `https://cron-job.org/`

---

## Step 10: Testing Production

### 10.1 Test Complete User Flow

**Student User Test:**

1. [ ] Register/login
2. [ ] Complete onboarding
3. [ ] Add course
4. [ ] Generate task (DISCUSSION)
5. [ ] Check quota decremented
6. [ ] Download PDF
7. [ ] Test OCR upload
8. [ ] Regenerate answer
9. [ ] Check password change

**Admin User Test:**

1. [ ] Login as admin
2. [ ] View dashboard stats
3. [ ] Configure AI provider
4. [ ] Configure search provider
5. [ ] Add new user
6. [ ] Change user subscription
7. [ ] View analytics
8. [ ] Check system health

### 10.2 Test Cron Jobs Manually

```bash
# Test data purge
curl -X POST "https://your-domain.com/api/cron/purge-data" \
  -H "Authorization: Bearer $CRON_SECRET"

# Test blob cleanup
curl -X POST "https://your-domain.com/api/cron/cleanup-temp-blobs" \
  -H "Authorization: Bearer $CRON_SECRET"

# Test quota reset
curl -X POST "https://your-domain.com/api/cron/reset-quotas" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "message": "Quota reset completed",
  "usersReset": 1
}
```

---

## Step 11: Monitoring & Maintenance

### 11.1 Enable Monitoring

**Option 1: Sentry (Recommended)**
```bash
# Create Sentry account: https://sentry.io/
# Create new project > Next.js
# Copy DSN
```

Add to environment:
```
SENTRY_DSN="https://your-dsn@o0.ingest.sentry.io/0"
```

**Option 2: Vercel Analytics**
- Dashboard > Project > **Analytics** > **Enable**
- Free for basic usage

### 11.2 Set Up Alerts

**Sentry Alerts:**
- Configure in Sentry > Project > **Alerts**
- Email notifications for errors
- Slack integration available

**Vercel Alerts:**
- Dashboard > **Notifications**
- Deployment notifications
- Function errors

### 11.3 Regular Maintenance

**Weekly:**
- [ ] Check Sentry for errors
- [ ] Review analytics dashboard
- [ ] Check cron job execution logs

**Monthly:**
- [ ] Review database size
- [ ] Check blob storage usage
- [ ] Verify data purge logs
- [ ] Update dependencies

**Quarterly:**
- [ ] Rotate API keys
- [ ] Update Next.js version
- [ ] Review security measures

---

## Troubleshooting

### Deployment Fails

**Build Error:**
```bash
# Check build logs in Vercel dashboard
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Prisma schema issues
```

**Fix:**
1. Fix errors locally
2. Commit and push
3. Vercel will auto-redeploy

### Database Migration Fails

**Error: "Can't reach database server"**

**Fix:**
1. Verify `DATABASE_URL` is correct
2. Check Vercel Postgres is active
3. Ensure region matches (Singapore)

**Error: "Migration already exists"**

**Fix:**
```bash
# Skip specific migration
npx prisma migrate resolve --applied "migration_name"

# Or reset database (CAUTION: deletes all data!)
npx prisma migrate reset
```

### Blob Upload Fails

**Error: "Token expired"**

**Fix:**
1. Regenerate blob token in Vercel dashboard
2. Update `VERCEL_BLOB_READ_WRITE_TOKEN`
3. Redeploy

### Cron Jobs Not Running

**Check:**
1. Vercel Pro subscription active
2. `CRON_SECRET` is set correctly
3. Cron schedule syntax is valid
4. Check Vercel > Cron Jobs tab for status

---

## Security Best Practices

### Production Checklist

- [ ] Change default admin password immediately
- [ ] Use strong, unique secrets for all variables
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Set up monitoring (Sentry, Vercel Analytics)
- [ ] Configure CORS for API routes
- [ ] Enable DDoS protection (Vercel built-in)
- [ ] Regular dependency updates
- [ ] Monitor database access patterns

### Environment Variables Security

**DO:**
- Use Vercel environment variables (encrypted at rest)
- Use different secrets for staging/production
- Rotate secrets periodically
- Use `.env.local` with `.gitignore`

**DON'T:**
- Commit `.env.local` to Git
- Share secrets via chat/email
- Use weak or default passwords
- Expose secrets in client-side code

---

## Support

**Contact**:
- Email: support@eas.biz.id
- Website: eas.biz.id

**Resources**:
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Sentry Docs: https://docs.sentry.io/