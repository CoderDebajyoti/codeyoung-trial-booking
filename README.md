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

## 🚀 Getting Started & Local Development (Windows)

**Important:** `npm run dev` starts a development server; it does not start PostgreSQL. Start PostgreSQL first, then the backend, then the frontend. Open two separate terminals for the app servers and keep both running.

### Prerequisites

- Node.js 20 or newer and npm 10 or newer.
- PostgreSQL 14+ installed and running locally, **or Docker Desktop**.
- Git (optional, if you cloned this repository already).

### Step 1 — Start PostgreSQL

Choose **one** option.

**Option A: Docker Desktop (quickest if Docker is installed)**

Run this in PowerShell or a terminal:

```powershell
docker run --name codeyoung-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=codeyoung_booking -p 5432:5432 -d postgres:16
```

If the container already exists, start it instead of creating it again:

```powershell
docker start codeyoung-postgres
```

Check that it is running:

```powershell
docker ps
docker exec -it codeyoung-postgres pg_isready -U postgres -d codeyoung_booking
```

Expected result from the second command includes `accepting connections`.

**Option B: PostgreSQL installed on Windows**

1. Open Windows **Services** and start the PostgreSQL service (the name often includes the installed version).
2. Confirm the service is running and PostgreSQL listens on port `5432`.
3. In pgAdmin or psql, create a database named `codeyoung_booking` if it does not already exist.
4. Make sure the database username/password match the connection URL you will put in `backend/.env`.

### Step 2 — Configure the backend database URL

Open a terminal at the repository root, then run:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

If either destination already exists, PowerShell may ask to overwrite it. Preserve your existing real email settings; do not overwrite a working `.env` without copying its values first.

Open `backend/.env` and set `DATABASE_URL` to match your PostgreSQL setup. For the Docker command above, use:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/codeyoung_booking?schema=public"
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

This example is for **local development only**. If you chose a different PostgreSQL password, username, port, or database name, update the URL to match. Never commit `backend/.env` or put database credentials in frontend environment variables.

Open `frontend/.env` and confirm it contains:

```env
VITE_API_URL=http://localhost:4000/api
```

The frontend URL must point to the backend API, not directly to PostgreSQL. Restart Vite after changing any `VITE_*` environment variable.

### Step 3 — Install dependencies

From the repository root, run:

```powershell
cd backend
npm install
```

Then:

```powershell
cd ../frontend
npm install
```

### Step 4 — Create database tables and seed mentors

Make sure PostgreSQL is running and `backend/.env` has the correct `DATABASE_URL`. Then:

```powershell
cd ../backend
npx prisma generate
npx prisma db push
npm run prisma:seed
```

What these commands do:
- `prisma generate` generates the Prisma client.
- `prisma db push` creates/updates tables to match `backend/prisma/schema.prisma`.
- `npm run prisma:seed` inserts or updates the sample mentors.

You should see the seed script report that seeding completed. If Prisma reports `P1000`, check the database username/password. If it reports `P1001`, check that PostgreSQL is running and the host/port are reachable. If it reports that the database does not exist, create `codeyoung_booking` or correct the URL.

### Step 5 — Start the backend

In **Terminal 1**:

```powershell
cd backend
npm run dev
```

Wait until the backend reports that it is running on port `4000`. Keep this terminal open.

Verify it in a browser at [http://localhost:4000/api/health](http://localhost:4000/api/health). You should receive a JSON health response. If the browser cannot connect, read the backend terminal for the first error before proceeding.

### Step 6 — Start the frontend

Open **Terminal 2** (leave Terminal 1 running):

```powershell
cd frontend
npm run dev
```

Open the exact local URL printed by Vite, normally [http://localhost:5173](http://localhost:5173).

### Step 7 — Confirm the API and database work

Open these URLs in a browser:

1. [http://localhost:4000/api/health](http://localhost:4000/api/health) — backend is reachable.
2. [http://localhost:4000/api/mentors](http://localhost:4000/api/mentors) — API should return the seeded mentors.
3. [http://localhost:4000/api/slots?date=2026-10-12&timeZone=Asia%2FKolkata](http://localhost:4000/api/slots?date=2026-10-12&timeZone=Asia%2FKolkata) — API should return a JSON slots response; availability depends on seeded mentor schedules and bookings.

If the health endpoint works but mentors/slots fail, inspect the **backend terminal** and the response body from the failing API. If the API works in the browser but the frontend says “Failed to fetch,” check `frontend/.env`, CORS, and the browser DevTools **Network** tab. Confirm requests go to `http://localhost:4000/api/...`, not an old deployed URL.

**Important data note:** the repository contains a fail-safe in-memory fallback for some database failures. A page may appear to work while data is not being persisted in PostgreSQL. For this database verification, do not consider the setup complete until PostgreSQL is running, Prisma setup and seeding succeed, and the API returns the expected data.

### Quick commands from the repository root

The root package scripts can start each server in a separate terminal:

```powershell
npm run dev:backend
npm run dev:frontend
```

Do not run both in the same terminal unless you use a process manager. Alternatively, use the `cd backend` / `cd frontend` commands above.


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

### “Failed to fetch available slots” / “Failed to fetch mentors”

1. Check that PostgreSQL is running and `backend/.env` has a valid `DATABASE_URL`.
2. Check the backend terminal for Prisma errors.
3. Open `http://localhost:4000/api/health` and `http://localhost:4000/api/mentors` directly.
4. In browser DevTools → **Network**, inspect the failed request URL, status code, and response. The frontend should call `http://localhost:4000/api/...` for local development.
5. Confirm `frontend/.env` contains `VITE_API_URL=http://localhost:4000/api`, then stop and restart the frontend dev server.
6. Confirm the backend is running on port `4000` and the frontend on port `5173`. If a port is already in use, stop the other process or update the corresponding configuration consistently.

### Common PostgreSQL / Prisma errors

- **P1000 (authentication failed):** the username/password in `DATABASE_URL` is wrong.
- **P1001 (can't reach database server):** PostgreSQL/Docker is stopped, or host/port is wrong.
- **Database does not exist:** create `codeyoung_booking` or correct the database name in `DATABASE_URL`.
- **Missing tables / relation does not exist:** from the `backend` folder run `npx prisma generate`, then `npx prisma db push`, then `npm run prisma:seed`.
- **Frontend says fetch failed but the API URL works directly:** check CORS, the frontend's `VITE_API_URL`, and the browser Network/Console tabs.

Do not share or commit real `.env` files. When asking for help, share the error text with passwords, API keys, tokens, and personal data removed.

- **Timezone Abbreviations**: In Windows environments, `dateUtils.ts` automatically maps UTC offsets to standard regional abbreviations (`EST`, `EDT`, `BST`, `GMT`, `IST`).

---

## 🔒 Security & Quality Standards

- **Zero Secret Exposure**: No credentials or database passwords committed.
- **CORS Restricted**: Allowed origins restricted to frontend URLs with credentials enabled.
- **Idempotency Protection**: Repeated booking POSTs with identical idempotency keys return the existing booking safely without creating duplicate slots or duplicate emails.
- **No Stack Traces**: Error middleware returns structured JSON error messages without exposing backend call stacks to clients.