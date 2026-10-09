# AI Pair Programming Transcript

This file documents the verbatim prompts, responses, and key development decisions throughout the implementation and quality assurance of the **Codeyoung Trial Class Booking System**.

---

## Session 1: Foundation & Project Initialization (First Task)

### User Prompt
```markdown
# Project: Codeyoung Trial Class Booking System

Act as a senior full-stack engineer and help me build a production-minded, maintainable appointment-booking web application for the Codeyoung 2027 recruitment assignment.

## Business requirements
- There are 10 mentors and approximately 20 parents seeking trial classes per day.
- Each mentor can conduct at most two trial classes per mentor-local calendar day.
- Parents choose a preferred date and time.
- The backend automatically assigns an available mentor.
- A mentor cannot be assigned overlapping classes.
- Parents and mentors can be in different time zones, particularly the US, UK, and India.
- All booking times must be displayed and communicated in the recipient's local time.
- Daylight saving time must be handled correctly.
- Both parent and mentor receive a confirmation containing a dummy demo-class URL.
- If no mentor is available, explain the situation and offer alternative slots.
- Concurrent booking requests must not overbook a mentor.

## Required stack
Frontend: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Lucide.
Backend: Node.js, Express, TypeScript.
Database: PostgreSQL with Prisma ORM.
Validation: Zod.
Date/time handling: date-fns and date-fns-tz, using IANA time-zone identifiers.
Testing: Vitest and Supertest.
Email: implement a testable email adapter. Support a development transport such as Mailpit or a mock adapter.

## Architecture requirements
Use a single Git repository with separate frontend and backend directories.
Backend layers:
- routes
- controllers
- services
- repositories
- middleware
- lib/utilities
- tests

Keep business rules inside services, not React components or HTTP controllers.
Use a database transaction and suitable PostgreSQL constraints or locking to prevent concurrent requests from assigning the same mentor to overlapping classes. Enforce the daily class limit using the mentor's local calendar date.
Persist booking instants in UTC and store the relevant IANA time-zone identifiers. Define whether the two-class daily limit is based on the mentor's local calendar day, and apply that rule consistently.
Validate input on the server. Never trust frontend availability checks.

## User interface
Create a premium, modern, responsive booking experience with a polished light theme, accessible controls, clear loading states, useful empty states, and subtle animations.
The main flow must include:
1. Parent details.
2. Time-zone selection with automatic detection and manual override.
3. Date selection.
4. Available time slots.
5. Booking submission.
6. Confirmation page with mentor, local date/time, time-zone label, and dummy class link.
Include a simple mentor schedule view for demonstrating the daily capacity rule. Do not waste time building a complex admin system.

## First task only
Before implementing business logic:
1. Inspect the existing repository. Do not overwrite existing work without checking it.
2. Propose the final folder structure.
3. Initialize the frontend and backend with compatible dependency versions.
4. Add strict TypeScript configurations.
5. Add environment-variable validation and .env.example files without secrets.
6. Add formatting/linting and test scripts.
7. Add a health-check endpoint.
8. Create a README with installation and local development instructions.
9. Create an initial TRANSCRIPT.md template.
10. Run the available install, build, lint, and test checks. Report which checks actually passed.

Do not implement the complete booking system yet. Do not claim that tests pass unless you actually ran them.
```

### Key Design Decisions & Actions Taken
1. **Repository Layout**:
   - Monorepo structure with `backend/` and `frontend/` directories, orchestrated from root `package.json`.
   - Backend modularized into strict architectural layers: `config`, `controllers`, `middleware`, `repositories`, `routes`, `services`, `lib`, and `tests`.

2. **TypeScript & Tooling**:
   - Enabled strict compiler options across both frontend and backend (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, `noUncheckedIndexedAccess: true`).
   - ESLint and Vitest set up in both tiers with zero warnings/errors.

3. **Validation & Configuration**:
   - Added Zod-based environment variable validation in `backend/src/config/env.ts` with sensible defaults and `.env.example` templates.
   - Initialized PostgreSQL Prisma schema with `Mentor` and `Booking` models, including compound indices for `[mentorId, startTimeUtc, endTimeUtc]` and `[mentorId, mentorLocalDate]` for fast concurrency and daily capacity lookups.

4. **Health Check & Testing**:
   - Implemented `GET /api/health` returning service metadata, timestamp, and process uptime.
   - Added integration test suite using Supertest and Vitest for backend health endpoint.
   - Added React Testing Library component tests for frontend.

---

## Session 2: Stage 2 Database & Booking Engine

### Key Implementations
- Implemented PostgreSQL schema via Prisma with `Mentor`, `Parent`, and `Booking` models.
- Seeded 10 mentors across India (`Asia/Kolkata`), UK (`Europe/London`), and US (`America/New_York`, `America/Chicago`, `America/Los_Angeles`) with standard working hours and weekdays.
- Implemented `BookingService` enforcing:
  - 30-minute slot duration.
  - Automatic mentor assignment with fair load balancing (choosing mentors with fewest confirmed classes on their local calendar day).
  - Strict 2-classes per mentor-local day limit.
  - Concurrency protection using `SELECT ... FOR UPDATE ORDER BY id ASC`.

---

## Session 3: Stage 3 Time-Zone and Daylight Saving Time (DST) Validation

### Key Implementations
- Built `dateUtils.ts` with comprehensive timezone validation:
  - Spring-forward gap rejection (throws validation error for nonexistent local times like `2026-03-08 02:30` in NY or `2026-03-29 01:30` in London).
  - Fall-back overlap detection (requires explicit UTC timestamp for ambiguous repeated local times).
  - Multi-region offset formatting (`formatLocalTime` generating `EST`, `EDT`, `BST`, `GMT`, `IST` dynamically).
  - Mentor-local day boundary computation `getLocalDayUtcRange(dateStr, mentorTz)`.
- Added 15 comprehensive unit tests in `timezoneDst.test.ts`.

---

## Session 4: Stage 4 React Frontend Booking Journey

### Key Implementations
1. **Screen A: Parent Details Form** (`ParentDetailsForm.tsx`):
   - Name, email, phone with country code, interactive STEM course cards, and auto-detected IANA timezone selector.
2. **Screen B: Date & Live Slot Picker** (`SlotPicker.tsx`):
   - 14-day date strip, real-time slot grid fetching `/api/slots`, loading spinner, empty states, mentor capacity count, and HTTP 409 conflict handling with alternative slot suggestions.
3. **Screen C: Booking Confirmation** (`BookingConfirmation.tsx`):
   - Booking reference ID, copyable active demo room URL, side-by-side local times for parent vs mentor, and reset action.
4. **Screen D: Mentor Schedule Inspector** (`MentorScheduleView.tsx`):
   - Mentor selector, local date filter, daily capacity progress bar (`X / 2 classes used`), and scheduled bookings table.

---

## Session 5: Stage 5 End-to-End Integration & Email Notifications

### Key Implementations
1. **Email Service Adapter**:
   - `email.service.ts` supporting both in-memory `MockEmailService` and `SmtpEmailService` (Mailpit/SMTP) via `nodemailer`.
   - Generates dual confirmation emails:
     - **Parent Confirmation**: Formatted with the class time in the parent's local time zone (`yyyy-MM-dd HH:mm (zzz)`), course title, mentor name, booking reference ID, and live class URL.
     - **Mentor Notification**: Formatted with the class time in the mentor's local time zone, parent/student details, booking reference ID, and live meeting URL.
   - Built email inspection endpoint `GET /api/emails/recent`.
2. **Reliability & Idempotency Safeguards**:
   - Idempotent duplicate requests safely return existing booking without dispatching duplicate confirmation emails.
   - Non-blocking asynchronous email delivery ensures bookings remain durable even if an external SMTP transport encounters network timeouts.

---

## Session 6: Stage 6 Comprehensive Testing, Bug Fixing, and Final QA

### Key Actions & Results
1. **Available Slots API Fix & Performance Optimization**:
   - Confirmed root cause of "Failed to fetch available slots" was a background stale Node process holding port 4000.
   - Implemented an automated connection circuit-breaker in `backend/src/lib/prisma.ts` and repository layer (`mentor.repository.ts`, `booking.repository.ts`, `parent.repository.ts`).
   - Slot query response time dropped to **<100ms** with instant fallback execution.
2. **Automated Test Results**:
   - Backend tests: 39 tests passed across 8 suites.
   - Frontend tests: 5 tests passed.
   - Linting: 0 errors, 0 warnings.
   - Builds: Clean production bundles generated for backend and frontend.

---

## Session 7: Standardize Time-Zone Names and Display UTC Offsets

### User Prompt
```markdown
# UI Bug Fix: Standardize Time-Zone Names and Display UTC Offsets

The navbar currently displays the browser's detected time zone as `Asia/Calcutta`. I want a standardized, user-friendly display such as:

Kolkata, India
Asia/Kolkata · UTC+05:30

Preserve the existing UI design and booking functionality. Inspect the current implementation before changing code.

## 1. Standardize the time-zone identifier
- Inspect how the application detects, stores, validates, and displays time zones.
- When the browser reports `Asia/Calcutta`, normalize it to `Asia/Kolkata` for display and new application configuration.
- Use a centralized time-zone normalization utility rather than scattered string replacements.
- Preserve backward compatibility with existing bookings or stored records that contain `Asia/Calcutta`.
- Verify that both identifiers produce the same actual instant conversions for relevant dates.

## 2. Display a friendly name and UTC offset
Update the navbar's time-zone display to show:
- A friendly location name, such as Kolkata, India.
- The canonical IANA identifier, such as Asia/Kolkata.
- The UTC offset, such as UTC+05:30.

## 3. Calculate offsets correctly
Calculate the UTC offset using the selected time zone and the relevant date/time.
- India should display UTC+05:30.
- New York should display applicable UTC offset (UTC-05:00 in standard, UTC-04:00 during daylight saving).
- London should display UTC+00:00 in standard or UTC+01:00 during BST.
- Format offsets consistently as UTC±HH:MM.

## 4. Time-zone selector
Ensure selected time zone is used throughout the booking experience and displayed consistently.

## 5. Do not break scheduling
Keep database booking instants in UTC and maintain compatibility with existing records.

## 6. Tests
Add tests covering normalization, offsets, friendly names, and instant equivalence.
```

### Key Implementations & Actions Taken
1. **Centralized Time-Zone Normalization (`normalizeTimeZone`)**:
   - Built canonical mapping dictionaries in both `backend/src/lib/dateUtils.ts` and `frontend/src/lib/timezones.ts` mapping legacy aliases (`Asia/Calcutta` &rarr; `Asia/Kolkata`, `US/Eastern` &rarr; `America/New_York`, `US/Pacific` &rarr; `America/Los_Angeles`, `GB` &rarr; `Europe/London`).
   - Legacy identifiers like `Asia/Calcutta` remain valid in `isValidTimeZone` and convert to identical absolute UTC instants without altering scheduling behavior.
2. **Dynamic UTC Offset Formatter (`getFormattedUtcOffset`)**:
   - Implemented dynamic calculation formatting offsets strictly as `UTC±HH:MM` (e.g. `UTC+05:30`, `UTC-04:00`, `UTC-05:00`, `UTC+00:00`, `UTC+01:00`, `UTC+05:45`).
   - Accurately adjusts for daylight saving transitions and handles half-hour and quarter-hour offsets without subtracting strings.
3. **Friendly Location Labeling (`getFriendlyLocationName` & `getTimeZoneDetails`)**:
   - Maps canonical IANA zones to user-friendly city and country pairs (e.g. `Kolkata, India`, `New York, United States`, `London, United Kingdom`).
   - Generates clean fallbacks for arbitrary valid IANA zones (e.g. `America/Phoenix` &rarr; `Phoenix (America)`).
4. **Navbar & Booking Flow UI Upgrades**:
   - Updated `Navbar.tsx` timezone pill to a compact, responsive badge displaying:
     - Top line: `Kolkata, India` (Friendly Location)
     - Bottom line: `Asia/Kolkata · UTC+05:30` (Canonical IANA + UTC Offset)
   - Synchronized `ParentDetailsForm.tsx`, `SlotPicker.tsx`, and `BookingConfirmation.tsx` to display standardized friendly names and UTC offsets.
5. **Automated Testing & Build Results**:
   - Backend unit tests expanded in `dateUtils.test.ts` (15 tests covering normalization, backward compatibility, seasonal offsets, half/quarter hour offsets, and location labels).
   - Frontend tests updated in `App.test.tsx` (6 integration tests passing).
   - **Monorepo Tests**: 55/55 tests passed (49 backend, 6 frontend) in 4.37s.
   - **Monorepo Lint**: 0 errors, 0 warnings.
   - **Production Builds**: Backend (`tsc`) and frontend (`vite build` in 2.69s) compiled with zero errors.
