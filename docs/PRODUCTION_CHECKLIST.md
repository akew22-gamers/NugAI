# Production Checklist - NugAI

Use this checklist before and after deploying to production.

---

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint passes without errors
- [ ] Build succeeds locally (`npm run build`)
- [ ] No console.log() statements in production code
- [ ] All TODO/FIXME comments addressed

### 2. Environment Configuration
- [ ] `.env.example` updated with all variables
- [ ] Secrets generated (see scripts below)
- [ ] Admin credentials set
- [ ] Production URLs configured

### 3. Database
- [ ] Prisma schema finalized
- [ ] Migration files committed
- [ ] Database connection string ready
- [ ] Backup strategy in place

### 4. Storage
- [ ] Vercel Blob enabled
- [ ] Blob token generated
- [ ] Upload limits configured
- [ ] Cleanup cron job scheduled

### 5. Security
- [ ] Password hashing implemented (bcrypt)
- [ ] Rate limiting configured
- [ ] CORS settings correct
- [ ] Authentication middleware active
- [ ] All API routes protected

### 6. AI/Provider Configuration
- [ ] AI provider API key obtained
- [ ] Search provider keys obtained
- [ ] Provider dashboard ready (admin UI)
- [ ] Model selection tested

---

## Environment Variables Checklist

**Required (Must Have):**
```bash
✓ DATABASE_URL
✓ NEXTAUTH_SECRET
✓ NEXTAUTH_URL
✓ CRON_SECRET
✓ API_KEY_ENCRYPTION_KEY
✓ VERCEL_BLOB_READ_WRITE_TOKEN
✓ ADMIN_USERNAME
✓ ADMIN_PASSWORD
```

**Optional (Recommended):**
```bash
○ SENTRY_DSN
○ DEEPSEEK_API_KEY (if not using admin dashboard)
○ TAVILY_API_KEY (if not using admin dashboard)
○ EXA_API_KEY (if not using admin dashboard)
```

---

## Secret Generation Scripts

Run these commands to generate secure secrets:

### NEXTAUTH_SECRET (min 32 characters)
```bash
openssl rand -base64 32
# Output example: "xYz123AbC456DeF789GhI012JkL345MnO678PqR901StU="
# Minimum: 32 characters
# Recommended: 64 characters
```

### CRON_SECRET (64 hex characters)
```bash
openssl rand -hex 32
# Output example: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
# Exact: 64 characters (32 bytes hex)
```

### API_KEY_ENCRYPTION_KEY (64 hex characters)
```bash
openssl rand -hex 32
# Output example: "036dc0f622028371a6353fb071c44df1c9ab8635753485c064db15ffe35912db"
# Exact: 64 characters (32 bytes hex)
# IMPORTANT: Never change this after providers are configured!
```

### Admin Password (temporary)
```bash
# Must be at least 8 characters
# Should include uppercase, lowercase, numbers
# Change immediately after first login
```

---

## Deployment Checklist

### GitHub Setup
- [ ] Repository created
- [ ] `.gitignore` includes `.env.local`
- [ ] `README.md` present
- [ ] LICENSE file (if applicable)
- [ ] Main branch set to `main`
- [ ] Protected branches enabled (recommended)

### Vercel Setup
- [ ] Project created
- [ ] GitHub repo connected
- [ ] Build settings correct
- [ ] All environment variables added
- [ ] Vercel Postgres connected
- [ ] Vercel Blob connected

### Database Setup
- [ ] Database migrated (`npx prisma migrate deploy`)
- [ ] Seed data populated
- [ ] Admin user exists
- [ ] Connection tested

### AI/Provider Setup
- [ ] AI provider configured via admin dashboard
- [ ] Models fetched successfully
- [ ] Default model selected
- [ ] Search provider(s) configured

---

## Post-Deployment Checklist

### Core Functionality Tests

**Landing/Auth:**
- [ ] Login page loads correctly
- [ ] Registration works (if enabled)
- [ ] Password hashing verified
- [ ] Session management works
- [ ] Logout redirects properly

**Student Dashboard:**
- [ ] Dashboard loads at `/dashboard`
- [ ] Quota display correct
- [ ] Recent tasks shown
- [ ] Navigation links work
- [ ] User profile displays

**Course Management:**
- [ ] Course list page loads
- [ ] Add course form works
- [ ] Edit course works
- [ ] Delete course works
- [ ] Course data persists

**Generator Tugas:**
- [ ] `/task/new` page loads
- [ ] Step 1: Form validation works
- [ ] Step 2: Processing shows correctly
- [ ] Step 3: Result displays properly
- [ ] PDF download works
- [ ] PDF formatting correct
- [ ] OCR upload works
- [ ] Regenerate works (max 5)

**Settings:**
- [ ] Profile page loads
- [ ] Name/NIM editable
- [ ] University logo upload works
- [ ] Password change works
- [ ] Font upload works (optional)

**Admin Dashboard:**
- [ ] Admin login works
- [ ] Dashboard loads at `/admin`
- [ ] Stats display correctly
- [ ] Quick action links work
- [ ] System health checks pass

**Admin Users:**
- [ ] Users page loads
- [ ] Add user form works
- [ ] Edit user works
- [ ] Delete user works
- [ ] Subscription change works
- [ ] Password reset works
- [ ] Admin users filtered out

**Admin Providers:**
- [ ] AI Provider page loads
- [ ] Add provider works
- [ ] Fetch models works
- [ ] Model selection works
- [ ] Activate provider works
- [ ] Edit/delete provider works

**Admin Search API:**
- [ ] Search API page loads
- [ ] Tavily config works
- [ ] Exa config works
- [ ] Toggle active works

**Admin Analytics:**
- [ ] Analytics page loads
- [ ] User stats correct
- [ ] Cost tracking works
- [ ] Usage charts display
- [ ] Top users list works

**PDF Generation:**
- [ ] PDF generates without errors
- [ ] PDF download triggers
- [ ] Cover page formatted correctly
- [ ] Content pagination works
- [ ] Fonts loaded correctly
- [ ] References included

**Cron Jobs:**
- [ ] Cron jobs appear in Vercel dashboard
- [ ] Manual trigger works (test with curl)
- [ ] Data purge logs created
- [ ] Blob cleanup runs
- [ ] Quota reset works

---

## Monitoring Setup

### Error Tracking
- [ ] Sentry project created
- [ ] Sentry SDK installed
- [ ] DSN added to environment
- [ ] Alerts configured
- [ ] Test error triggered and logged

### Analytics
- [ ] Vercel Analytics enabled
- [ ] Traffic tracking active
- [ ] Custom events set up (optional)

### Logging
- [ ] Application logs accessible
- [ ] Error logs monitored
- [ ] Performance logs reviewed

---

## Security Verification

### Authentication
- [ ] Rate limiting active (5 attempts/15 min)
- [ ] Account lockout works after failures
- [ ] Sessions expire correctly
- [ ] JWT signing verified

### Authorization
- [ ] Student can't access admin routes
- [ ] Admin can't access other admin's data
- [ ] Users can only see their own data
- [ ] API routes validate ownership

### Data Protection
- [ ] Passwords hashed (bcrypt)
- [ ] API keys encrypted (AES-256-GCM)
- [ ] Input validation active
- [ ] XSS protection enabled
- [ ] CSRF tokens verified

### Infrastructure
- [ ] HTTPS enforced (Vercel automatic)
- [ ] Security headers configured
- [ ] DDoS protection active (Vercel)
- [ ] CORS configured correctly

---

## Performance Checks

### Load Time
- [ ] First contentful paint < 2s
- [ ] Time to interactive < 3.5s
- [ ] Largest contentful paint < 2.5s
- [ ] Cumulative layout shift < 0.1

### API Performance
- [ ] Average response time < 500ms
- [ ] Database queries optimized
- [ ] N+1 queries avoided
- [ ] Caching implemented where appropriate

### Resource Usage
- [ ] Bundle size optimized
- [ ] Images compressed
- [ ] Fonts optimized
- [ ] Unused code removed

---

## Backup & Recovery

### Database Backup
- [ ] Automated backup configured (Vercel)
- [ ] Backup frequency: Daily
- [ ] Restore procedure documented
- [ ] Test restore performed

### Blob Backup
- [ ] Uploads backed up (Vercel)
- [ ] Recovery process understood

### Disaster Recovery
- [ ] Rollback procedure documented
- [ ] Emergency contacts listed
- [ ] Incident response plan ready

---

## Documentation

### User Documentation
- [ ] README.md updated
- [ ] User guide created
- [ ] FAQ document ready

### Technical Documentation
- [ ] API documentation (API_ENDPOINTS.md)
- [ ] Database schema (DATABASE_SCHEMA.md)
- [ ] Deployment guide (DEPLOYMENT.md)
- [ ] Cron jobs guide (CRON_JOBS.md)

### Code Documentation
- [ ] Code comments where needed
- [ ] Function JSDoc present
- [ ] Complex logic explained

---

## Launch Readiness

### Final Checks
- [ ] All tests pass
- [ ] No critical bugs
- [ ] All required features implemented
- [ ] Stakeholders approved
- [ ] Support team trained

### Soft Launch
- [ ] Limited user group selected
- [ ] Feedback collection ready
- [ ] Issues tracked and prioritized
- [ ] Hotfix process established

### Full Launch
- [ ] Marketing materials ready
- [ ] Social media posts scheduled
- [ ] Email announcements sent
- [ ] Analytics dashboards monitored

---

## Post-Launch Monitoring

### Day 1
- [ ] Monitor error rates
- [ ] Check user registrations
- [ ] Review performance metrics
- [ ] Respond to feedback

### Week 1
- [ ] Analyze usage patterns
- [ ] Identify common issues
- [ ] Plan improvements
- [ ] Send status update

### Month 1
- [ ] Review growth metrics
- [ ] Assess infrastructure costs
- [ ] Plan feature roadmap
- [ ] Conduct retrospective

---

## Contact & Support

**Development Team:**
- Developer: EAS Creative Studio
- Email: support@eas.biz.id
- Website: eas.biz.id

**Emergency Contacts:**
- Primary: [your-contact@email.com]
- Secondary: [backup-contact@email.com]

**Escalation Path:**
1. Check Sentry for errors
2. Review application logs
3. Attempt hotfix
4. Rollback if critical
5. Notify affected users

---

## Sign-Off

**Pre-Deployment Approved By:**
- [ ] Lead Developer: _________________ Date: ______
- [ ] Project Manager: _________________ Date: ______

**Post-Deployment Verified By:**
- [ ] QA Engineer: _________________ Date: ______
- [ ] DevOps: _________________ Date: ______

---

**Status**: 
- [ ] Not Started
- [ ] In Progress
- [ ] Ready for Deployment
- [ ] Deployed
- [ ] Monitoring

**Deployment Date**: _________________

**Version**: v1.0.0