# User Flow Documentation - NugAI

## Dokumen Versi: 2.0 (Revised after audit)
## Tanggal: April 2026

---

## 1. Pendahuluan

Dokumen ini menjelaskan alur pengguna (user flow) secara menyeluruh untuk aplikasi NugAI, mencakup dua peran utama: Admin dan Student. Setiap flow disertai diagram ASCII, narasi langkah demi langkah, titik keputusan (decision points), penanganan error, transisi status, dan referensi komponen UI.

Aplikasi NugAI dibangun dengan Next.js App Router, menggunakan NextAuth.js untuk autentikasi, Prisma sebagai ORM, dan integrasi AI (DeepSeek, Tavily, Exa) untuk menghasilkan jawaban tugas akademik.

---

## 2. Diagram Alur Keseluruhan

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              NUGAI USER FLOW OVERVIEW                         │
└──────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────────┐
                              │      Halaman        │
                              │        Login        │
                              │   /login (GET)      │
                              └──────────┬──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
          ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
          │   Admin Icon   │  │  Student Login  │  │   Guest View    │
          │  (Click to     │  │  (Credentials  │  │  (Landing Page  │
          │   switch to    │  │   from Admin)  │  │   without auth) │
          │    Admin)      │  │                 │  │                 │
          └────────┬────────┘  └────────┬────────┘  └─────────────────┘
                   │                      │
                   ▼                      ▼
          ┌─────────────────┐  ┌─────────────────┐
          │  Admin Login    │  │   NextAuth     │
          │  Form (POST)   │  │   Middleware   │
          │                 │  │  Check Profile │
          └────────┬────────┘  └────────┬────────┘
                   │                      │
                   ▼                      ▼
          ┌─────────────────┐  ┌─────────────────┐
          │   /admin        │  │ Profile Exists?│
          │   Dashboard    │  │                │
          └─────────────────┘  └────────┬────────┘
                                        │
                     ┌──────────────────┴──────────────────┐
                     │                                     │
                     ▼                                     ▼
          ┌─────────────────┐                  ┌─────────────────┐
          │       YES       │                  │       NO        │
          │  /dashboard     │                  │  /onboarding    │
          │  (Student)      │                  │  (Wajib isi)   │
          └─────────────────┘                  └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  Setelah lengkap│
                                              │  → /dashboard   │
                                              └─────────────────┘
```

---

## 3. Flow Admin

### 3.1 Admin Login Flow

#### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ADMIN LOGIN FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Halaman   │      │   Klik      │      │   Tampilkan │      │    Input    │
   │    Login    │ ───▶ │   Icon      │ ───▶ │   Form      │ ───▶ │  Username   │
   │  (/login)   │      │   Admin     │      │   Admin     │      │  & Password │
   └─────────────┘      └─────────────┘      └─────────────┘      └──────┬──────┘
                                                                          │
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
   │  Redirect   │◀───  │  Tampilkan  │◀───  │   Validasi  │◀───────────┘
   │  ke Admin   │      │  Error       │      │  Credential │
   │  Dashboard  │      │  (Toast)     │      │  (NextAuth) │
   └──────┬──────┘      └─────────────┘      └─────────────┘
          │
          ▼
   ┌─────────────┐
   │   /admin    │
   │   Dashboard │
   └─────────────┘
```

#### Narasi Langkah Demi Langkah

1. **Pengguna mengakses halaman login** melalui URL `/login`. Halaman ini menampilkan form login standar untuk Student sekaligus icon kecil (admin access) di pojok kanan atas.

2. **Pengguna mengklik icon Admin** yang tersedia di halaman login. Icon ini bukan hidden route, melainkan elemen UI yang visible tetapi berbeda dari form Student utama.

3. **Sistem menampilkan form login Admin** yang meminta input username dan password khusus Admin. Form ini berbeda dari form Student tetapi menggunakan mekanisme autentikasi NextAuth yang sama.

4. **Pengguna mengisi kredensial** berupa username dan password yang telah ditentukan (dibuat saat inisialisasi sistem).

5. **Pengguna提交 (submit) form** dengan mengklik tombol "Masuk sebagai Admin".

6. **NextAuth memproses credential** melalui CredentialsProvider, melakukan bcrypt compare dengan password yang tersimpan di database.

7. **Jika kredensial valid**, NextAuth membuat session dan redirect ke halaman `/admin`.

8. **Jika kredensial tidak valid**, sistem menampilkan error menggunakan toast notification (sonner) dan meminta input ulang.

#### Titik Keputusan (Decision Points)

| Titik | Kondisi | Tindakan |
|-------|---------|----------|
| DC-ADMIN-01 | Kredensial valid | Redirect ke `/admin` |
| DC-ADMIN-02 | Kredensial invalid | Tampilkan error toast, increment attempt count |
| DC-ADMIN-03 | Username tidak ditemukan | Tampilkan "Username tidak ditemukan" |
| DC-ADMIN-04 | Password salah | Tampilkan "Password salah", increment attempt |
| DC-ADMIN-05 | Akun non-Admin mencoba akses | Redirect ke `/dashboard` Student |
| DC-ADMIN-06 | **Rate limit exceeded (5 attempts)** | Lock account for 15 minutes, show lock message |
| DC-ADMIN-07 | Account locked | Show "Account locked, try again in X minutes" |
| DC-ADMIN-08 | Successful login | Reset `admin_login_attempts` to 0 |

#### Rate Limiting Logic

```
Max Failed Attempts: 5 per admin account
Lock Duration: 15 minutes
Tracking: User.admin_login_attempts, User.admin_login_locked_until

On Failed Login:
  - Increment admin_login_attempts
  - If attempts >= 5: Set admin_login_locked_until = now + 15 minutes

On Successful Login:
  - Reset admin_login_attempts = 0
  - Clear admin_login_locked_until = null

On Login Attempt (Before Validation):
  - Check if admin_login_locked_until > now
  - If locked: Block with countdown message
```

#### Penanganan Error

| Kode Error | Pesan Tampilan | Tindakan Pengguna |
|------------|----------------|-------------------|
| ERR-AUTH-001 | "Username tidak ditemukan" | Periksa username, coba lagi |
| ERR-AUTH-002 | "Password salah" | Periksa password, coba lagi |
| ERR-AUTH-003 | "Akun Anda tidak memiliki akses Admin" | Hubungi administrator |

#### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `AdminLoginForm` | `/app/(auth)/login/page.tsx` | Form login Admin |
| `AdminIconButton` | `/components/ui/admin-icon.tsx` | Icon untuk switch ke mode Admin |
| `Input` (shadcn) | `/components/ui/input.tsx` | Input field untuk username/password |
| `Button` (shadcn) | `/components/ui/button.tsx` | Tombol submit |
| `sonner` toast | `/components/ui/sonner.tsx` | Notifikasi error |

#### Transisi Status

```
IDLE → SUBMITTING → VALIDATING → (SUCCESS | ERROR)
                ↓              ↓
           LOADING      SHOW_ERROR_TOAST
```

---

### 3.2 Admin Dashboard - User Management

#### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ADMIN DASHBOARD - USER MANAGEMENT                     │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   /admin    │ ───▶ │   Klik tab  │ ───▶ │    Tampilkan│ ───▶ │    Klik      │
   │   (GET)     │      │   "Users"    │      │   Tabel     │      │    Tombol    │
   │             │      │              │      │   User      │      │   "+ Tambah" │
   └─────────────┘      └─────────────┘      └─────────────┘      └──────┬──────┘
                                                                          │
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
   │   Simpan    │◀───  │   Validasi  │◀───  │    Isi      │◀───────────┘
   │   User      │      │   Input     │      │    Form      │
   │   Baru      │      │   (Client)  │      │    Modal     │
   └──────┬──────┘      └─────────────┘      └─────────────┘
          │
          ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │  Berhasil   │ ───▶ │   Redirect  │ ───▶ │   Refresh   │ ───▶ │   Tampilkan │
   │  (Toast)    │      │   ke /admin │      │   Tabel     │      │   Data      │
   │             │      │   /users    │      │   (Re-fetch)│      │   Baru      │
   └─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                         EDIT USER SUBSCRIPTION                               │
   └─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Klik      │ ───▶ │   Tampilkan │ ───▶ │   Pilih     │ ───▶ │    Klik     │
   │   Icon      │      │   Dropdown  │      │   Tier      │      │   "Simpan"  │
   │   Edit      │      │   Subscription│     │   (FREE/    │      │             │
   │             │      │              │      │   PREMIUM)  │      │             │
   └─────────────┘      └─────────────┘      └─────────────┘      └──────┬──────┘
                                                                          │
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
   │   Berhasil  │◀───  │   Update    │◀───  │  Validasi    │◀───────────┘
   │   (Toast)   │      │   Database  │      │   Pilihan   │
   └─────────────┘      └─────────────┘      └─────────────┘
```

#### Narasi Langkah Demi Langkah

**Akses User Management**

1. Admin login berhasil dan redirect ke halaman `/admin`.

2. Halaman Admin dashboard menampilkan beberapa tab/nav: Dashboard Utama, Users, Analytics, Settings.

3. Admin mengklik tab "Users" untuk mengakses panel manajemen user.

4. Sistem memuat dan menampilkan tabel berisi semua user yang terdaftar (kolom: Username, Role, Subscription Tier, Tanggal Dibuat, Aksi).

**Buat User Baru (Single Entry)**

1. Admin mengklik tombol "+ Tambah User" di bagian atas tabel.

2. Sistem menampilkan modal form dengan field berikut:
   - Username (text input, required)
   - Password (password input, required)
   - Konfirmasi Password (password input, required)
   - Role (dropdown: STUDENT, default: STUDENT)
   - Subscription Tier (dropdown: FREE/PREMIUM, default: FREE)

3. Admin mengisi semua field sesuai kebutuhan.

4. Admin mengklik tombol "Simpan".

5. Sistem melakukan validasi client-side:
   - Username minimal 3 karakter, maksimal 50 karakter
   - Password minimal 8 karakter, wajib mengandung 1 huruf besar dan 1 angka
   - Password dan Konfirmasi Password harus cocok

6. Jika validasi gagal, tampilkan pesan error pada field yang bersangkutan.

7. Jika validasi berhasil, sistem melakukan hash password dengan bcrypt dan menyimpan data ke tabel `User`.

8. Sistem menampilkan toast notification "User berhasil dibuat" dan merefresh tabel untuk menampilkan user baru.

**Edit Subscription Tier**

1. Pada baris user yang ingin diubah, admin mengklik icon dropdown pada kolom "Subscription Tier".

2. Sistem menampilkan opsi: FREE, PREMIUM.

3. Admin memilih tier yang diinginkan.

4. Sistem langsung melakukan update ke database dan menampilkan toast notification "Subscription berhasil diubah ke [TIER]".

**Reset User Password (Admin Action)**

1. Pada baris user yang ingin direset password, admin mengklik icon "Reset Password".

2. Dialog konfirmasi muncul: "Reset password untuk user [USERNAME]?"

3. Admin mengklik "Ya, Reset".

4. Sistem generate temporary password (random 12-char alphanumeric).

5. Temporary password ditampilkan di modal (admin harus copy dan berikan ke user).

6. Sistem hash temporary password dan update ke database.

7. Toast notification: "Password berhasil direset. Temporary password: [XXXX]"

8. User harus login dengan temporary password dan segera change password.

#### Titik Keputusan

| Titik | Kondisi | Tindakan |
|-------|---------|----------|
| DC-ADMIN-USER-01 | Username sudah ada | Tampilkan error "Username sudah digunakan" |
| DC-ADMIN-USER-02 | Password tidak memenuhi kriteria | Tampilkan error detail per field |
| DC-ADMIN-USER-03 | Konfirmasi password tidak cocok | Tampilkan error "Password tidak cocok" |
| DC-ADMIN-USER-04 | Save berhasil | Tampilkan toast success, refresh tabel |
| DC-ADMIN-USER-05 | Save gagal (DB error) | Tampilkan toast error "Gagal menyimpan user" |

#### Penanganan Error

| Kode Error | Pesan Tampilan | Tindakan Sistem |
|------------|----------------|------------------|
| ERR-ADMIN-001 | "Username sudah digunakan" | Prevent save, focus username field |
| ERR-ADMIN-002 | "Password minimal 8 karakter" | Show validation message |
| ERR-ADMIN-003 | "Password wajib mengandung 1 huruf besar dan 1 angka" | Show validation message |
| ERR-ADMIN-004 | "Password dan konfirmasi tidak cocok" | Show validation message |
| ERR-ADMIN-005 | "Gagal menyimpan user. Silakan coba lagi." | Log to Sentry, show toast |

#### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `AdminLayout` | `/app/(admin)/layout.tsx` | Layout untuk halaman admin |
| `UserManagementTable` | `/components/admin/user-table.tsx` | Tabel manajemen user |
| `CreateUserModal` | `/components/admin/create-user-modal.tsx` | Modal untuk buat user baru |
| `SubscriptionDropdown` | `/components/admin/subscription-dropdown.tsx` | Dropdown edit subscription |
| `DataTable` (shadcn) | `/components/ui/data-table.tsx` | Komponen tabel generik |
| `Dialog` (shadcn) | `/components/ui/dialog.tsx` | Modal dialog |
| `Select` (shadcn) | `/components/ui/select.tsx` | Dropdown select |
| `Form` (shadcn) | `/components/ui/form.tsx` | Form dengan validasi |

---

### 3.3 Admin Dashboard - API Cost Tracking

#### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD - API COST TRACKING                     │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   /admin    │ ───▶ │   Klik tab  │ ───▶ │    Fetch   │ ───▶ │   Tampilkan │
   │  (GET)      │      │  "Analytics"│      │   Usage    │      │   Dashboard │
   │             │      │             │      │   Logs     │      │   Metrics   │
   └─────────────┘      └─────────────┘      └──────┬──────┘      └─────────────┘
                                                   │
                                                   ▼
                                         ┌─────────────────┐
                                         │   Aggregasi     │
                                         │   Data per:     │
                                         │   - Tanggal     │
                                         │   - User        │
                                         │   - API Type    │
                                         └─────────────────┘

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                              METRICS DISPLAYED                               │
   └─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │  DeepSeek  │  │   Tavily    │  │    Exa     │  │   Estimated│
   │   Tokens   │  │   Calls     │  │   Calls    │  │    Cost    │
   │             │  │             │  │             │  │            │
   │  [TOTAL]    │  │  [TOTAL]    │  │  [TOTAL]   │  │  $[AMOUNT] │
   │  tokens    │  │  calls      │  │  calls     │  │    USD     │
   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                           FILTERS & DATE RANGE                                │
   └─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │  Pilih     │ ───▶ │  Pilih     │ ───▶ │  Re-fetch  │
   │  Date      │      │  User      │      │  & Update  │
   │  Range     │      │  (Optional)│      │  Charts    │
   └─────────────┘      └─────────────┘      └─────────────┘
```

#### Narasi Langkah Demi Langkah

1. Admin mengakses tab "Analytics" di dashboard admin.

2. Sistem secara default menampilkan metrics untuk 7 hari terakhir.

3. Metrics yang ditampilkan meliputi:
   - **Total DeepSeek Tokens**: Jumlah total token yang digunakan
   - **Total Tavily Calls**: Jumlah total panggilan ke API Tavily
   - **Total Exa Calls**: Jumlah total panggilan ke API Exa
   - **Estimated Cost**: Perkiraan biaya dalam USD (dihitung dari tarif API)

4. Sistem juga menampilkan breakdown per user untuk melihat siapa yang paling banyak menggunakan API.

5. Admin dapat memfilter data berdasarkan:
   - Rentang tanggal (date range picker)
   - User tertentu (dropdown)
   - Tipe task (DISCUSSION/ASSIGNMENT)

6. Setiap perubahan filter, sistem merefresh data dan mengupdate tampilan.

#### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `AnalyticsDashboard` | `/components/admin/analytics-dashboard.tsx` | Main analytics component |
| `MetricsCard` | `/components/admin/metrics-card.tsx` | Card untuk menampilkan metric |
| `UsageChart` | `/components/admin/usage-chart.tsx` | Chart untuk visualisasi |
| `DateRangePicker` | `/components/ui/date-range-picker.tsx` | Filter tanggal |
| `UserSelect` | `/components/admin/user-select.tsx` | Dropdown filter user |

---

### 3.4 Admin Dashboard - System Health Monitoring

#### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ADMIN DASHBOARD - SYSTEM HEALTH                         │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   /admin    │ ───▶ │   Klik tab  │ ───▶ │    Fetch   │ ───▶ │   Tampilkan │
   │  (GET)      │      │  "System   │      │   Health   │      │   Status    │
   │             │      │   Health"   │      │   Data     │      │   Cards     │
   └─────────────┘      └─────────────┘      └──────┬──────┘      └─────────────┘
                                                   │
                                                   ▼
                                         ┌─────────────────┐
                                         │   Check:        │
                                         │   - Database    │
                                         │   - API Keys    │
                                         │   - Error Rate  │
                                         │   - Response    │
                                         │     Time        │
                                         └─────────────────┘

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                              STATUS INDICATORS                               │
   └─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │  ● Healthy │      │  ● Warning  │      │  ● Critical │
   │  (Green)   │      │  (Yellow)   │      │  (Red)      │
   └─────────────┘      └─────────────┘      └─────────────┘
```

#### Narasi Langkah Demi Langkah

1. Admin mengakses tab "System Health" di dashboard admin.

2. Sistem melakukan health check terhadap:
   - Koneksi database (Prisma ping)
   - Status API keys (DeepSeek, Tavily, Exa)
   - Error rate (dari Sentry)
   - Response time (dari Vercel Analytics)

3. Setiap komponen health check ditampilkan dengan status indicator:
   - Green (Healthy): Semua berjalan normal
   - Yellow (Warning): Ada masalah minor
   - Red (Critical): Ada masalah serius yang perlu perhatian

4. Admin dapat melihat detail masalah dengan mengklik pada komponen yang bermasalah.

#### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `SystemHealthDashboard` | `/components/admin/system-health.tsx` | Main system health component |
| `HealthIndicator` | `/components/admin/health-indicator.tsx` | Status indicator |
| `HealthCard` | `/components/admin/health-card.tsx` | Card untuk setiap komponen |

---

## 4. Flow Student

### 4.1 Student Login Flow

#### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STUDENT LOGIN FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Halaman   │      │    Input    │      │   Submit   │      │  NextAuth  │
   │    Login    │ ───▶ │  Username   │ ───▶ │   Form     │ ───▶ │  Validate  │
   │  (/login)   │      │  & Password │      │            │      │            │
   └─────────────┘      └─────────────┘      └─────────────┘      └──────┬──────┘
                                                                          │
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
   │  Redirect  │◀───  │  Tampilkan  │◀───  │   Valid    │◀──────────┘
   │  ke        │      │  Error      │      │  Credential│
   │  Middleware│      │  (Toast)    │      │            │
   └──────┬──────┘      └─────────────┘      └─────────────┘
          │
          ▼
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                         MIDDLEWARE CHECK FLOW                                │
   └─────────────────────────────────────────────────────────────────────────────┘

          │
          ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │  Cek        │ ───▶ │  Profile   │      │             │
   │  Student   │      │  Exists?    │      │             │
   │  Profile   │      │             │      │             │
   └──────┬──────┘      └──────┬──────┘      └─────────────┘
          │                    │
     ┌────┴────┐          ┌────┴────┐
     │         │          │         │
     ▼         ▼          ▼         ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│   YES   │  │   NO    │  │  ERROR  │
│         │  │         │  │        │
│Redirect │  │Redirect │  │ Handle &│
│to       │  │to       │  │ Alert  │
│/dashboard│ │/onboard │  │ Admin   │
└─────────┘  └─────────┘  └─────────┘
```

#### Narasi Langkah Demi Langkah

1. **Akses Halaman Login**: Pengguna mengakses `/login` dan melihat form login Student.

2. **Input Kredensial**: Pengguna memasukkan username dan password yang telah dibuat oleh Admin.

3. **Submit Form**: Pengguna mengklik tombol "Masuk".

4. **Validasi oleh NextAuth**: NextAuth CredentialsProvider memvalidasi kredensial terhadap database.

5. **Jika Valid**:
   - NextAuth membuat session JWT.
   - Browser redirect ke halaman utama (route `/` yang akan middleware redirects ke `/dashboard` atau check profile).
   - Middleware memeriksa keberadaan `StudentProfile` untuk user tersebut.

6. **Middleware Check Profile**:
   - Query ke tabel `StudentProfile` berdasarkan `user_id` dari session.
   - Jika `StudentProfile` ditemukan dan lengkap → redirect ke `/dashboard`.
   - Jika `StudentProfile` tidak ditemukan → redirect ke `/onboarding` (wajib).

7. **Jika Invalid**: Tampilkan toast error "Username atau password salah" dan tetap di halaman login.

#### Titik Keputusan

| Titik | Kondisi | Tindakan |
|-------|---------|----------|
| DC-STUDENT-LOGIN-01 | Kredensial valid | Buat session, redirect ke middleware |
| DC-STUDENT-LOGIN-02 | Kredensial invalid | Tampilkan error toast |
| DC-STUDENT-LOGIN-03 | Profile exists | Redirect ke `/dashboard` |
| DC-STUDENT-LOGIN-04 | Profile not exists | Redirect ke `/onboarding` |

#### Penanganan Error

| Kode Error | Pesan Tampilan | Tindakan |
|------------|----------------|----------|
| ERR-STUD-001 | "Username atau password salah" | Coba lagi |
| ERR-STUD-002 | "Session expired, silakan login ulang" | Redirect ke login |
| ERR-STUD-003 | "Terjadi kesalahan, hubungi admin" | Log error, contact admin |

#### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `LoginForm` | `/app/(auth)/login/page.tsx` | Form login Student |
| `Input` (shadcn) | `/components/ui/input.tsx` | Input field |
| `Button` (shadcn) | `/components/ui/button.tsx` | Tombol submit |
| `sonner` toast | `/components/ui/sonner.tsx` | Notifikasi |

---

### 4.2 Onboarding Flow (Student Profile Setup)

#### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ONBOARDING FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Redirect │      │   Tampilkan │      │    Isi     │      │    Validasi│
   │   dari     │ ───▶ │   Form      │ ───▶ │    Data    │ ───▶ │    Input   │
   │  Middleware│      │   Onboard   │      │   Profile  │      │    (Client)│
   │  (/onboard)│      │              │      │            │      │            │
   └─────────────┘      └─────────────┘      └──────┬──────┘      └──────┬──────┘
                                                    │                    │
   ┌─────────────┐      ┌─────────────┐             │                    │
   │  Redirect  │◀───  │  Simpan     │◀────────────┘                    │
   │  ke        │      │  ke         │                                  │
   │  /dashboard│      │  Database   │                                  │
   └─────────────┘      └──────┬──────┘                                  │
                              │                                           │
                              ▼                                           │
                    ┌─────────────────┐                                  │
                    │   Berhasil      │◀─────────────────────────────────┘
                    │   (Toast)       │
                    └─────────────────┘

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                         REQUIRED FIELDS                                      │
   └─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │   Nama      │  │    NIM      │  │  Universitas│  │  Fakultas   │
   │   Lengkap   │  │             │  │             │  │             │
   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘

   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │   Prodi     │  │   UPBJJ     │  │    Logo     │  │    Font     │
   │             │  │  (Optional) │  │   (Wajib)   │  │   (Wajib)   │
   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

#### Narasi Langkah Demi Langkah

1. **Redirect dari Middleware**: Setelah login berhasil, jika `StudentProfile` kosong, middleware redirect ke `/onboarding`.

2. **Tampilkan Form Onboarding**: Sistem menampilkan form dengan semua field yang wajib diisi.

3. **Isi Data Profile**:
   - **Nama Lengkap** (full_name): Input text, wajib, min 3 karakter
   - **NIM** (nim): Input text, wajib, min 5 karakter
   - **Universitas** (university_name): Input text, wajib, min 5 karakter
   - **Fakultas** (faculty): Input text, wajib, min 3 karakter
   - **Program Studi** (study_program): Input text, wajib, min 3 karakter
   - **UPBJJ** (upbjj_branch): Input text, opsional
   - **Upload Logo Universitas**: File upload, wajib, format JPG/PNG, max 2MB
   - **Upload Font Arial**: File upload, **OPSIONAL**, format TTF, max 2MB
     - Jika tidak upload, sistem menggunakan default Arial font dari `/public/fonts/`

4. **Upload Logo**:
   - Pengguna drag & drop atau klik untuk memilih file.
   - Sistem upload ke Vercel Blob dan получить URL.
   - Tampilkan preview logo setelah upload berhasil.

5. **Upload Font (OPSIONAL)**:
   - Pengguna dapat upload file .ttf (Arial regular, bold, italic) atau skip.
   - Jika skip, sistem menggunakan default Arial font dari `/public/fonts/`.
   - Jika upload, sistem upload ke Vercel Blob dan mendapatkan URL.
   - Font akan digunakan untuk PDF generation.
   - Tombol "Skip Font Upload" tersedia untuk user yang tidak ingin upload.

6. **Validasi Input**:
   - Semua field wajib terisi (kecuali UPBJJ).
   - Format file sesuai ketentuan.
   - Jika ada yang salah, tampilkan pesan error pada field yang bersangkutan.

7. **Submit Form**:
   - Pengguna klik tombol "Simpan & Lanjutkan".
   - Sistem menyimpan data ke tabel `StudentProfile`.
   - Sistem menyimpan URL logo dan font ke database.

8. **Redirect ke Dashboard**:
   - Tampilkan toast "Profil berhasil disimpan".
   - Redirect ke `/dashboard`.

#### Titik Keputusan

| Titik | Kondisi | Tindakan |
|-------|---------|----------|
| DC-ONBOARD-01 | Semua field wajib terisi | Proceed ke save |
| DC-ONBOARD-02 | Ada field kosong | Tampilkan error, prevent submit |
| DC-ONBOARD-03 | Format file tidak sesuai | Tampilkan error, prevent upload |
| DC-ONBOARD-04 | Save berhasil | Redirect ke dashboard |
| DC-ONBOARD-05 | Save gagal | Tampilkan error toast |

#### Validasi Input

| Field | Aturan | Pesan Error |
|-------|--------|-------------|
| full_name | Min 3, max 100 chars | "Nama lengkap minimal 3 karakter" |
| nim | Min 5, max 20 chars, alphanumeric | "NIM minimal 5 karakter, alphanumeric" |
| university_name | Min 5, max 100 chars | "Nama universitas minimal 5 karakter" |
| faculty | Min 3, max 50 chars | "Fakultas minimal 3 karakter" |
| study_program | Min 3, max 50 chars | "Program studi minimal 3 karakter" |
| university_logo_url | Required, valid URL | "Logo universitas wajib diupload" |
| pdf_font_url | Optional (nullable) | Tidak ada error jika kosong - sistem pakai default |

#### Penanganan Error

| Kode Error | Pesan Tampilan | Tindakan |
|------------|----------------|----------|
| ERR-ONBOARD-001 | "Logo wajib diupload" | Highlight upload area |
| ERR-ONBOARD-002 | "Font wajib diupload" | Highlight upload area |
| ERR-ONBOARD-003 | "Format file harus JPG/PNG" | Show accepted formats |
| ERR-ONBOARD-004 | "Ukuran file maksimal 2MB" | Show size limit |
| ERR-ONBOARD-005 | "Gagal menyimpan profil" | Log to Sentry |

#### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `OnboardingForm` | `/app/(auth)/onboarding/page.tsx` | Main onboarding page |
| `Form` (shadcn) | `/components/ui/form.tsx` | Form dengan Zod validation |
| `Input` (shadcn) | `/components/ui/input.tsx` | Text input |
| `FileUpload` | `/components/ui/file-upload.tsx` | Dropzone untuk file |
| `Button` (shadcn) | `/components/ui/button.tsx` | Submit button |

---

### 4.3 Student Dashboard Flow

#### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STUDENT DASHBOARD FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Akses     │      │   Fetch    │      │   Tampilkan│      │   User     │
   │   /dashboard│ ───▶ │   User     │ ───▶ │   Dashboard│ ───▶ │   dapat:   │
   │   (GET)     │      │   Data     │      │   Content  │      │            │
   └─────────────┘      └─────────────┘      └─────────────┘      └──────┬──────┘
                                                                          │
   ┌─────────────────────────────────────────────────────────────────────┐   │
   │                        DASHBOARD CONTENT                            │   │
   └─────────────────────────────────────────────────────────────────────┘   │
                                                                          │
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
   │ Quick       │  │   Recent    │  │   Usage    │  │   Quick    │    │
   │ Action:     │  │   Tasks     │  │   Today    │  │   Links    │    │
   │             │  │             │  │             │  │            │    │
   │ [+ Buat     │  │ [List of    │  │ [X/5 used  │  │ • Courses  │    │
   │   Tugas]    │  │  recent     │  │  for FREE]  │  │ • Settings│    │
   │             │  │  sessions]  │  │             │  │ • Help     │    │
   └──────┬──────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
          │                                                                │
          ▼                                                                │
   ┌─────────────┐                                                         │
   │   Klik      │◀───────────────────────────────────────────────────────┘
   │   "Buat    │
   │   Tugas"   │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  Redirect   │
   │  ke /task/new│
   └─────────────┘
```

#### Narasi Langkah Demi Langkah

1. **Akses Dashboard**: Setelah login dan onboarding lengkap, pengguna mengakses `/dashboard`.

2. **Fetch Data**: Sistem memuat data berikut:
   - User profile (dari `StudentProfile`)
   - Recent task sessions (dari `TaskSession`)
   - Daily usage count (dari `User`)
   - Quick stats

3. **Tampilkan Dashboard** dengan komponen:
   - **Sapaan**: "Halo, [Nama Lengkap]"
   - **Quick Action**: Tombol besar "Buat Tugas Baru"
   - **Riwayat Tugas**: List 5 task terbaru dengan status
   - **Usage Today**: Untuk user FREE, tampilkan "X/5 tugas hari ini"
   - **Menu Navigasi**: Courses, Settings, Help

4. **Klik "Buat Tugas Baru"**:
   - Redirect ke halaman Task Wizard `/task/new`
   - Mulai 3-step wizard (lihat section 4.4)

#### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `StudentDashboard` | `/app/(student)/dashboard/page.tsx` | Main dashboard page |
| `WelcomeHeader` | `/components/dashboard/welcome-header.tsx` | Sapaan user |
| `QuickActionCard` | `/components/dashboard/quick-action.tsx` | Tombol buat tugas |
| `RecentTasksList` | `/components/dashboard/recent-tasks.tsx` | List tugas terbaru |
| `UsageCounter` | `/components/dashboard/usage-counter.tsx` | Counter daily usage |

---

### 4.4 Course Management Flow

#### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COURSE MANAGEMENT FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Klik      │      │   Fetch     │      │   Tampilkan │      │   Klik      │
   │   Menu     │ ───▶ │   Courses   │ ───▶ │   List      │ ───▶ │   "+ Tambah"│
   │   Courses   │      │   (Private) │      │   Course    │      │   Course    │
   │             │      │             │      │             │      │             │
   └─────────────┘      └─────────────┘      └─────────────┘      └──────┬──────┘
                                                                          │
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
   │   Simpan    │◀───  │  Validasi   │◀───  │    Isi      │◀───────────┘
   │   Course    │      │   Input     │      │    Form     │
   └──────┬──────┘      └─────────────┘      └─────────────┘
          │
          ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │  Berhasil   │ ───▶ │   Refresh   │ ───▶ │   Tampilkan │ ───▶ │   COURSE    │
   │  (Toast)    │      │   List      │      │   Course    │      │   DETAIL    │
   │             │      │             │      │   Baru      │      │   (View)    │
   └─────────────┘      └─────────────┘      └─────────────┘      └──────┬──────┘
                                                                          │
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
   │   Edit      │◀───  │   Klik      │◀─────│   Actions   │◀────────────┘
   │   Course    │      │   Edit      │      │   Menu      │
   └──────┬──────┘      └─────────────┘      └─────────────┘
          │
          ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Delete    │◀───  │   Confirm   │◀─────│   Klik      │
   │   Course    │      │   Dialog    │      │   Delete    │
   └─────────────┘      └─────────────┘      └─────────────┘
```

#### Narasi Langkah Demi Langkah

**Akses Courses**

1. Pengguna mengklik menu "Mata Kuliah" di sidebar atau dashboard.

2. Sistem fetch semua courses yang dimiliki oleh user tersebut dari tabel `Course`.

3. Tampilkan list courses dalam bentuk kartu atau tabel dengan kolom: Nama Mata Kuliah, Judul Modul, Nama Tutor, Aksi.

**Tambah Course (CRUD - Create)**

1. Pengguna mengklik tombol "+ Tambah Mata Kuliah".

2. Modal form muncul dengan field:
   - Nama Mata Kuliah (required)
   - Judul Modul/Buku (required)
   - Nama Tutor/Dosen (required)

3. Pengguna mengisi form dan klik "Simpan".

4. Sistem validasi input (min 3 karakter per field).

5. Jika valid, simpan ke database dan tampilkan toast success.

6. Refresh list courses untuk menampilkan data baru.

**Edit Course (CRUD - Update)**

1. Pada baris course, pengguna mengklik icon edit (pensil).

2. Modal edit form muncul dengan data yang sudah terisi.

3. Pengguna mengubah field yang diinginkan.

4. Klik "Simpan Perubahan".

5. Sistem update database dan refresh list.

**Delete Course (CRUD - Delete)**

1. Pada baris course, pengguna mengklik icon delete (trash).

2. Dialog konfirmasi muncul: "Yakin ingin menghapus mata kuliah ini?"

3. Pengguna mengklik "Ya, Hapus".

4. Sistem hapus dari database dan refresh list.

#### Catatan Penting

- Courses bersifat **private per-user**. Setiap user hanya melihat courses miliknya sendiri.
- Tidak ada master data course yang di-share antar user.
- Course yang dihapus tidak mempengaruhi task sessions yang sudah dibuat dengan course tersebut (foreign key menggunakan `SetNull`).

#### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `CourseListPage` | `/app/(student)/courses/page.tsx` | Main courses page |
| `CourseCard` | `/components/courses/course-card.tsx` | Card untuk satu course |
| `CourseFormModal` | `/components/courses/course-form-modal.tsx` | Modal tambah/edit course |
| `ConfirmDialog` (shadcn) | `/components/ui/confirm-dialog.tsx` | Dialog konfirmasi delete |

---

### 4.5 3-Step Task Wizard Flow

Ini adalah flow utama aplikasi NugAI untuk menghasilkan jawaban tugas akademik.

#### Diagram Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          3-STEP TASK WIZARD OVERVIEW                        │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌───────────────────────────────────────────────────────────────────────────┐
   │                                                                           │
   │   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
   │   │    STEP 1   │ ──▶  │    STEP 2   │ ──▶  │    STEP 3   │            │
   │   │    INPUT    │      │  PROCESSING │      │   RESULT    │            │
   │   │             │      │             │      │             │            │
   │   │ • Task Type │      │ • Keyword   │      │ • Streaming │            │
   │   │ • Course    │      │   Extract   │      │   Display   │            │
   │   │ • Min Words │      │ • Search    │      │ • Word      │            │
   │   │ • Question  │      │ • Context   │      │   Count     │            │
   │   │ • OCR       │      │ • Generate  │      │ • Refs      │            │
   │   │ • Quota     │      │             │      │ • Actions   │            │
   │   │   Check     │      │             │      │             │            │
   │   └─────────────┘      └─────────────┘      └─────────────┘            │
   │                                                                           │
   └───────────────────────────────────────────────────────────────────────────┘
```

---

#### 4.5.1 Step 1: Input & Context Setup

##### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     STEP 1: INPUT & CONTEXT SETUP                            │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Tampilkan │      │   Pilih     │      │   Pilih     │      │    Input    │
   │   Form      │ ───▶ │   Task Type │ ───▶ │   Course    │ ───▶ │    Min      │
   │   Step 1    │      │   (DISC/    │      │   (Combo-   │      │    Words    │
   │             │      │   ASSIGN)  │      │   box)      │      │             │
   └─────────────┘      └─────────────┘      └─────────────┘      └──────┬──────┘
                                                                          │
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
   │   Input     │◀───  │   Auto-fill │◀───  │   Fetch     │◀───────────┘
   │   Question  │      │   from      │      │   Courses   │
   │   Text      │      │   Profile   │      │   (Private) │
   └──────┬──────┘      └─────────────┘      └─────────────┘
          │
          ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Upload    │ ───▶ │   OCR       │ ───▶ │   Append    │ ───▶ │   Quota     │
   │   Images    │      │   Process   │      │   to        │      │   Check     │
   │   (Multiple)│      │   (Tesseract│      │   Question  │      │             │
   │             │      │   .js)      │      │   Text      │      │             │
   └─────────────┘      └──────┬──────┘      └─────────────┘      └──────┬──────┘
                              │                                          │
   ┌─────────────┐            │                                          │
   │   Error     │◀───────────┴──────────────────────────────────────────┘
   │   (Alert)   │                         │
   └─────────────┘                         ▼
                                  ┌─────────────────┐
                                  │   Valid &       │
                                  │   Within Quota  │
                                  └────────┬────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │   Enable "Next" │
                                  │   Button        │
                                  └─────────────────┘
```

##### Narasi Langkah Demi Langkah

1. **Tampilkan Form Step 1**:
   - load komponen TaskWizard dengan step=1
   - Tampilkan tabs untuk Task Type: "Tugas Diskusi" atau "Tugas Soal/Makalah"

2. **Pilih Task Type**:
   - Pengguna memilih antara `DISCUSSION` atau `ASSIGNMENT`
   - Pilihan ini mempengaruhi format output PDF nanti

3. **Pilih Course (Combobox)**:
   - Klik combobox untuk menampilkan dropdown courses
   - Courses diambil dari tabel `Course` milik user (private)
   - Jika dipilih, auto-fill:
     - Judul Modul (module_book_title)
     - Nama Tutor (tutor_name)
   - Ada opsi "Input Manual" jika course tidak ada di list (tidak disimpan ke DB)

4. **Input Minimum Kata**:
   - Default diambil dari `StudentProfile.default_min_words` (default: 300)
   - User bisa modify dengan number input
   - Range: min 100, max 2000

5. **Input Question Text**:
   - Textarea untuk input soal manual
   - Supports multiple questions (satu per baris atau dipisahkan)

6. **OCR Image Upload (Multiple Images)**:
   - Dropzone untuk upload gambar (JPG, PNG, WebP)
   - Max 5 gambar per soal, masing-masing max 2MB
   - Klik "Process OCR" untuk setiap gambar
   - Tesseract.js memproses gambar di client-side
   - Hasil OCR di-append ke question textarea
   - User bisa edit hasil OCR jika ada kesalahan

7. **Quota Check (Server-Side Enforcement)** (VALIDASI TERPENTING):
   - Client calls `/api/generate-task` API endpoint
   - API performs transactional quota check using database:
     - Query `User.daily_usage_count` and `last_usage_date`
     - Reset count to 0 if `last_usage_date !== today` (first request of day)
     - Compare against limit: FREE: 5/day, PREMIUM: unlimited
   - If FREE tier exceeded → API returns HTTP 403, client shows alert "Daily quota exceeded, upgrade to Premium"
   - If valid → Proceed to Step 2
   - **IMPORTANT:** Quota increment happens AFTER successful generation (atomic transaction in API)

8. **Klik Next**:
   - Validasi semua input (task type, question text tidak kosong)
   - Simpan state ke client-side (React state atau URL params)
   - Navigate ke Step 2

##### Titik Keputusan

| Titik | Kondisi | Tindakan |
|-------|---------|----------|
| DC-STEP1-01 | Question kosong | Disable tombol Next, show validation |
| DC-STEP1-02 | FREE quota exceeded | Show alert, disable Next |
| DC-STEP1-03 | OCR processing | Show loading spinner |
| DC-STEP1-04 | OCR failed | Show error alert, allow retry or manual |
| DC-STEP1-05 | All valid | Enable Next button |

##### Penanganan Error

| Kode Error | Pesan Tampilan | Tindakan |
|------------|----------------|----------|
| ERR-STEP1-001 | "Quota harian tercapai. Upgrade ke Premium untuk akses tak terbatas." | Show upgrade prompt |
| ERR-STEP1-002 | "OCR gagal membaca gambar. Silakan retry atau input manual." | Allow retry |
| ERR-STEP1-003 | "Gambar terlalu besar (max 2MB)" | Show size limit |
| ERR-STEP1-004 | "Format gambar tidak didukung" | Show accepted formats |

##### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `TaskWizard` | `/components/task/task-wizard.tsx` | Main wizard container |
| `Step1Input` | `/components/task/step1-input.tsx` | Step 1 form |
| `Tabs` (shadcn) | `/components/ui/tabs.tsx` | Task type selection |
| `Combobox` (shadcn) | `/components/ui/combobox.tsx` | Course selection |
| `NumberInput` (shadcn) | `/components/ui/number-input.tsx` | Min words input |
| `Textarea` (shadcn) | `/components/ui/textarea.tsx` | Question input |
| `OCRDropzone` | `/components/task/ocr-dropzone.tsx` | Image upload + OCR |

---

#### 4.5.2 Step 2: Processing & Research Pipeline

##### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   STEP 2: PROCESSING & RESEARCH PIPELINE                     │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Init      │      │  Keyword    │      │   Web       │      │   Context   │
   │   Task      │ ───▶ │  Extraction │ ───▶ │  Search    │ ───▶ │  Assembly   │
   │   Session   │      │   (DeepSeek) │      │  (Tavily+  │      │             │
   │             │      │             │      │   Exa)      │      │             │
   └─────────────┘      └─────────────┘      └──────┬──────┘      └──────┬──────┘
                                                    │                    │
   ┌─────────────┐      ┌─────────────┐            │                    │
   │  Update     │◀───  │   Update    │◀───────────┘                    │
   │  UI (Stream)│      │  Usage Log  │                                  │
   └──────┬──────┘      └─────────────┘                                  │
          │                                                             │
          ▼                                                             │
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
   │   Save to   │◀───  │   LLM       │◀───────────────────────────────┘
   │   Database  │      │   Streaming │
   └─────────────┘      └─────────────┘

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                         PHASE DETAILS                                       │
   └─────────────────────────────────────────────────────────────────────────────┘

   ┌────────────────────────────────┐  ┌────────────────────────────────────────┐
   │        PHASE 1                │  │              PHASE 2                  │
   │     Keyword Extraction        │  │            Web Search                 │
   │                                │  │                                        │
   │  Input:                       │  │  ┌──────────┐        ┌──────────┐       │
   │  - Question Text             │  │  │  Tavily  │        │   Exa    │       │
   │  - Module Title              │  │  │   API    │        │   API    │       │
   │                               │  │  │          │        │          │       │
   │  Output:                     │  │  │ • Facts  │        │ • Journal│       │
   │  - Optimized Search Queries  │  │  │ • Web    │        │ • Books  │       │
   │  - Keywords List             │  │  │ • Regs   │        │ •学术    │       │
   └────────────────────────────────┘  │  └────┬─────┘        └────┬─────┘       │
                                       │       │                   │             │
                                       │       └─────────┬─────────┘             │
                                       │                 ▼                       │
                                       │         ┌─────────────────┐             │
                                       │         │   Merge &       │             │
                                       │         │   Deduplicate   │             │
                                       │         └─────────────────┘             │
                                       └────────────────────────────────────────┘

   ┌────────────────────────────────┐  ┌────────────────────────────────────────┐
   │        PHASE 3                │  │              PHASE 4                  │
   │     Context Assembly          │  │         LLM Streaming                 │
   │                                │  │                                        │
   │  ┌──────────────────────────┐ │  │  Input:                                │
   │  │  System Prompt Template  │ │  │  - Assembled Context                  │
   │  │  + User Profile          │ │  │  - Task Type                          │
   │  │  + Module Info           │ │  │  - Min Words Target                   │
   │  │  + Search Results        │ │  │                                        │
   │  │  + Task Type             │ │  │  Output:                               │
   │  └──────────────────────────┘ │  │  - Streaming text (real-time)          │
   │                                │  │  - Word count indicator                │
   │  Output:                      │  │  - On finish: save to DB               │
   │  - Complete Context for LLM   │  │                                        │
   └────────────────────────────────┘  └────────────────────────────────────────┘
```

##### Narasi Langkah Demi Langkah

**Phase 1: Keyword Extraction**

1. Sistem menerima input dari Step 1 (question, module title, task type).

2. DeepSeek mengekstrak keywords dari question text untuk optimizar query search.

3. Output: List keywords yang akan digunakan untuk search APIs.

**Phase 2: Web Search**

1. **Parallel Calls**:
   - Kirim request ke Tavily API (general facts, web content, regulations)
   - Kirim request ke Exa API (academic journals, books)

2. **Retry Logic**:
   - Each API max retry 2 kali dengan delay 1 detik
   - Jika Tavily gagal → Gunakan hasil Exa saja (log warning)
   - Jika Exa gagal → Gunakan hasil Tavily saja (log warning)
   - **Jika keduanya gagal → Block dengan error, TIDAK ADA fallback scraper**

3. **Merge & Deduplicate**:
   - Gabungkan hasil dari kedua API
   - Hapus duplikasi berdasarkan URL
   - Prioritas: Exa (academic) > Tavily (general)

4. **Simpan metadata** search (query, timestamp, total results).

**Phase 3: Context Assembly**

1. Bangun complete prompt dengan template:

```
[Persona Context]
Kamu adalah mahasiswa tingkat sarjana program studi {study_program} di {university_name}...

[Language Constraint]
WAJIB menggunakan Bahasa Indonesia Baku Semi-Formal...

[Task Type Constraint]
(DISCUSSION or ASSIGNMENT format rules)

[Word Count Constraint]
Jawaban HARUS MEMILIKI MINIMAL {min_words_target} KATA...

[Reference Mandate]
WAJIB mencantumkan 2 referensi...

[Module Reference]
Primary: {module_book_title} by {tutor_name}

[Search Results]
{formatted_exa_results}
{formatted_tavily_results}

[User Question]
{question_text}
```

2. Simpan complete context untuk digunakan di next phase.

**Phase 4: LLM Streaming**

1. Kirim request ke DeepSeek melalui Vercel AI SDK dengan `streamText()`.

2. Enable streaming response ke client.

3. Tampilkan streaming text di UI (real-time).

4. Hitung word count secara real-time untuk memastikan target terpenuhi.

5. **On `onFinish` callback - Database Save (Atomic Transaction)**:
   - Create `TaskSession` record dengan:
     - Snapshot fields: `course_name_snapshot`, `module_book_title_snapshot`, `tutor_name_snapshot`
     - (Copy dari Course jika course_id ada, untuk preserve data jika course di-delete)
   - Create `TaskItem` records (one per soal) dengan answer dan references
   - Set status `COMPLETED` atau `FAILED`
   - Increment `User.daily_usage_count` (atomic)
   - Update `User.last_usage_date` to today
   - Create `DailyUsageLog` entry dengan token usage dan API calls count

##### Titik Keputusan

| Titik | Kondisi | Tindakan |
|-------|---------|----------|
| DC-STEP2-01 | Tavily API success | Merge results |
| DC-STEP2-02 | Tavily API failed (retry 2x) | Use Exa only, log warning |
| DC-STEP2-03 | Exa API failed (retry 2x) | Use Tavily only, log warning |
| DC-STEP2-04 | Both APIs failed | Block, show error, cannot proceed |
| DC-STEP2-05 | LLM streaming complete | Save to DB, navigate to Step 3 |
| DC-STEP2-06 | LLM failed | Set status FAILED, show retry option |

##### Penanganan Error

| Kode Error | Pesan Tampilan | Tindakan |
|------------|----------------|----------|
| ERR-STEP2-001 | "Pencarian referensi gagal. Silakan retry atau coba lagi nanti." | Show retry button |
| ERR-STEP2-002 | "Tidak dapat terhubung ke AI. Silakan retry." | Show retry option |
| ERR-STEP2-003 | "Terjadi kesalahan sistem. Tim telah dimaklumkan." | Log to Sentry |

##### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `Step2Processing` | `/components/task/step2-processing.tsx` | Step 2 UI |
| `ProcessingIndicator` | `/components/task/processing-indicator.tsx` | Loading states |
| `StreamDisplay` | `/components/task/stream-display.tsx` | Real-time text display |
| `WordCountIndicator` | `/components/task/word-count-indicator.tsx` | Live word count |

---

#### 4.5.3 Step 3: Result & Actions

##### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STEP 3: RESULT & ACTIONS                             │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Load      │      │   Tampilkan│      │   Check    │      │   Display  │
   │   Session   │ ───▶ │   Result   │ ───▶ │   Word     │ ───▶ │   Actions  │
   │   Data      │      │   Text     │      │   Count    │      │   Buttons  │
   └─────────────┘      └─────────────┘      └─────────────┘      └──────┬──────┘
                                                                          │
   ┌─────────────────────────────────────────────────────────────────────┐   │
   │                        ACTIONS AVAILABLE                             │   │
   └─────────────────────────────────────────────────────────────────────┘   │
                                                                          │
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
   │  Regenerate │  │   Download  │  │   Save as  │  │   Back to   │       │
   │   (Max 5)  │  │    PDF      │  │   Draft    │  │   Dashboard │       │
   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────────────┘       │
          │                │                │                              │
          ▼                ▼                ▼                              │
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
   │  See        │  │  Generate  │  │  Update    │                         │
   │  Regenerate │  │  PDF (On-  │  │  Status to │                         │
   │  Flow      │  │  demand)   │  │  DRAFT     │                         │
   └─────────────┘  └─────────────┘  └─────────────┘                         │
```

##### Narasi Langkah Demi Langkah

1. **Load Session Data**:
   - Fetch TaskSession dari database
   - Include TaskItems dan references

2. **Display Result**:
   - Render streaming text sebagai Markdown/HTML
   - Tampilkan word count indicator (actual vs target)
   - Tampilkan references yang digunakan (dengan source links)

3. **Action Buttons**:
   - **Regenerate**: Untuk regenerate jawaban (max 5 per soal)
   - **Download PDF**: Generate dan download PDF
   - **Save as Draft**: Simpan dengan status DRAFT (optional)
   - **Back to Dashboard**: Kembali ke dashboard

4. **Regenerate Flow** (lihat section 4.6)

5. **PDF Generation** (lihat section 4.7)

#### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `Step3Result` | `/components/task/step3-result.tsx` | Step 3 UI |
| `ResultDisplay` | `/components/task/result-display.tsx` | Rendered answer |
| `ReferencesList` | `/components/task/references-list.tsx` | List of references |
| `ActionButtons` | `/components/task/action-buttons.tsx` | Regenerate, Download, etc |

---

### 4.6 Regenerate Flow (Counts Toward Daily Quota)

#### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            REGENERATE FLOW                                   │
│                   (Each regenerate counts toward quota)                      │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
    │   Klik      │      │   Check    │      │   Check    │      │   Show     │
    │   "Regener- │ ───▶ │   Regen    │ ───▶ │   Daily    │ ───▶ │   Input    │
    │   ate"      │      │   Limit(5) │      │   Quota    │      │   Instruksi│
    │             │      │             │      │   (FREE)   │      │   (Opt)    │
    └─────────────┘      └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
                               │                    │                    │
    ┌─────────────┐            │                    │                    │
    │  Exceeded   │◀───────────┴────────────────────┘                    │
    │  Regen Limit│            │                                        │
    │  (Alert)   │            │                                        │
    └─────────────┘            │                                        │
                               │         ┌──────────────────────────────┘
                               │         │
                               ▼         ▼
    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
    │  Quota      │ ───▶ │  Build     │ ───▶ │   Call      │ ───▶ │   Stream   │
    │  Exceeded   │      │  Threaded  │      │   DeepSeek  │      │   New      │
    │  (Alert)   │      │  Context   │      │   (Revise)  │      │   Answer   │
    └─────────────┘      └─────────────┘      └─────────────┘      └──────┬──────┘
                                                                           │
                                                                           ▼
    ┌─────────────┐      ┌─────────────┐
    │   Update    │ ───▶ │   Increment │
    │   Database  │      │   Quota     │
    │   & Display │      │   Count     │
    └─────────────┘      └─────────────┘
```

#### Narasi Langkah Demi Langkah

1. **Klik Regenerate**:
   - Pengguna mengklik tombol "Regenerate" pada TaskItem tertentu.

2. **Cek Regenerate Limit**:
   - Cek `TaskItem.regenerate_count`
   - Jika >= 5 → Tampilkan alert "Regenerate limit reached (max 5 per question)"
   - Jika < 5 → Lanjut ke quota check

3. **Cek Daily Quota** (Server-Side):
   - API route checks `User.daily_usage_count`
   - Reset if `last_usage_date !== today`
   - If FREE tier and count >= 5 → Alert "Daily quota exceeded, cannot regenerate"
   - If within quota → Proceed

4. **Input Instruksi (Opsional)**:
   - Muncul text input untuk "Instruksi Perbaikan"
   - Pengguna bisa kosongkan atau isi perbaikan spesifik
   - Contoh: "Jawab lebih singkat", "Tambahkan contoh kasus"

5. **Build Context Payload**:
   ```
   [Original Question] + 
   [Previous Search Results (preserved)] + 
   [Last Answer] + 
   [Regenerate Instructions]
   ```

6. **Call DeepSeek (Revision Mode)**:
   - Kirim request dengan prompt override:
     - AI instructed untuk revise bukan membuat baru
     - Preserve context dan fix specific issues

7. **Stream New Answer**:
   - Tampilkan streaming response seperti Step 3

8. **Update Database (Atomic Transaction)**:
   - Increment `TaskItem.regenerate_count`
   - Increment `User.daily_usage_count` (counts toward quota)
   - Update `answer_text` dengan jawaban baru
   - Update `TaskSession.regenerate_count` (total)

#### Titik Keputusan

| Titik | Kondisi | Tindakan |
|-------|---------|----------|
| DC-REGEN-01 | Regenerate limit reached (>=5) | Block, show alert |
| DC-REGEN-02 | Daily quota exceeded (FREE >=5) | Block, show quota alert |
| DC-REGEN-03 | Within both limits | Proceed to regenerate |
| DC-REGEN-04 | Instruction provided | Include in prompt |
| DC-REGEN-05 | No instruction | Use default revision prompt |
| DC-REGEN-06 | Success | Update DB, increment quota, display new answer |
| DC-REGEN-07 | Failed | Show error, allow retry (doesn't count toward quota) |

#### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `RegenerateButton` | `/components/task/regenerate-button.tsx` | Trigger regenerate |
| `RegenerateModal` | `/components/task/regenerate-modal.tsx` | Input instructions |
| `RegenerateCounter` | `/components/task/regenerate-counter.tsx` | Show remaining |

---

### 4.7 PDF Generation Flow

#### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PDF GENERATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Klik      │      │   Load      │      │   Select   │      │   Load     │
   │   "Download │ ───▶ │   Session   │ ───▶ │   Template │ ───▶ │   Font     │
   │   PDF"      │      │   Data      │      │   (A or B) │      │   (User's)  │
   │             │      │             │      │             │      │             │
   └─────────────┘      └─────────────┘      └─────────────┘      └──────┬──────┘
                                                                          │
   ┌─────────────────────────────────────────────────────────────────────┐   │
   │                       TEMPLATE SELECTION                             │   │
   │                                                                       │   │
   │   ┌─────────────────────────┐    ┌─────────────────────────┐       │   │
   │   │     TEMPLATE A          │    │      TEMPLATE B         │       │   │
   │   │     (Discussion)        │    │   (Assignment/Makalah)  │       │   │
   │   │                         │    │                         │       │   │
   │   │  • Salam pembuka        │    │  • Cover Page           │       │   │
   │   │  • Body jawaban         │    │  • Daftar soal          │       │   │
   │   │  • Penutup              │    │  • Jawaban per soal     │       │   │
   │   │  • References           │    │    (new page each)     │       │   │
   │   │                         │    │  • References           │       │   │
   │   └─────────────────────────┘    └─────────────────────────┘       │   │
   └─────────────────────────────────────────────────────────────────────┘   │
                                                                          │
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
   │   Render    │ ───▶ │   Generate  │ ───▶ │   Download  │◀───────────┘
   │   PDF       │      │   (react-   │      │   File      │
   │   (Server)  │      │   pdf)      │      │             │
   └─────────────┘      └─────────────┘      └─────────────┘

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                         PDF RENDERING PROCESS                               │
   └─────────────────────────────────────────────────────────────────────────────┘

   ┌────────────────────────────────┐  ┌────────────────────────────────────────┐
   │        Cover Page              │  │           Page Structure               │
   │  (Template B only)             │  │                                        │
   │                                │  │  ┌──────────────────────────────────┐  │
   │  TUGAS TUTORIAL                │  │  │                                  │  │
   │  MATA KULIAH: [Nama MK]        │  │  │  Page Size: A4                   │  │
   │  [University Logo]             │  │  │  Margin: 2.5cm (all sides)      │  │
   │  TUTOR: [Nama Tutor]           │  │  │  Font: Arial (user uploaded)     │  │
   │  DISUSUN OLEH: [Nama] | [NIM]  │  │  │  Font Size: 12pt (body)           │  │
   │  [Prodi] | [Fak] | [UPBJJ]     │  │  │  Font Size: 14pt (headers)        │  │
   │  [Universitas]                 │  │  │  Line Height: 1.15                │  │
   └────────────────────────────────┘  │  │                                  │  │
                                      │  └──────────────────────────────────┘  │
                                      └────────────────────────────────────────┘
```

#### Narasi Langkah Demi Langkah

1. **Klik Download PDF**:
   - Pengguna mengklik tombol "Download PDF".

2. **Load Session Data**:
   - Ambil TaskSession, TaskItems, StudentProfile, Course dari database.

3. **Pilih Template**:
   - Berdasarkan `task_type`:
     - `DISCUSSION` → Template A
     - `ASSIGNMENT` → Template B

4. **Load User Font**:
   - Ambil `pdf_font_url` dari StudentProfile
   - Register font ke @react-pdf/renderer

5. **Render PDF (Server-side)**:
   - Gunakan @react-pdf/renderer
   - Generate document sesuai template

6. **Download File**:
   - Browser mendownload file PDF
   - Naming convention: `Tugas_[Type]_[Course]_[Date].pdf`

#### Template Details

**Template A: Tugas Diskusi**

| Section | Content |
|---------|---------|
| Salam Pembuka | 1-2 kalimat, natural, variasi waktu |
| Body | Paragraf naratif, argumentasi bertahap |
| Penutup | 1-2 kalimat simpulan |
| References | 2 items (module + journal/book) |

**Template B: TugasSoal/Makalah**

| Page | Content |
|------|---------|
| Page 1 | Cover dengan logo, tutor, student info |
| Page 2 | Daftar semua soal |
| Page 3+ | Jawaban per soal (force new page) |

#### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `PDFGenerator` | `/lib/pdf.ts` | PDF generation logic |
| `DiscussionTemplate` | `/components/pdf/discussion-template.tsx` | Template A |
| `AssignmentTemplate` | `/components/pdf/assignment-template.tsx` | Template B |
| `CoverPage` | `/components/pdf/cover-page.tsx` | Cover page component |

---

### 4.8 Settings Page Flow

#### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SETTINGS PAGE FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Klik      │      │   Tampilkan │      │   User      │      │    Edit     │
   │   Menu      │ ───▶ │   Settings  │ ───▶ │   dapat     │ ───▶ │    Field    │
   │   Settings  │      │   Page      │      │   ubah:     │      │    yang     │
   │             │      │             │      │             │      │    diinginkan│
   └─────────────┘      └─────────────┘      └──────┬──────┘      └──────┬──────┘
                                                    │                    │
   ┌─────────────┐      ┌─────────────┐            │                    │
   │   Update    │◀───  │  Validasi   │◀────────────┘                    │
   │   Database  │      │   Input     │                                  │
   └──────┬──────┘      └─────────────┘                                  │
          │                                                             │
          ▼                                                             │
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
   │   Success   │ ───▶ │   Refresh   │ ───▶ │   Tampilkan │
   │   (Toast)   │      │   Data      │      │   Updated   │
   │             │      │             │      │   Profile   │
   └─────────────┘      └─────────────┘      └─────────────┘

   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                         EDITABLE FIELDS                                     │
   └─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │   Nama      │  │   Upload    │  │   Default   │  │   Change    │
   │   Lengkap   │  │   Ulang     │  │   Min       │  │   Password  │
   │             │  │   Logo/Font │  │   Words     │  │   (Optional)│
   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

#### Narasi Langkah Demi Langkah

1. **Akses Settings**: Pengguna mengklik menu "Settings" di sidebar.

2. **Tampilkan Halaman Settings**: load data profile dari `StudentProfile`.

3. **Edit Fields**:
   - Nama Lengkap, NIM, Universitas, Fakultas, Prodi, UPBJJ
   - Upload ulang Logo (jika ingin ganti)
   - Upload ulang Font (jika ingin ganti)
   - Default Min Words

4. **Simpan Perubahan**:
   - Klik tombol "Simpan Perubahan".
   - Validasi input.
   - Update ke database.
   - Tampilkan toast success.

#### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `SettingsPage` | `/app/(student)/settings/page.tsx` | Main settings page |
| `ProfileForm` | `/components/settings/profile-form.tsx` | Edit profile form |
| `FileUpload` | `/components/ui/file-upload.tsx` | Logo/font upload |

---

### 4.9 Logout Flow

#### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LOGOUT FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
    │   Klik      │      │   Call      │      │   Invalidate│      │   Redirect  │
    │   Logout    │ ───▶ │   /api/auth │ ───▶ │   Session   │ ───▶ │   to Login  │
    │   Button    │      │   /signout  │      │   (NextAuth)│      │   Page      │
    │             │      │             │      │             │      │             │
    └─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
```

#### Narasi Langkah Demi Langkah

1. **Klik Logout Button**:
   - Pengguna mengklik menu "Logout" di sidebar/header.

2. **Call Signout API**:
   - Client redirects ke `/api/auth/signout` (NextAuth built-in route).
   - Alternatively, custom API endpoint `/api/user/logout` could be implemented.

3. **Session Invalidation**:
   - NextAuth menghapus JWT session cookie.
   - Session token invalidated.

4. **Redirect to Login**:
   - Browser redirect ke `/login` page.
   - User sees login form.

#### Referensi Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `LogoutButton` | `/components/layout/logout-button.tsx` | Logout button in sidebar/header |
| `NextAuth Signout` | `/api/auth/signout` | Built-in NextAuth signout route |

---

### 4.10 In-App Notification (Data Purge Warning)

#### Diagram Alur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      IN-APP PURGE WARNING BANNER                              │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
    │   Login     │      │   Check     │      │   Show      │      │   User      │
    │   Success   │ ───▶ │   Purge     │ ───▶ │   Warning   │ ───▶ │   Action    │
    │             │      │   Warning   │      │   Banner    │      │             │
    └─────────────┘      └──────┬──────┘      └─────────────┘      └──────┬──────┘
                               │                                          │
                      ┌────────┴────────┐                         ┌────────┴────────┐
                      │                 │                         │                 │
                      ▼                 ▼                         ▼                 ▼
               ┌───────────┐    ┌───────────┐              ┌───────────┐    ┌───────────┐
               │  Warning  │    │   No      │              │ Download  │    │  Dismiss  │
               │  Needed   │    │   Warning │              │   PDFs    │    │  Banner   │
               │  (Show)   │    │           │              │           │    │           │
               └───────────┘    └───────────┘              └───────────┘    └───────────┘
```

#### Narasi Langkah Demi Langkah

1. **Login Success**: User login dan redirect ke dashboard.

2. **Check Purge Warning**:
   - Query oldest TaskSession untuk user.
   - If created_at < 11 months ago → Show warning banner.
   - Warning message: "Your old task data (older than 11 months) will be deleted in 30 days. Download your PDFs now."

3. **Warning Banner Display**:
   - Banner appears at top of dashboard.
   - Shows countdown: "X days until purge"
   - Includes "Download All PDFs" button.
   - Includes "Dismiss" button (stores in localStorage).

4. **User Actions**:
   - **Download All PDFs**: Generate and download PDFs for all old sessions.
   - **Dismiss**: Hide banner (remembered for 7 days in localStorage).
   - **No Email**: Notification is in-app only, no email service.

---

## 5. State Management Summary

### 5.1 User State Transitions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER STATE TRANSITIONS                               │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────┐
                                    │    CREATED      │
                                    │ (by Admin)      │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   LOGGED_IN     │
                                    │ (NextAuth)      │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
           ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
           │ Profile EXISTS │     │ Profile EMPTY   │     │    ERROR        │
           │                 │     │                 │     │                 │
           └────────┬────────┘     └────────┬────────┘     └────────┬────────┘
                    │                        │                        │
                    ▼                        ▼                        ▼
           ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
           │  /dashboard     │     │  /onboarding    │     │    Retry        │
           │  (Student View) │     │  (Wajib Complete)│     │    Login        │
           └─────────────────┘     └────────┬────────┘     └─────────────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │  ONBOARDED      │
                                   └────────┬────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │  /dashboard     │
                                   │  (Full Access)  │
                                   └─────────────────┘
```

### 5.2 Task Session State Transitions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TASK SESSION STATE TRANSITIONS                          │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────┐
                                    │   Step 1        │
                                    │   (Input)       │
                                    └────────┬────────┘
                                             │ Valid & Proceed
                                             ▼
                                    ┌─────────────────┐
                                    │   Step 2        │
                                    │   (Processing)  │
                                    └────────┬────────┘
                                             │ Complete
                                             ▼
                                    ┌─────────────────┐
                                    │   Step 3        │
                                    │   (Result)      │
                                    └────────┬────────┘
                                             │
          ┌─────────────────────────────────┼─────────────────────────────────┐
          │                                 │                                 │
          ▼                                 ▼                                 ▼
   ┌─────────────┐                 ┌─────────────────┐              ┌─────────────┐
   │ Regenerate  │                 │    Download     │              │    Back     │
   │             │                 │    PDF          │              │    to       │
   │ (Loop)      │                 │    (One-time)   │              │    Dashboard│
   └─────────────┘                 └─────────────────┘              └─────────────┘
```

### 5.3 TaskItem Status

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TASK ITEM STATUS FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   Initial   │ ───▶ │  GENERATING │ ───▶ │  COMPLETED  │
   │   State     │      │             │      │             │
   └─────────────┘      └──────┬──────┘      └──────┬──────┘
                               │                    │
                               │ Error              │ User clicks "Save Draft"
                               │                    │
                               ▼                    ▼
                        ┌─────────────┐      ┌─────────────┐
                        │   FAILED    │      │   DRAFT     │
                        └─────────────┘      │  (Optional) │
                                             └─────────────┘

Status Descriptions:
- GENERATING: Answer being generated (streaming in progress)
- COMPLETED: Answer successfully generated and saved
- FAILED: Generation failed after retries (user can retry)
- DRAFT: User saved as draft for later review (not final submission)
```

---

## 6. Error Handling Summary

### 6.1 Error by Flow

| Flow | Error Code | User Message | Recovery Action |
|------|------------|--------------|-----------------|
| Login | ERR-STUD-001 | "Username atau password salah" | Retry dengan kredensial benar |
| Login | ERR-STUD-002 | "Session expired, silakan login ulang" | Redirect ke login |
| Admin Login | ERR-ADMIN-LOCK | "Account locked, try again in X minutes" | Wait for lock duration |
| Onboarding | ERR-ONBOARD-005 | "Gagal menyimpan profil" | Retry atau hubungi admin |
| Step 1 OCR | ERR-STEP1-002 | "OCR gagal, retry atau input manual" | Retry / Manual input |
| Step 1 Quota | ERR-STEP1-001 | "Daily quota exceeded, upgrade ke Premium" | Upgrade / Wait tomorrow |
| Step 2 Search | ERR-STEP2-001 | "Pencarian referensi gagal" | Retry atau coba lagi nanti |
| Step 2 LLM | ERR-STEP2-002 | "Tidak dapat terhubung ke AI" | Retry |
| Step 2 Search | ERR-STEP2-004 | "Both search APIs failed" | Retry (no fallback scraper) |
| Regenerate | ERR-REGEN-01 | "Regenerate limit reached (max 5)" | None (limit reached) |
| Regenerate | ERR-REGEN-02 | "Daily quota exceeded" | Wait tomorrow / Upgrade |
| PDF | ERR-PDF-001 | "Gagal generate PDF" | Retry |

### 6.2 API Error Handling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API ERROR HANDLING                                  │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌────────────────────────────────┐  ┌────────────────────────────────────────┐
   │         DeepSeek API           │  │           Tavily API                   │
   ├────────────────────────────────┤  ├────────────────────────────────────────┤
   │ Max Retry: 3                  │  │ Max Retry: 2                          │
   │ Delay: 2s                     │  │ Delay: 1s                             │
   │ Fallback: Mark FAILED         │  │ Fallback: Use Exa only                │
   └────────────────────────────────┘  └────────────────────────────────────────┘

   ┌────────────────────────────────┐  ┌────────────────────────────────────────┐
   │          Exa API              │  │          OCR (Tesseract.js)            │
   ├────────────────────────────────┤  ├────────────────────────────────────────┤
   │ Max Retry: 2                  │  │ Max Retry: 1                          │
   │ Delay: 1s                     │  │ Delay: 0s                             │
   │ Fallback: Use Tavily only     │  │ Fallback: Manual input                │
   └────────────────────────────────┘  └────────────────────────────────────────┘
```

---

## 7. Middleware & Security Flow

### 7.1 Authentication Middleware

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION MIDDLEWARE                              │
└─────────────────────────────────────────────────────────────────────────────┘

   Request to Protected Route
              │
              ▼
   ┌─────────────────────┐
   │  Check Session      │
   │  (NextAuth)         │
   └──────────┬──────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌────────┐         ┌────────┐
│ Valid  │         │ Invalid│
│ Session│         │ / None │
└───┬────┘         └───┬────┘
    │                  │
    ▼                  ▼
┌──────────────┐  ┌──────────────┐
│ Check Role   │  │ Redirect to  │
│ & Profile    │  │ /login       │
└──────┬───────┘  └──────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│                                                    │
│  IF ADMIN:   /admin/*                              │
│  IF STUDENT:                                       │
│     └── Profile exists → /dashboard                 │
│     └── Profile empty   → /onboarding              │
│                                                    │
└──────────────────────────────────────────────────────┘
```

---

## 8. Appendix: Route Map

### 8.1 Public Routes

| Route | Akses | Deskripsi |
|-------|-------|-----------|
| `/` | All | Landing page tanpa auth |
| `/login` | All | Halaman login |
| `/api/auth/*` | All | NextAuth API routes |

### 8.2 Protected Routes - Admin

| Route | Akses | Deskripsi |
|-------|-------|-----------|
| `/admin` | ADMIN | Dashboard admin |
| `/admin/users` | ADMIN | Manajemen user |
| `/admin/analytics` | ADMIN | API cost tracking |
| `/admin/system` | ADMIN | System health |

### 8.3 Protected Routes - Student

| Route | Akses | Deskripsi |
|-------|-------|-----------|
| `/onboarding` | STUDENT (tanpa profile) | Setup profile wajib |
| `/dashboard` | STUDENT (dengan profile) | Main dashboard |
| `/task/new` | STUDENT | 3-step wizard |
| `/task/[id]` | STUDENT | View result |
| `/courses` | STUDENT | Manage courses |
| `/settings` | STUDENT | Edit profile |

---

**Dokumen ini merupakan bagian dari dokumentasi teknis NugAI dan harus diperbarui seiring dengan perkembangan aplikasi.**

---

**Versi Dokumen:** 2.0 (Revised after audit)
**Tanggal Pembuatan:** April 2026
**Penulis:** EAS Creative Studio
**Perubahan dari v1.0:**
- Font upload changed to OPTIONAL
- Quota check moved to server-side (transactional)
- Regenerate counts toward daily quota
- Added DRAFT status handling
- Added logout flow (Section 4.9)
- Added in-app notification for purge warning (Section 4.10)
- Added admin login rate limiting
- Added admin password reset flow
- Removed search API fallback scraper
- Updated error codes registry
- Added snapshot fields for course data preservation
