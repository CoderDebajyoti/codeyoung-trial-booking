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

## ⚙️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript (strict), Tailwind CSS, Lucide icons, date-fns, date-fns-tz.
- **Backend**: Node.js (v20+), Express, TypeScript (strict), Prisma ORM, PostgreSQL, Zod, date-fns, date-fns-tz.
- **Testing**: Vitest, Supertest, React Testing Library, JSDOM (55 automated unit & integration tests).
- **Email**: Testable email service adapter with mock & Mailpit / SMTP support.

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
npm run dev
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

## 📧 Email Notifications & Inspection

The backend implements a testable email service supporting both **Mock** (in-memory) and **SMTP / Mailpit** transports.

When a booking is confirmed:
1. **Parent Email**: Formatted with the class time in the **parent's local time zone**, course title, assigned mentor name, booking reference ID, and live class URL.
2. **Mentor Notification Email**: Formatted with the class time in the **mentor's local time zone**, parent/student details, booking reference ID, and live class URL.

### Inspecting Sent Emails
In development and test environments, inspect recently dispatched confirmation emails via:
- `GET http://localhost:4000/api/emails/recent`

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

## 🔒 Security & Quality Standards

- **Zero Secret Exposure**: No credentials or database passwords committed.
- **CORS Restricted**: Allowed origins restricted to frontend URLs with credentials enabled.
- **Idempotency Protection**: Repeated booking POSTs with identical idempotency keys return the existing booking safely without creating duplicate slots or duplicate emails.
- **No Stack Traces**: Error middleware returns structured JSON error messages without exposing backend call stacks to clients.