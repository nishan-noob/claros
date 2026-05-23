# Claros — School Attendance & Grade Management

A mobile-first, production-ready web app for primary schools to manage student attendance, grades, and parent communication.

---

## Features

### Roles
| Role | Access |
|------|--------|
| **Headmaster** | Full admin — students, teachers, classes, subjects, accounts |
| **Teacher** | Attendance, grades, student roster for their classes |
| **Parent** | View child's attendance history and grades |

### Core (Live)
- **Attendance** — Mark per subject per class per day. PRESENT / ABSENT / LATE / EXCUSED. Circular progress ring.
- **Grades** — Assessments (Quiz, Exam, Assignment, Midterm, Final, Project) with letter grades and averages.
- **Student Profiles** — Student codes, class assignments, parent linking.
- **Parent Dashboard** — Real-time attendance rates, recent grade activity.

### Phase 2 (Feature-flagged, off by default)
- Announcements, timetable, attendance export, grade reports.

### Phase 3 (Feature-flagged, off by default)
- Parent-teacher chat, homework tracker, headmaster analytics, bulk import.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript strict) |
| Database | PostgreSQL on Neon |
| ORM | Prisma 7 with @prisma/adapter-pg |
| Auth | NextAuth.js v5 beta (JWT, CredentialsProvider) |
| UI | Tailwind CSS v4, shadcn/ui (Base UI), Lucide icons |
| Data fetching | TanStack React Query v5 |
| Validation | Zod |
| Deployment | Vercel |

---

## Getting Started (Local)

### 1. Clone and Install

```bash
git clone <repo-url>
cd claros
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local`:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

Generate secret: `openssl rand -base64 32`

### 3. Database Setup

```bash
npx prisma migrate deploy
npm run db:seed
```

### 4. Run Dev Server

```bash
npm run dev
```

---

## Demo Accounts (after seeding)

All passwords: **password**

| Email | Role |
|-------|------|
| headmaster@abc.school | Headmaster |
| mrsmith@abc.school | Teacher (English, Grade 5) |
| msjones@abc.school | Teacher (Maths, Grade 5) |
| msbrown@abc.school | Teacher (Grade 4A) |
| mstaylor@abc.school | Teacher (Grades 1A-3A) |
| parent1@abc.school | Parent - Aiden Cooper (5A) |
| parent2@abc.school | Parent - Maya Patel (5A) |
| parent3@abc.school | Parent - Liam Chen (4A) |

---

## Deployment (Vercel)

1. Create a Neon database at https://neon.tech and copy the connection string.
2. Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
3. Push to GitHub and connect to Vercel.
4. Set env vars: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL.
5. Run seed from local machine with production DATABASE_URL: `npm run db:seed`

---

## Scripts

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run db:migrate   # Run migrations
npm run db:seed      # Seed demo data
npm run db:setup     # Migrate + seed
```

## Feature Flags

Edit `config/features.ts` to enable Phase 2 / Phase 3 features.
