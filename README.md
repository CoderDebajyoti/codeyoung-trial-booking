# Codeyoung Trial Class Booking System

A production-ready, timezone-aware 1:1 appointment booking web application built for the Codeyoung 2027 recruitment assignment.

---

## 🏗️ Architecture & Project Structure

The repository is structured as a monorepo containing separate `frontend` and `backend` services.

```
codeyoung-trial-booking/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma schema for PostgreSQL
│   │   └── seed.ts                 # 10 seeded mentors across US, UK & India
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts              # Zod environment variable validation
│   │   ├── controllers/
│   │   │   ├── booking.controller.ts # Available slots & booking submission
│   │   │   ├── mentor.controller.ts  # Mentors list & mentor capacity schedule
│   │   │   ├── email.controller.ts   # Email audit & inspection
│   │   │   └── health.controller.ts  # Health check controller
│   │   ├── middleware/
│   │   │   └── errorHandler.ts     # Global error handling middleware
│   │   ├── repositories/           # Data access layer with fail-fast circuit breaker
│   │   │   ├── mentor.repository.ts
│   │   │   ├── parent.repository.ts
│   │   │   └── booking.repository.ts
│   │   ├── routes/                 # Express route definitions
│   │   ├── services/               # Business logic (capacity rules, matching, emails)
│   │   │   ├── booking.service.ts
│   │   │   ├── mentor.service.ts
│   │   │   └── email.service.ts
│   │   ├── lib/                    # Timezone utilities, date-fns helpers, fallback store
│   │   │   ├── dateUtils.ts
│   │   │   ├── prisma.ts
│   │   │   └── inMemoryStore.ts
│   │   ├── app.ts                  # Express application factory
│   │   └── server.ts               # Server startup entry point
│   ├── tests/
│   │   ├── unit/                   # Unit tests (dateUtils, timezoneDst, capacity, booking)
│   │   └── integration/            # Integration tests (health, api, email, concurrency)
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json               # Strict TypeScript config
│   └── vitest.config.ts
├── frontend/
│   ├── src/
│   │   ├── components/             # High-engagement booking UI components
│   │   │   ├── Navbar.tsx
│   │   │   ├── ParentDetailsForm.tsx (Screen A)
│   │   │   ├── SlotPicker.tsx        (Screen B)
│   │   │   ├── BookingConfirmation.tsx (Screen C)
│   │   │   └── MentorScheduleView.tsx  (Screen D)
│   │   ├── lib/
│   │   │   ├── api.ts              # Type-safe API client
│   │   │   ├── timezones.ts        # IANA timezones and detection
│   │   │   └── utils.ts            # Tailwind styling utilities
│   │   ├── App.tsx                 # Main layout & step-flow orchestrator
│   │   ├── index.css               # Tailwind tokens & global styling
│   │   └── main.tsx                # React DOM entry point
│   ├── tests/
│   │   ├── setup.ts
│   │   └── App.test.tsx            # Comprehensive React Testing Library tests
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json               # Strict TypeScript config
│   ├── vite.config.ts
│   └── vitest.config.ts
├── package.json                    # Root orchestration scripts
├── README.md
└── TRANSCRIPT.md                   # AI pair-programming audit log
```

---

## 🎨 Visual Identity & Design System

The application has been completely redesigned with a warm, golden-yellow-to-orange palette inspired by Codeyoung's primary brand identity:

### 1. Color Tokens (Zero Blue)
- **Primary Golden Yellow**: `#FFD45A`
- **Primary Gold**: `#FFC52E`
- **Golden Orange**: `#FFB82E`
- **Secondary Orange**: `#F28C28`
- **Warm Cream Background**: `#FFF8E8`
- **Pale Gold Surface**: `#FFF0D2`
- **Soft Gold Border**: `#F7E4B6`
- **Dark Brown Text**: `#713B18`
- **Deep Brown Emphasis**: `#843B13`
- **White**: `#FFFFFF`
- **Primary Gradient**: `linear-gradient(110deg, #FFD45A 0%, #FFC52E 55%, #FFB82E 100%)`

### 2. Buttons & Interactions
- **Primary CTA Buttons**: `rounded-[20px]`, `btn-primary-gradient`, bold dark brown text (`#713B18`), subtle warm shadow elevation (`0 4px 14px 0 rgba(242, 140, 40, 0.3)`), smooth hover lift (`translateY(-1px)`).
- **Secondary Actions**: `btn-warm-secondary` with `#FFF0D2` surface and `#F7E4B6` border.
- **Focus Rings**: Warm golden-orange focus rings (`focus:ring-[#FFD45A]/50`).

### 3. Typography Hierarchy
- **Headings & Display**: `Baloo 2` font family (bold, friendly, rounded display typography).
- **Body & Forms**: `Nunito Sans` font family.
- **Buttons**: `Nunito Sans` font weight 700-800.
- **Badges & Metadata**: `Nunito Sans` font weight 600-800 with high-contrast `#843B13` / `#713B18` text.

---

## ⚙️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript (strict), Tailwind CSS, Lucide icons, date-fns, date-fns-tz.
- **Backend**: Node.js (v20+), Express, TypeScript (strict), Prisma ORM, PostgreSQL, Zod, date-fns, date-fns-tz.
- **Testing**: Vitest, Supertest, React Testing Library, JSDOM (64 automated unit & integration tests).
- **Email**: Testable email service adapter with Resend, SMTP, Mailpit & Mock support.

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Node.js**: >= 20.x
- **npm**: >= 10.x
- **PostgreSQL**: Optional for local dev (built-in fail-safe repository store allows instant execution if PostgreSQL credentials are not yet configured).

### 1. Installation

Install all dependencies from the root monorepo:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

Copy the example environment files:

```bash
# Backend environment setup
cp backend/.env.example backend/.env

# Frontend environment setup
cp frontend/.env.example frontend/.env
```

### 3. Database Migration & Mentor Seeding (Optional if PostgreSQL running)

```bash
cd backend
npx prisma generate
npx prisma db push
npm run seed
```

### 4. Running Dev Servers

Run both servers in separate terminals or from root:

```bash
# Terminal 1: Run backend (Port 4000)
cd backend
npm run dev

# Terminal 2: Run frontend (Port 5173)
cd frontend
`npm run dev`
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing, Linting & Building

Run tests across both backend and frontend:

```bash
# Backend tests (49 unit & integration tests)
cd backend
npm test

# Frontend tests (6 integration tests)
cd frontend
npm test

# Run all tests across monorepo from root (55 tests)
npm test

# Linting (0 errors, 0 warnings)
npm run lint

# Production bundle builds
npm run build
```

---

## 🕒 Timezone & Daylight Saving Time (DST) Guarantees

The booking engine handles multi-region scheduling across **US (America/New_York, America/Chicago, America/Los_Angeles)**, **UK (Europe/London)**, and **India (Asia/Kolkata)**:

1. **Standardized Normalization & Canonical Identifiers**:
   - Centralized normalization utility converts legacy / alias time zones (such as `Asia/Calcutta` -> `Asia/Kolkata`, `US/Eastern` -> `America/New_York`) to canonical IANA identifiers for storage and UI displays.
   - Preserves 100% backward compatibility with existing records or bookings stored under legacy identifiers.
   - Calculates dynamic UTC offsets formatted as `UTC±HH:MM` (e.g. `Kolkata, India (Asia/Kolkata · UTC+05:30)`).

2. **UTC Instant Persistence**:
   - Every appointment is converted to an absolute UTC timestamp and persisted in PostgreSQL as `TIMESTAMPTZ` (`startAt`, `endAt`).
   - The parent's and mentor's IANA time-zone identifiers are preserved alongside the booking record.

3. **Accurate Seasonal Offsets & Local Formatting**:
   - Converts UTC instants dynamically using IANA time-zone rules and `date-fns-tz`.
   - Never relies on hardcoded UTC offsets. Accurately handles seasonal changes (e.g., India is +9.5h ahead of New York during EDT and +10.5h ahead during EST).

3. **Strict DST Gap & Overlap Validation**:
   - **Spring-Forward Gap (Nonexistent Times)**: Local time strings falling in the skipped hour (e.g., `2026-03-08 02:30` in New York or `2026-03-29 01:30` in London) are detected and rejected with a clear validation error.
   - **Fall-Back Overlap (Ambiguous Times)**: Ambiguous local times during the repeated hour (e.g., `2026-11-01 01:30` in New York or `2026-10-25 01:30` in London) require explicit ISO 8601 UTC instants to avoid scheduling errors.

4. **Mentor-Local Daily Capacity (2 Classes/Day Rule)**:
   - Capacity is calculated from midnight to midnight in the **mentor's local time zone**, not the parent's time zone or UTC date.
   - The boundary interval `[startOfDayUtc, endOfDayUtc]` is computed for the mentor's local calendar day and queried within a transactional row-lock (`SELECT ... FOR UPDATE ORDER BY id ASC`).
   - Cancelled bookings do not consume capacity.

---

## 📧 Real Email Delivery & Automatic Class Reminders

The backend incorporates a **durable PostgreSQL outbox queue** and multi-provider email dispatch engine supporting **Resend**, **SMTP (Gmail App Passwords, SendGrid, AWS SES, Mailgun)**, **Mailpit**, and **Mock/Test** transports.

### Outbox & Deduplication Architecture
1. **Durable Persistence**: All notifications (parent booking confirmation, mentor notification, parent 30-min reminder, mentor 30-min reminder) are saved to the `notifications` table before transmission.
2. **Mathematical Deduplication**: Unique constraint `@@unique([bookingId, type])` guarantees that concurrent worker runs or idempotent retries never send duplicate emails.
3. **Recipient Local Time Formatting**: Every email body is localized using that recipient's specific IANA time zone (e.g. EDT for parent, IST for mentor) with meeting links and booking references.
4. **Durable 30-Minute Reminders**: Reminders are scheduled at `booking.startAt - 30 minutes`. The background worker polls the outbox every 10 seconds and automatically delivers due reminders. If a class is created `< 30 mins` before starting, past reminders are skipped.
5. **Worker Retries & Circuit Breaker**: Failed attempts are recorded with the provider error reason, retried with exponential backoff (up to 3 attempts), and marked `FAILED` if exceeded.
6. **Cancellation Handling**: If a booking is cancelled, pending reminders are immediately marked `FAILED` (`Cancelled: Booking was cancelled`).

---

### Step-by-Step Provider Setup Guide

#### Option 1: Resend (Recommended for Production & Cloud Deployments)
1. **Create Account**: Sign up at [https://resend.com](https://resend.com).
2. **Obtain API Key**: Go to **API Keys** -> **Create API Key** with Full Access permissions.
3. **Verify Domain**: Add and verify your domain in the Resend Domains dashboard (or for development/testing without a custom domain, use `onboarding@resend.dev` as `EMAIL_FROM` to send to your verified account email).
4. **Configure `backend/.env`**:
   ```env
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_123456789abcdef...
   EMAIL_FROM="Codeyoung Trial <trial@yourdomain.com>"
   ```
5. **Verify Delivery**:
   ```bash
   cd backend
   npm run test:email -- --to=your-email@example.com
   ```

#### Option 2: Gmail SMTP (with App Password)
1. **Enable 2-Step Verification**: Go to your Google Account settings -> Security -> 2-Step Verification.
2. **Generate App Password**: Go to **Security** -> **2-Step Verification** -> **App passwords** (at bottom). Create an app named "Codeyoung Booking" and copy the 16-character generated password.
3. **Configure `backend/.env`**:
   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your-account@gmail.com
   SMTP_PASS=xxxx-xxxx-xxxx-xxxx
   EMAIL_FROM="Codeyoung <your-account@gmail.com>"
   ```
4. **Verify Delivery**:
   ```bash
   cd backend
   npm run test:email -- --to=your-email@example.com
   ```

#### Option 3: SendGrid / Mailgun / AWS SES SMTP
1. **SendGrid**: Host: `smtp.sendgrid.net`, Port: `587`, User: `apikey`, Pass: `SG.your_api_key`.
2. **AWS SES**: Host: `email-smtp.us-east-1.amazonaws.com`, Port: `587`, User: `SES_SMTP_USER`, Pass: `SES_SMTP_PASS`.

#### Option 4: Local Development & Mailpit / Mock
- **Mock Mode**: Set `EMAIL_PROVIDER=mock`. Dispatches to memory and audit logs without external network requests.
- **Mailpit**: Run Mailpit locally on port 1025, set `EMAIL_PROVIDER=mailpit`. Inspect at `http://localhost:8025`.

---

### Observability & Notification API Endpoints
- `GET /api/notifications/recent` - View outbox state, delivery status (`PENDING`, `ACCEPTED`, `FAILED`), attempt count, and last error.
- `GET /api/notifications/booking/:bookingId` - View all notifications (confirmations & reminders) tied to a specific booking reference.
- `GET /api/notifications/verify-config` - Health-check the active email provider connection.
- `POST /api/notifications/process-outbox` - Trigger manual outbox flush.
- `GET /api/emails/recent` - View dispatched in-memory audit logs.

---

## 📡 API Endpoints Reference

### 1. Health Check
- `GET /api/health`
- Response: `{ status: "ok", timestamp: "...", uptime: 123.45 }`

### 2. List Mentors
- `GET /api/mentors`
- Response: Returns all 10 active mentors with working hours and time zones.

### 3. Query Available Slots
- `GET /api/slots?date=2026-10-12&timeZone=America/New_York`
- Query Parameters: `date` (YYYY-MM-DD), `timeZone` (IANA identifier)
- Response: Returns available 30-minute slots with open mentor counts.

### 4. Create Booking (Concurrency-Safe)
- `POST /api/bookings`
- Body:
```json
{
  "parentName": "Eleanor Vance",
  "parentEmail": "eleanor.vance@example.com",
  "parentPhone": "+1 555 432 9876",
  "course": "Python Programming & AI Basics",
  "parentTimeZone": "America/New_York",
  "startAt": "2026-10-12T13:00:00.000Z",
  "idempotencyKey": "idem-unique-key-123"
}
```
- Status: `201 Created` (or `409 Conflict` with alternative slot recommendations).

### 5. View Mentor Daily Schedule
- `GET /api/mentors/:id/schedule?date=2026-10-12`
- Response: Returns mentor-local capacity breakdown (`confirmedClassesCount`, `maxDailyClasses: 2`, `isFullyBooked`) and scheduled bookings.

### 6. Recent Emails Audit
- `GET /api/emails/recent`
- Response: Returns recent mock/sent confirmation emails.

---

## 🛠️ Troubleshooting

- **Slot Fetching Delays / DB Connection Issues**: The backend uses an automated circuit-breaker in the repository layer. If PostgreSQL credentials fail or PostgreSQL is not running, the application fails fast to the in-memory fallback store without hanging on connection timeouts.
- **Port Conflicts**: Ensure port `4000` (backend) and port `5173` (frontend) are free before launching dev servers.
- **Timezone Abbreviations**: In Windows environments, `dateUtils.ts` automatically maps UTC offsets to standard regional abbreviations (`EST`, `EDT`, `BST`, `GMT`, `IST`).

---

---

## 🔒 Security, Bot Protection & Access Control

The application implements defense-in-depth security measures to protect student data, prevent automated spam, and enforce strict role-based access control:

### 1. Public Booking Bot Protection (Cloudflare Turnstile)
- Public booking submissions (`POST /api/bookings`) and authentication endpoints are protected against automated scripts and credential-stuffing bots.
- Configurable via `CAPTCHA_ENABLED` and `TURNSTILE_SECRET_KEY`. Fails closed if verification fails.
- Local developer and automated test runs use standard test bypass keys without weakening production security.

### 2. Parent Email OTP Verification
- Prevents invalid or fraudulent email entries before confirming trial classes.
- Generates cryptographically secure 6-digit numeric OTPs via `crypto.randomInt`.
- Stores only salted SHA-256 hashes with a **5-minute expiry**.
- Enforces a **60-second resend cooldown** and locks after **3 failed attempts**.
- Upon verification, issues a short-lived signed JWT `verificationToken` and deletes the OTP code to prevent replay attacks.
- Dispatches codes using the existing email provider (Resend, SMTP, Mailpit, Mock).

### 3. Mentor & Administrator RBAC
- **Mentor Accounts**: Company-created credentials with bcrypt password hashing (10 rounds). Mentors are restricted to viewing only their own assigned schedule and capacity (`/api/mentors/:id/schedule`).
- **Administrator Role**: Administrators (`admin@codeyoung.com`) can audit all mentor schedules and manage the notification outbox.
- **Generic Error Responses**: Login failures return generic messages (`Invalid email address or password`) to prevent account enumeration.

### 4. Rate Limiting & Resource Exhaustion Protection
- **Global API Rate Limiter**: 120 requests/minute per client IP.
- **Login Limiter**: 5 attempts per 15 minutes per IP/email.
- **OTP Send Limiter**: 3 requests per 10 minutes per email.
- **OTP Verify Limiter**: 5 attempts per 15 minutes per email.
- **Booking Limiter**: 10 trial bookings per hour per client IP.
- **Payload Size Limits**: Express body parser restricted to `50kb` to prevent memory exhaustion DoS attacks.
- **Safe Error Handling**: Call stacks and internal database queries are stripped from production API responses.

---

## 🔒 Security & Quality Standards

- **Zero Secret Exposure**: No credentials or database passwords committed.
- **CORS Restricted**: Allowed origins restricted to frontend URLs with credentials enabled.
- **Idempotency Protection**: Repeated booking POSTs with identical idempotency keys return the existing booking safely without creating duplicate slots or duplicate emails.
- **No Stack Traces**: Error middleware returns structured JSON error messages without exposing backend call stacks to clients.