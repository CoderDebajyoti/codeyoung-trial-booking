# Codeyoung Trial Class Booking System

A production-ready, timezone-aware 1:1 appointment booking web application built for the Codeyoung 2027 recruitment assignment.

---

## 🏗️ Architecture & Project Structure

The repository is structured as a monorepo containing separate `frontend` and `backend` services.

```
codeyoung-trial-booking/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # Prisma schema for PostgreSQL
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts              # Zod environment variable validation
│   │   ├── controllers/
│   │   │   └── health.controller.ts # Health check controller
│   │   ├── middleware/
│   │   │   └── errorHandler.ts     # Global error handling middleware
│   │   ├── repositories/           # Data access layer
│   │   ├── routes/                 # Express route definitions
│   │   │   ├── health.routes.ts
│   │   │   └── index.ts
│   │   ├── services/               # Business logic layer (capacity rules, matching)
│   │   ├── lib/                    # Timezone utilities, date-fns helpers
│   │   ├── app.ts                  # Express application factory
│   │   └── server.ts               # Server startup entry point
│   ├── tests/
│   │   └── integration/
│   │       └── health.test.ts      # Supertest & Vitest API tests
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json               # Strict TypeScript config
│   └── vitest.config.ts
├── frontend/
│   ├── src/
│   │   ├── components/ui/          # Reusable UI components
│   │   ├── lib/
│   │   │   └── utils.ts            # Tailwind styling utilities
│   │   ├── App.tsx                 # Main layout & booking workflow
│   │   ├── index.css               # Tailwind tokens & global styling
│   │   └── main.tsx                # React DOM entry point
│   ├── tests/
│   │   ├── setup.ts
│   │   └── App.test.tsx            # React Testing Library unit tests
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
- **Testing**: Vitest, Supertest, React Testing Library, JSDOM.
- **Email**: Testable email service adapter with mock & Mailpit / SMTP support.

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Node.js**: >= 20.x
- **npm**: >= 10.x
- **PostgreSQL**: Running instance (e.g., local PostgreSQL or Docker)

### 1. Installation

Install all dependencies for backend and frontend:

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

Edit `backend/.env` to configure your PostgreSQL `DATABASE_URL`.

### 3. Database Migration & Prisma Generation

```bash
cd backend
npx prisma generate
```

### 4. Running Dev Servers

Run both servers from root or in separate terminals:

```bash
# Run backend (Port 4000)
npm run dev:backend

# Run frontend (Port 5173)
npm run dev:frontend
```

---

## 🧪 Testing, Linting & Building

Run tests across both backend and frontend:

```bash
# Backend tests
npm run test:backend

# Frontend tests
npm run test:frontend

# Run all tests
npm test

# Linting
npm run lint

# TypeScript builds
npm run build
```

---

## 🔍 Health Check Endpoint

When the backend is running, verify system health:
- `GET http://localhost:4000/api/health`
- Response:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-09T14:38:00.000Z",
    "service": "codeyoung-trial-booking-backend",
    "uptime": 12.34
  }
  ```