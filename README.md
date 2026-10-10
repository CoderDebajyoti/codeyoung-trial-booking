# Codeyoung Trial Booking & Course Hub

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%20%7C%2020-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-Evaluation%20Ready-003B57?logo=sqlite)](https://www.sqlite.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Production%20Ready-336791?logo=postgresql)](https://www.postgresql.org/)
[![Vitest](https://img.shields.io/badge/Tests-124%20Passing%20(100%25)-brightgreen?logo=vitest)](https://vitest.dev/)

A production-ready, timezone-aware 1:1 appointment booking and course purchasing platform built for **Codeyoung**. Designed for scale with concurrency locks, mentor daily capacity management (max 2 classes/day in mentor-local time), multi-role navigation, and transparent package pricing.

---

## 📋 Table of Contents
1. [Evaluator & Hiring Team Setup Guide](#-evaluator--hiring-team-setup-guide)
   - [1. Quick Project Overview](#1-quick-project-overview)
   - [2. Prerequisites](#2-prerequisites)
   - [3. GitHub Clone Instructions](#3-github-clone-instructions)
   - [4. Environment Configuration](#4-environment-configuration)
   - [5. Database Setup & Seeding](#5-database-setup--seeding)
   - [6. Running the Application](#6-running-the-application)
   - [7. Verification & Automated Test Suite](#7-verification--automated-test-suite)
   - [8. Step-by-Step Evaluator Demo Walkthrough](#8-step-by-step-evaluator-demo-walkthrough)
   - [9. Troubleshooting & FAQ](#9-troubleshooting--faq)
2. [Architecture & System Design](#-architecture--system-design)
3. [Role-Based Navigation Architecture](#-role-based-navigation-architecture)
4. [Key Features & Capabilities](#-key-features--capabilities)
5. [Visual Identity & Design System](#-visual-identity--design-system)
6. [API Reference](#-api-reference)
7. [Enterprise Security & Reliability Guarantees](#-enterprise-security--reliability-guarantees)

---

## 🚀 Evaluator & Hiring Team Setup Guide

This guide enables an evaluator to clone, configure, seed, run, and evaluate the entire application on a clean machine in **under 3 minutes** with **zero external database dependencies**.

---

### 1. Quick Project Overview

- **Core Functionality**: Parents explore STEM curriculum, compare interactive 1M/2M/3M/6M course packages, check live mentor availability across global timezones, and book verified 1:1 trial sessions. Mentors inspect schedules against a strict 2-class/day capacity cap, and administrators manage bookings, courses, and notifications.
- **Frontend Architecture**: React 18 SPA (Vite + TypeScript), role-aware compact navigation, dynamic timezone converters (`Intl` API + IANA timezones), and accessible modals/drawers.
- **Backend Architecture**: Node.js + Express + TypeScript, layered controller/service/repository pattern with Prisma ORM.
- **Database Strategy**: Default **SQLite** file mode (`DATABASE_URL="file:./dev.db"`) for frictionless local evaluation, with seamless **PostgreSQL** schema compatibility for cloud deployment.
- **Notifications**: Deduplicated outbox email pipeline with recipient-localized timestamps (supports `mock`, `mailpit`, `smtp`, and `resend`).

```mermaid
graph TD
    subgraph Client ["Frontend (React 18 + Vite :5173)"]
        UI["Role-Aware Navigation & UI"]
        TZ["Timezone Converter (IANA)"]
        Store["Auth & Booking State"]
    end

    subgraph Server ["Backend API (Express + TypeScript :4000)"]
        Routes["Express Router & Auth Middleware"]
        Services["Business Services (Booking, Mentor, Course)"]
        Capacity["Mentor Daily Capacity Rule Engine (Max 2/Day)"]
        Outbox["Email Notification Outbox Worker"]
        PrismaRepo["Prisma Repositories"]
    end

    subgraph Database ["Persistence Layer"]
        DB[("SQLite (dev.db) / PostgreSQL")]
    end

    UI -->|HTTP / REST API| Routes
    Routes --> Services
    Services --> Capacity
    Services --> Outbox
    Services --> PrismaRepo
    PrismaRepo --> DB
```

---

### 2. Prerequisites

| Tool | Required Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` (LTS 18 or 20 recommended) | JavaScript Runtime |
| **npm** | `>= 9.0.0` | Package Manager |
| **Git** | Any modern version | Source Control |
| **SQLite3** | *Built into Node / Prisma* | **Zero configuration required** (Default evaluator DB) |
| **PostgreSQL** | `14+` *(Optional)* | Optional production deployment |

---

### 3. GitHub Clone Instructions

Open **Windows PowerShell** (or Terminal) and execute:

```powershell
# 1. Clone the repository
git clone https://github.com/CoderDebajyoti/codeyoung-trial-booking.git

# 2. Navigate into the project root
cd codeyoung-trial-booking

# 3. Verify installed runtime versions
node -v
npm -v
git --version

# 4. Open in VS Code (Optional)
code .
```

---

### 4. Environment Configuration

The repository includes pre-configured `.env.example` templates with safe defaults (`PORT=4000`, `EMAIL_PROVIDER=mock`, `DATABASE_URL="file:./dev.db"`).

#### Copy Environment Files in PowerShell:

```powershell
# Create backend environment configuration
Copy-Item backend/.env.example backend/.env

# Create frontend environment configuration
Copy-Item frontend/.env.example frontend/.env
```

#### Key Environment Variables Explained:

| Variable | Location | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `backend/.env` | `"file:./dev.db"` | SQLite local file database path (or PostgreSQL connection string) |
| `PORT` | `backend/.env` | `4000` | Backend Express server port |
| `FRONTEND_URL` | `backend/.env` | `http://localhost:5173` | Allowed CORS origin |
| `EMAIL_PROVIDER` | `backend/.env` | `mock` | `mock` (console logging), `mailpit`, `smtp`, or `resend` |
| `JWT_SECRET` | `backend/.env` | `codeyoung-dev-secret-key-256bit` | Secret key for mentor & admin sessions |
| `OTP_ENABLED` | `backend/.env` | `true` | Enables 6-digit email OTP for login verification |
| `CAPTCHA_ENABLED` | `backend/.env` | `false` | Cloudflare Turnstile bot protection (keep `false` for local dev) |
| `VITE_API_URL` | `frontend/.env` | `http://localhost:4000/api` | Base URL used by frontend API client |

> [!NOTE]
> No sensitive secrets are stored in the codebase. All credentials default to local development sandboxes.

---

### 5. Database Setup & Seeding

The database setup is completely automated via Prisma:

```powershell
# Navigate into backend directory
cd backend

# 1. Install backend dependencies
npm install

# 2. Generate Prisma Client bindings
npm run prisma:generate

# 3. Synchronize database schema (creates dev.db automatically)
npm run prisma:push

# 4. Seed mentors, STEM courses, and pricing packages
npm run prisma:seed
```

#### Expected Seeding Output:
```text
Seeding database with mentors, courses, and pricing packages...
✅ Created mentor: Aarav Sharma (Asia/Kolkata)
✅ Created mentor: Priya Patel (Asia/Kolkata)
✅ Created mentor: Emily Watson (Europe/London)
...
✅ Seeding complete. Mentors: 10, Courses: 10, Packages: 40
```

---

### 6. Running the Application

You will need **two terminal windows** (one for Backend, one for Frontend).

#### Terminal 1: Start Backend Server
```powershell
cd codeyoung-trial-booking/backend
npm run dev
```
*Backend initializes and displays:*
```text
[Server] Codeyoung Trial Booking Backend running on http://localhost:4000
[Database] Connected to SQLite database at file:./dev.db
[Notification Outbox] Background worker started (Interval: 10s)
```

#### Terminal 2: Start Frontend Application
```powershell
cd codeyoung-trial-booking/frontend
npm install
npm run dev
```
*Frontend Vite dev server starts and displays:*
```text
  VITE v5.4.21  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

👉 Open **`http://localhost:5173`** in your browser to begin testing.

---

### 7. Verification & Automated Test Suite

#### A. Automated Test Execution
Run the full test suite across the monorepo:

```powershell
# From root directory: run ALL 124 tests
npm test

# Or run tests independently:
# Backend (101 unit and integration tests)
cd backend; npm test

# Frontend (23 React Testing Library tests)
cd frontend; npm test
```

#### B. TypeScript & Production Build Verification
```powershell
# Verify zero TypeScript compilation errors and production bundles
npm run build
```

#### C. API Health Check Verification
In browser or PowerShell:
```powershell
curl http://localhost:4000/api/health
```
Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-10-10T17:15:00.000Z",
  "storageMode": "database"
}
```

---

### 8. Step-by-Step Evaluator Demo Walkthrough

Follow this 5-minute workflow to test all core platform capabilities:

| Step | Action | Expected Result |
| :---: | :--- | :--- |
| **1** | Open **`http://localhost:5173`** | Clean, responsive homepage loads with warm Codeyoung golden-yellow branding and timezone indicator. |
| **2** | Click **"Explore Courses & Pricing"** | Merged course & pricing catalogue renders 10 STEM courses. Toggle category pills (*Coding*, *AI & Robotics*, *Web Dev*). |
| **3** | Click duration pills (**1M / 2M / 3M / 6M**) | Class counts, total price, and live **price per class** update dynamically with configured discounts. |
| **4** | Click **"Book Free Trial"** on *Python Programming & AI Basics* | Navigates to Trial Booking flow with Python preselected as the chosen course. |
| **5** | Step 1: Parent & Student Details | Enter Parent Name, Student Name, Email (`evaluator@example.com`), and Phone. Select parent timezone (e.g. `America/New_York` or `Asia/Kolkata`). |
| **6** | Step 2: Slot Selection | Live 30-min trial slots render in the parent's chosen timezone. Select any available slot. |
| **7** | Step 3: Complete Booking | Click **"Confirm 1:1 Trial Class"**. Instantly receives unique Booking ID, mentor assignment, and demo class meeting URL. |
| **8** | Inspect Notifications | Backend logs outbox dispatch with recipient-localized timestamps: `[Notification Outbox] Success -> BookingID: ... | Recipient: evaluator@example.com`. |
| **9** | Admin Dashboard & Persistence | Log in as Staff/Admin (`admin@codeyoung.com` or OTP). Access **"Trial Bookings"** to search, sort, and inspect the booking. |
| **10** | Backend Restart Persistence Test | Stop backend (`Ctrl+C`) and restart (`npm run dev`). Reload admin dashboard — all bookings, mentors, and courses **remain durable and intact** in `dev.db`. |

---

### 9. Troubleshooting & FAQ

#### Q1: Port 4000 or 5173 is already in use
- **Fix**: Change `PORT=4001` in `backend/.env` and update `VITE_API_URL=http://localhost:4001/api` in `frontend/.env`.

#### Q2: `Failed to fetch` or CORS error in browser console
- **Fix**: Ensure the backend server is running in Terminal 1 on port 4000. Verify that `frontend/.env` contains `VITE_API_URL=http://localhost:4000/api`.

#### Q3: How to use PostgreSQL instead of SQLite?
- **Fix**: In `backend/.env`, set:
  ```env
  DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/codeyoung_booking?schema=public"
  ```
  In `backend/prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`. Then run `npm run prisma:push && npm run prisma:seed`.

#### Q4: How to confirm persistent storage vs memory fallback?
- **Fix**: Run `curl http://localhost:4000/api/health`. The response will show `"storageMode": "database"`. The SQLite file `backend/prisma/dev.db` will also grow in size as bookings are placed.

---

## 🧭 Role-Based Navigation Architecture

The navigation bar dynamically adapts to user authentication states and roles while preventing horizontal overflow:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  PUBLIC VISITOR                                                                        │
│  [Codeyoung Logo]      [Explore Courses & Pricing]  [Book Free Trial]   [IST Badge] [Sign In] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  PARENT ACCOUNT                                                                        │
│  [Codeyoung Logo]      [Explore Courses & Pricing]  [Book Free Trial]   [Account ▾] (Bookings, Logout) │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  MENTOR ACCOUNT                                                                        │
│  [Codeyoung Logo]      [My Schedule & Capacity]                         [Account ▾] (Schedule, Logout) │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  ADMINISTRATOR                                                                         │
│  [Codeyoung Logo]      [Trial Bookings]  [Courses & Packages]  [Capacity] [Account ▾] (Staff, Logout) │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Compact Single-Row Layout**: Flex items shrink gracefully on medium viewports; zero horizontal scrolling (`overflow-x: auto` eliminated).
- **Mobile Drawer Menu**: Clean hamburger drawer on mobile widths (`<768px`) with keyboard `Escape` closing and backdrop dismissal.
- **Strict Authorization**: Backend routes enforce role validation; UI link hiding is purely for user experience.

---

## 📚 Key Features & Capabilities

### 1. Merged "Explore Courses & Pricing" Destination
- Single unified view replacing fragmented course exploration and pricing pages.
- Interactive commitment switcher: **1 Month**, **2 Months**, **3 Months**, and **6 Months**.
- Live mathematical calculation of **price per class** (`totalPrice / totalClasses`).
- Direct action shortcuts: **"Curriculum"**, **"Choose Package"** (checkout modal), and **"Book Free Trial"** (carries course ID into booking form).

### 2. Timezone-Aware Slot Scheduling
- Mentors configured in diverse time zones (`Asia/Kolkata`, `Europe/London`, `America/New_York`, `America/Chicago`, `America/Los_Angeles`).
- Parents view slot schedules translated directly into their local timezone.
- Automatic handling of daylight saving time (DST) transitions.

### 3. Mentor Daily Capacity Protection
- Strict **2 classes/day limit** evaluated in each mentor's **local calendar date** (not UTC).
- When a mentor hits 2 confirmed bookings on their local calendar date, they are automatically excluded from subsequent slot availability for that date.

### 4. Concurrency & Double-Booking Protection
- Atomic concurrency locks prevent two parents from booking the same mentor in the same time slot simultaneously.
- Idempotency key headers prevent duplicate form submissions during network retries.

### 5. Deduplicated Email Notification Queue
- Transactional emails sent to both parent and mentor upon booking confirmation.
- Times are rendered in the respective recipient's local timezone (e.g. parent sees EDT, mentor sees IST).
- Background worker processes outbox records every 10 seconds.

---

## 🎨 Visual Identity & Design System

The application features a warm, golden-yellow-to-orange palette matching Codeyoung's primary brand identity:

```
[#FFD45A Primary Golden]  [#FFC52E Gold]  [#FFB82E Orange]  [#F28C28 Deep Amber]
[#FFF8E8 Cream Canvas]    [#FFF0D2 Pale Gold]  [#F7E4B6 Soft Border]  [#713B18 Dark Brown Text]
```

### Color Tokens
- **Primary Golden Yellow**: `#FFD45A`
- **Primary Gold**: `#FFC52E`
- **Golden Orange**: `#FFB82E`
- **Secondary Orange**: `#F28C28`
- **Warm Cream Background**: `#FFF8E8`
- **Pale Gold Surface**: `#FFF0D2`
- **Soft Gold Border**: `#F7E4B6`
- **Dark Brown Text**: `#713B18`
- **Primary Gradient**: `linear-gradient(110deg, #FFD45A 0%, #FFC52E 55%, #FFB82E 100%)`

---

## 📡 API Reference

### Course Catalogue Endpoints
- `GET /api/courses` - List active courses (or all courses with `?includeInactive=true`).
- `GET /api/courses/:id` - Fetch single course with package options and curriculum outcomes.
- `POST /api/courses` - Create new course *(Admin only)*.
- `PUT /api/courses/:id` - Update course metadata or toggle status *(Admin only)*.
- `DELETE /api/courses/:id` - Delete course *(Admin only)*.
- `POST /api/courses/:id/packages` - Upsert package pricing options *(Admin only)*.

### Trial Booking Endpoints
- `GET /api/slots?date=YYYY-MM-DD&timeZone=IANA_TZ` - Query available 30-min trial slots.
- `POST /api/bookings` - Submit 1:1 trial booking with idempotency key and course validation.
- `GET /api/bookings` - Search, sort, and filter all trial bookings *(Admin only)*.

### Mentor & Staff Endpoints
- `GET /api/mentors` - List active mentors.
- `GET /api/mentors/:id/schedule?date=YYYY-MM-DD` - View mentor daily capacity (max 2 classes/day limit).
- `POST /api/auth/login` - Authenticate parent, mentor, or admin account.
- `POST /api/auth/otp/send` - Request 6-digit email OTP.
- `POST /api/auth/otp/verify` - Verify OTP and receive verification token.
- `GET /api/notifications/recent` - Inspect notification outbox and reminder delivery state.
- `GET /api/health` - Check API and database connectivity status.

---

## 🔒 Enterprise Security & Reliability Guarantees

- **PostgreSQL & SQLite Dual Compatibility**: Evaluator-friendly SQLite mode with PostgreSQL production support.
- **Race Condition Protection**: Concurrency locks preventing slot overbooking.
- **Mentor Daily Limit**: Strict 2 classes/day cap evaluated in each mentor's local calendar day.
- **Trial Eligibility Protection**: Prevents duplicate trial usage by same student or parent.
- **Outbox Email Queue**: Deduplicated transactional emails with recipient-localized time stamps.
- **Type Safety**: End-to-end TypeScript with Zod validation schemas.