# Testing Guide - NugAI

Manual and automated testing procedures for NugAI.

---

## Testing Overview

This guide covers all testing scenarios for NugAI, from unit tests to end-to-end flows.

---

## Manual Testing

### 1. Authentication Flow

**Test Case: Student Login**
```
1. Navigate to /login
2. Enter valid student credentials
3. Verify:
   - Redirects to /dashboard
   - Username shown in sidebar
   - Quota displayed correctly
```

**Test Case: Admin Login**
```
1. Navigate to /login
2. Enter valid admin credentials
3. Verify:
   - Redirects to /admin
   - Admin menu items visible
   - Shield badge in sidebar
```

**Test Case: Failed Login**
```
1. Enter invalid credentials
2. Verify:
   - Error toast shown
   - Login button re-enabled
   - Account locks after 5 failed attempts (admin only)
```

### 2. Student Onboarding

**Test Case: Complete Onboarding**
```
1. Login as new student
2. Fill all onboarding fields:
   - Nama lengkap
   - NIM
   - Universitas, Fakultas, Prodi
   - UPBJJ (optional)
   - Upload logo
3. Verify:
   - Student profile created
   - Redirects to /dashboard
   - All data persisted
```

### 3. Course Management

**Test Case: Add Course**
```
1. Navigate to /courses
2. Click "Tambah Mata Kuliah"
3. Fill:
   - Nama MK
   - Judul Modul
   - Nama Tutor
4. Verify:
   - Course saved to DB
   - Appears in course list
   - Edit/Delete buttons work
```

**Test Case: Delete Course**
```
1. View course list
2. Click "Hapus" on a course
3. Confirm deletion
4. Verify:
   - Course removed from list
   - Cascade delete on related sessions
```

### 4. Generator Tugas

**Test Case: Generate Discussion Task**
```
1. Navigate to /task/new
2. Select "Tugas Diskusi"
3. Fill course data
4. Enter question text
5. Set word count target
6. Click "Generate Jawaban"

Wait for processing, verify:
- Step 2 shows AI thought process
- Step 3 displays answer
- Word count shown
- References included
- PDF download works
- Quota decremented
```

**Test Case: Generate Assignment Task**
```
Same as discussion, but select "Tugas Soal"
Verify:
- Multiple questions supported
- PDF has cover page
- Each answer on separate page
```

**Test Case: OCR Upload**
```
1. In question input, upload image
2. Wait for OCR processing
3. Verify:
   - Extracted text appended to input
   - Accuracy >90% for clear images
   - Error shown for unreadable images
```

**Test Case: Regenerate Answer**
```
1. After answer generated, click "Regenerate"
2. (Optional) Enter instructions
3. Click regenerate
4. Verify:
   - New answer generated
   - Regenerate count incremented
   - Button disabled after 5 regenerates
```

**Test Case: PDF Download**
```
1. View result page
2. Click "Download PDF"
3. Verify:
   - PDF file downloaded
   - Filename correct (Tugas-{course}-{nim}.pdf)
   - Cover page formatted
   - Answer pagination correct
   - Fonts loaded correctly
   - References included

Check PDF content:
   - Margins: 2.5cm all sides
   - Font: Liberation Sans (Arial-compatible)
   - Font size: 12pt
   - Line spacing: 1.15
```

### 5. User Settings

**Test Case: Update Profile**
```
1. Navigate to /settings
2. Change profile fields
3. Upload new logo
4. Click "Simpan"
5. Verify:
   - Updated at timestamp changed
   - New logo visible in sidebar avatar
```

**Test Case: Change Password**
```
1. Settings > Keamanan
2. Enter current password
3. Enter new password (min 8 chars)
4. Confirm new password
5. Verify:
   - Password changed
   - Must login again
   - Old password rejected
```

### 6. Admin Dashboard

**Test Case: View Analytics**
```
1. Login as admin
2. Navigate to /admin
3. Verify:
   - User count correct
   - Cost tracking shown
   - Tasks created today
   - System health green
```

**Test Case: User Management**
```
1. Navigate to /admin/users
2. Click "Tambah Pengguna"
3. Create student user with:
   - Username, password
   - Full name, NIM
   - University data
4. Verify:
   - User appears in list
   - Not in admin users (filtered)
   - Edit/Delete works
```

**Test Case: Configure AI Provider**
```
1. Navigate to /admin/providers
2. Click "Tambah Provider"
3. Select provider (e.g., DeepSeek)
4. Enter API key
5. Click "Fetch Model"
6. Select default model
7. Click "Tambah"
8. Verify:
   - Provider saved
   - Models populated
   - Model stored
9. Click "Aktifkan"
10. Verify:
    - Provider marked active
    - Task generation uses this provider
```

**Test Case: Configure Search API**
```
1. Navigate to /admin/search-providers
2. Enter Tavily API key
3. Check "Aktifkan segera"
4. Click "Simpan"
5. Verify:
   - Provider saved
   - Status "AKTIF"
   - Toggle active/inactive works

Repeat for Exa
```

### 7. Quota Management

**Test Case: Daily Quota**
```
1. Login as FREE student
2. Generate 5 tasks (quota limit)
3. On 6th attempt, verify:
   - "Quota habis" notification
   - Upgrade to PREMIUM prompt shown
```

**Test Case: Quota Reset**
```
1. Trigger cron job manually:
   curl -X POST "http://localhost:3000/api/cron/reset-quotas" \
     -H "Authorization: Bearer $CRON_SECRET"
2. Login as student
3. Verify:
   - Quota reset to 0
   - Can generate new tasks
```

---

## Automated Testing

### Unit Tests

**File: `tests/unit/auth.test.ts`**
```typescript
import { describe, it, expect } from '@jest/globals'
import bcrypt from 'bcryptjs'

describe('Authentication', () => {
  it('should hash password with bcrypt', async () => {
    const password = 'TestPassword123!'
    const hashed = await bcrypt.hash(password, 10)
    expect(hashed).toHaveLength(60)
  })

  it('should verify hashed password', async () => {
    const password = 'TestPassword123!'
    const hashed = await bcrypt.hash(password, 10)
    const isValid = await bcrypt.compare(password, hashed)
    expect(isValid).toBe(true)
  })
})
```

**File: `tests/unit/encryption.test.ts`**
```typescript
import { describe, it, expect } from '@jest/globals'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'

describe('API Key Encryption', () => {
  it('should encrypt and decrypt API key', () => {
    const key = 'sk-test-api-key-12345'
    const encrypted = encryptApiKey(key)
    expect(encrypted).toContain(':')
    
    const decrypted = decryptApiKey(encrypted)
    expect(decrypted).toBe(key)
  })
})
```

### Integration Tests

**File: `tests/integration/course-api.test.ts`**
```typescript
import { describe, it, expect } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Course Management', () => {
  it('should create a course', async () => {
    const course = await prisma.course.create({
      data: {
        user_id: 'test-user-id',
        course_name: 'Bahasa Indonesia',
        module_book_title: 'MKDU4111',
        tutor_name: 'Dr. Test'
      }
    })
    
    expect(course.id).toBeDefined()
    expect(course.course_name).toBe('Bahasa Indonesia')
  })

  it('should delete course and cascade', async () => {
    // Create course with session
    const course = await prisma.course.create({...})
    const session = await prisma.taskSession.create({
      data: { ... course_id: course.id }
    })

    await prisma.course.delete({ where: { id: course.id } })
    
    // Verify cascade delete
    const deletedSession = await prisma.taskSession.findUnique({
      where: { id: session.id }
    })
    expect(deletedSession).toBeNull()
  })
})
```

### API Tests (using curl)

**Test AI Provider API:**
```bash
# Create provider
curl -X POST "http://localhost:3000/api/admin/providers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-jwt-token" \
  -d '{
    "provider_type": "DEEPSEEK",
    "provider_name": "DeepSeek Test",
    "base_url": "https://api.deepseek.com/v1",
    "api_key": "sk-test-key",
    "default_model": "deepseek-chat"
  }'

# Get providers
curl "http://localhost:3000/api/admin/providers" \
  -H "Authorization: Bearer admin-jwt-token"
```

**Test Generate PDF:**
```bash
# Trigger PDF generation
curl -X POST "http://localhost:3000/api/generate-pdf" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer student-jwt-token" \
  -d '{
    "sessionId": "test-session-id"
  }' \
  --output test-output.pdf
```

---

## Performance Testing

### Load Testing (using Apache Bench)

```bash
# Test login endpoint
ab -n 100 -c 10 \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  http://localhost:3000/api/auth/callback/credentials

# Test dashboard
ab -n 1000 -c 50 \
  -H "Cookie: auth-token=xxx" \
  http://localhost:3000/dashboard
```

**Expected Results:**
- Requests per second: > 100
- Average response time: < 200ms
- Error rate: < 0.1%

---

## Accessibility Testing

### Tools
- **axe DevTools** - Browser extension
- **WAVE** - Web accessibility evaluation
- **Lighthouse** - Chrome DevTools

### Key Checks
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color contrast ratio > 4.5:1
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Error messages announced

---

## Browser Testing

### Supported Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Testing Matrix
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Login | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| PDF Export | ✅ | ✅ | ✅ | ✅ |
| OCR Upload | ✅ | ✅ | ✅ | ✅ |

---

## Test Data Management

### Seed Test Data

1. **Create test users**
```bash
npx prisma db seed
```

2. **Reset database**
```bash
npx prisma migrate reset
```

3. **Delete test data manually**
```sql
-- Delete all task sessions
DELETE FROM "task_sessions";

-- Delete all users except admin
DELETE FROM "users" WHERE role = 'USER';
```

---

## CI/CD Testing

### GitHub Actions

Automatic runs on:
- Push to `main`
- Pull requests

Tests:
- ESLint
- TypeScript check
- Build
- (Optional) Run test suite

---

## Reporting Results

### Test Report Template

```markdown
## Test Execution Report

**Date**: YYYY-MM-DD  
**Tester**: [Name]  
**Version**: v1.0.0  
**Environment**: Production

### Test Summary
- Total Cases: 50
- Passed: 48
- Failed: 2
- Blocked: 0

### Failed Tests
1. ❌ PDF Download - Browser: Firefox
   - Issue: Font not loading
   - Status: In Progress
   
2. ❌ Regenerate Button - Mobile
   - Issue: Button disabled after 4 regenerates (should be 5)
   - Status: To Fix
```

---

## Bug Reporting Template

```markdown
**Title**: [Feature] Brief description

**Severity**: Critical / High / Medium / Low

**Environment**: 
- Browser: Chrome 120.0
- OS: Windows 11
- URL: https://app.nugai.com/task/new

**Steps to Reproduce**:
1. Go to /task/new
2. Select Tugas Diskusi
3. Fill all fields
4. Click "Generate Jawaban"
5. Error occurs

**Expected Result**:
Task should generate successfully

**Actual Result**:
Error: "Failed to generate"

**Screenshots**:
[Attach screenshot]

**Logs**:
[Console output]

**Workaround**:
None
```

---

## Contact

For testing support, contact:
- Email: support@eas.biz.id
- Website: eas.biz.id