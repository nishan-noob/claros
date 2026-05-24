# 🎓 Claros — School Management System

> **The attendance register just got a serious upgrade.**
> Claros is a mobile-first web app for primary schools to manage student attendance, grades, and parent visibility — all from any phone, tablet, or desktop. No app store. No subscriptions. Just a URL.

**Live demo → [claros-inky.vercel.app](https://claros-inky.vercel.app)**
*(Click any demo pill on the login page to jump straight in. Password for all accounts: `password`)*

---

## 📋 Table of Contents

1. [What You'll Get](#-what-youll-get)
2. [Before You Start — Prerequisites](#-before-you-start--prerequisites)
3. [Step 1 — Fork & Clone the Repo](#-step-1--fork--clone-the-repo)
4. [Step 2 — Install Dependencies](#-step-2--install-dependencies)
5. [Step 3 — Set Up Your Database (Neon)](#-step-3--set-up-your-database-neon)
6. [Step 4 — Create Your Environment File](#-step-4--create-your-environment-file)
7. [Step 5 — Push the Database Schema](#-step-5--push-the-database-schema)
8. [Step 6 — Seed Your Data](#-step-6--seed-your-data)
9. [Step 7 — Run Locally & Test](#-step-7--run-locally--test)
10. [Step 8 — Deploy to Vercel](#-step-8--deploy-to-vercel)
11. [Customising Your School Data](#-customising-your-school-data)
12. [Feature Flags — Unlock Extra Features](#-feature-flags--unlock-extra-features)
13. [Known Issues & Exact Fixes](#-known-issues--exact-fixes)
14. [Tech Stack](#-tech-stack)
15. [Scripts Reference](#-scripts-reference)

---

## 🏫 What You'll Get

Three separate role-based views all in one app:

| Role | What they see |
|------|--------------|
| 🎩 **Headmaster** | Full admin — manage students, teachers, classes, subjects, and user accounts |
| 🍎 **Teacher** | Take & review attendance per subject, manage assessments and grades, view class roster |
| 👨‍👩‍👦 **Parent** | See their child's attendance history, grades per subject, and overall stats |

**Features that are live out of the box:**
- ✅ Attendance marking (Present / Absent / Late / Excused) per subject per day
- ✅ Attendance history + class report with % breakdowns
- ✅ Grades & assessments (Quiz, Exam, Assignment, Midterm, Final, Project)
- ✅ Letter grades (A+, A, B+… F) auto-calculated from % score
- ✅ Parent dashboard with attendance rings and recent grades
- ✅ Student profiles, class assignments, parent linking
- ✅ Headmaster account management (create/deactivate users)
- ✅ Demo quick-fill buttons on login page

**Features hidden behind feature flags (turn them on when you're ready):**
- 🔒 Announcements, Timetable, Attendance Export, Grade Reports *(Phase 2)*
- 🔒 Parent-Teacher Chat, Homework Tracker, Analytics, Bulk Import *(Phase 3)*

---

## 🧰 Before You Start — Prerequisites

You need **four free things** installed on your computer. If you already have them, skip ahead.

### 1. Node.js (the engine that runs the code)
- Go to **[nodejs.org](https://nodejs.org)**
- Download the **LTS** version (the big green button)
- Install it — just click Next, Next, Finish
- To check it worked: open a terminal and type `node --version` — you should see something like `v22.0.0`

> 💡 **What's a terminal?** On Windows: press `Win + R`, type `cmd`, press Enter. On Mac: press `Cmd + Space`, type `Terminal`, press Enter.

### 2. Git (so you can download and manage code)
- Go to **[git-scm.com](https://git-scm.com)**
- Download and install (all default settings are fine)
- Check it worked: `git --version`

### 3. A GitHub account (free, to store your copy of the code)
- Sign up at **[github.com](https://github.com)** if you don't have one

### 4. A code editor (optional but makes life nicer)
- **[VS Code](https://code.visualstudio.com)** — free and excellent

That's it. Everything else (database, hosting) is free and done through websites.

---

## 📥 Step 1 — Fork & Clone the Repo

**Fork** means making your own copy on GitHub so you can change things.

1. Go to the original repo on GitHub
2. Click the **Fork** button (top-right corner)
3. Click **Create Fork**
4. Now you have your own copy at `github.com/YOUR-USERNAME/claros`

**Clone** means downloading it to your computer:

```bash
git clone https://github.com/YOUR-USERNAME/claros.git
cd claros
```

> Replace `YOUR-USERNAME` with your actual GitHub username.

---

## 📦 Step 2 — Install Dependencies

This downloads all the code libraries the project needs. Inside the `claros` folder:

```bash
npm install
```

This will take 1-3 minutes. You'll see lots of text scrolling. That's normal. Wait for it to finish.

> ⚠️ **If you see errors about Python or node-gyp** — don't panic. Those warnings come from native modules being compiled. As long as the install finishes without saying `npm ERR!` at the very end, you're fine.

---

## 🗄️ Step 3 — Set Up Your Database (Neon)

Claros uses **[Neon](https://neon.tech)** — a free, serverless PostgreSQL database that lives in the cloud. No installation needed.

### 3a. Create a Neon account
1. Go to **[neon.tech](https://neon.tech)** and click **Sign Up** (free, use GitHub to sign in)

### 3b. Create a project
1. Click **New Project**
2. Fill in the form:
   - **Project name**: `claros` (or anything you like)
   - **Database name**: `neondb` (leave as default)
   - **Region**: pick the one closest to you
3. Click **Create Project**

### 3c. Get your connection string
1. You'll land on your project dashboard
2. Find the section called **Connection string** (it looks like a long URL starting with `postgresql://`)
3. Click the **copy** icon next to it
4. **Save this string somewhere** — you'll need it in the next step

The string looks like this:
```
postgresql://neondb_owner:YOUR_PASSWORD@ep-something-something.us-east-1.aws.neon.tech/neondb?sslmode=require
```

> 🔐 **Treat this like a password.** Don't share it publicly or commit it to GitHub. We'll make sure it stays secret.

---

## ⚙️ Step 4 — Create Your Environment File

Environment variables are how you tell the app secret things (like database passwords) without putting them in the code.

In your `claros` folder, create a file called `.env.local`:

**On Windows (in terminal):**
```bash
copy nul .env.local
```

**On Mac/Linux:**
```bash
touch .env.local
```

Then open `.env.local` in your code editor and paste this:

```env
DATABASE_URL="YOUR_NEON_CONNECTION_STRING_HERE"
NEXTAUTH_SECRET="YOUR_RANDOM_SECRET_HERE"
NEXTAUTH_URL="http://localhost:3000"
```

- Replace `YOUR_NEON_CONNECTION_STRING_HERE` with the string you copied from Neon
- Replace `YOUR_RANDOM_SECRET_HERE` with a random secret (instructions below)

### How to generate a random secret

**Option A — If you have OpenSSL (Mac/Linux):**
```bash
openssl rand -base64 32
```

**Option B — Quick online generator (Windows or any OS):**
Go to **[generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)** — it'll give you a random 32-character string. Copy it.

Your finished `.env.local` should look something like:
```env
DATABASE_URL="postgresql://neondb_owner:abc123@ep-wild-thing.us-east-1.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="bVvfWGQz1zsOAbGSU6QQlQ0vemWpZvt578YW9sZ85+I="
NEXTAUTH_URL="http://localhost:3000"
```

> 🚫 **Never commit `.env.local` to GitHub.** It's already in `.gitignore` so Git will ignore it automatically.

---

## 🏗️ Step 5 — Push the Database Schema

This creates all the tables in your Neon database (students, classes, attendance, etc.):

```bash
npx prisma db push
```

You'll see output like:
```
✔ Generated Prisma Client
✔ Your database is now in sync with your Prisma schema.
```

That means it worked. Your database now has all the right tables, ready to be filled with data.

> ⚠️ **"Error: Environment variable not found: DATABASE_URL"**
> Your `.env.local` file is missing or the variable name is wrong. Double-check Step 4.

> ⚠️ **"Error connecting to the database"**
> Your connection string is wrong. Go back to Neon → copy the connection string again → make sure there are no extra spaces.

---

## 🌱 Step 6 — Seed Your Data

Seeding fills the database with initial data — your school, teachers, students, and some sample attendance/grades.

```bash
$env:DATABASE_URL="YOUR_NEON_CONNECTION_STRING_HERE"; npm run db:seed
```
*(Windows PowerShell — paste your actual connection string in place of `YOUR_NEON_CONNECTION_STRING_HERE`)*

```bash
DATABASE_URL="YOUR_NEON_CONNECTION_STRING_HERE" npm run db:seed
```
*(Mac/Linux — same idea)*

You'll see:
```
🌱  Seeding…
  School: ABC Primary School
  Users created
  Classes created
  Subjects created
  Students created
  Seeding attendance…
  Attendance seeded
  Seeding grades…
  ✅  Done
```

> ⚠️ **Seed hangs at "Seeding attendance..."** — This is a known issue. The seed script writes ~9,000 attendance records one-by-one over a remote network connection. It can take 3-10 minutes on a slow connection. **Just leave it running.** If it times out or errors after users/students are created, the important data (users, classes, students) is already in. The app still works — attendance history just won't have historical data. See the [Known Issues](#-known-issues--exact-fixes) section for a workaround.

> ⚠️ **"PrismaClient needs to be constructed with non-empty valid options"** — This means `DATABASE_URL` wasn't passed to the seed script. Make sure you're setting it inline as shown above, not just having it in `.env.local` (the seed runs as a Node script, not via Next.js).

---

## 🚀 Step 7 — Run Locally & Test

Start the development server:

```bash
npm run dev
```

Open your browser and go to: **[http://localhost:3000](http://localhost:3000)**

You should see the Claros login page with the demo quick-fill panel. Click any of the coloured pills to auto-fill credentials, then click **Sign in**.

### Default demo accounts (all passwords: `password`)

| Email | Role | Notes |
|-------|------|-------|
| `headmaster@abc.school` | 🎩 Headmaster | Full admin access |
| `mrsmith@abc.school` | 🍎 Teacher | Grade 5 — English & Computer Studies |
| `msjones@abc.school` | 🍎 Teacher | Grade 5 — Mathematics |
| `msbrown@abc.school` | 🍎 Teacher | Grade 4 |
| `mstaylor@abc.school` | 🍎 Teacher | Grades 1-3 |
| `parent1@abc.school` | 👨‍👩‍👦 Parent | Linked to Aiden Cooper (Grade 5A) |
| `parent2@abc.school` | 👨‍👩‍👦 Parent | Linked to Maya Patel (Grade 5A) |
| `parent3@abc.school` | 👨‍👩‍👦 Parent | Linked to Liam Chen (Grade 4A) |

To stop the server: press `Ctrl + C` in the terminal.

---

## ☁️ Step 8 — Deploy to Vercel

Vercel is the free hosting platform. Your app will get a public URL like `https://your-app-name.vercel.app`.

### 8a. Push your code to GitHub

```bash
git add -A
git commit -m "Initial setup"
git push origin main
```

> If Git asks for your GitHub credentials, sign in. If it says `main` doesn't exist, try `git push origin master`.

### 8b. Create a Vercel account
1. Go to **[vercel.com](https://vercel.com)**
2. Click **Sign Up** → **Continue with GitHub**
3. Authorise Vercel to access your GitHub

### 8c. Import your project
1. In Vercel dashboard, click **Add New → Project**
2. Find your `claros` repo and click **Import**
3. **Don't click Deploy yet** — you need to add environment variables first

### 8d. Add environment variables
Still on the import screen, scroll down to **Environment Variables** and add these three:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your full Neon connection string |
| `NEXTAUTH_SECRET` | The same random secret from `.env.local` |
| `NEXTAUTH_URL` | `https://YOUR-APP-NAME.vercel.app` |

> 🚨 **Critical:** `NEXTAUTH_URL` must be your **final public URL** — the one Vercel will assign to your project (usually `https://YOUR-REPO-NAME.vercel.app`). You can find this out after your first deploy, then update the variable and redeploy. Getting this wrong is the #1 cause of "sign-in doesn't work" on production.

> 💡 **How do I know my Vercel URL before deploying?** It's usually `https://YOUR-GITHUB-REPO-NAME.vercel.app`. You can also deploy once, see what URL it picks, update `NEXTAUTH_URL` to match, then redeploy. Takes 2 minutes.

### 8e. Deploy
Click **Deploy**. Vercel will:
1. Install dependencies
2. Run `prisma generate && next build`
3. Deploy your app

Watch the build logs. The full build takes about 1-2 minutes.

### 8f. Seed the production database
Your Vercel app now has an empty database — no users, no data. Seed it from your local machine pointing to the production database:

```bash
# Windows PowerShell
$env:DATABASE_URL="YOUR_NEON_CONNECTION_STRING"; npm run db:seed

# Mac/Linux
DATABASE_URL="YOUR_NEON_CONNECTION_STRING" npm run db:seed
```

> Use the **same Neon connection string** — both your local app and Vercel use the same database, so seeding once covers both.

### 8g. Test login
Go to your live URL → click a demo pill → click Sign In → you should land on the dashboard.

---

## 🎨 Customising Your School Data

You don't have to be ABC Primary School with an Aiden Cooper. Here's how to make it yours.

Open `prisma/seed.ts` in your editor. Here are the key things to change:

### School name
```ts
// Find this line and change the name:
create: { name: 'ABC Primary School', academicYear: '2025-2026' },
```
Change `'ABC Primary School'` to your school's actual name.

### Teachers
```ts
// Find these lines and update emails and names:
const teacherSmith = await prisma.user.upsert({
  where: { email: 'mrsmith@abc.school' },
  update: {},
  create: {
    email: 'mrsmith@abc.school',   // ← change to real email
    name: 'Mr. Smith',              // ← change to real name
    passwordHash: hash('password'), // ← change 'password' to a real password
    role: 'TEACHER',
    active: true
  }
});
```
There are 4 teachers (`teacherSmith`, `teacherJones`, `teacherBrown`, `teacherTaylor`). Update all four.

### Classes
```ts
// Find this array and update to your real classes:
const classConfigs = [
  { name: 'Grade 1A', teacher: teacherTaylor },
  { name: 'Grade 2A', teacher: teacherTaylor },
  // ... etc
];
```
Assign each class to the teacher who runs it.

### Students
```ts
// The seed generates students using these name lists:
const firstNames = ['Aiden','Maya','Liam', ...];
const lastNames  = ['Cooper','Patel','Chen', ...];
```
Replace these with your actual student names. Each class gets 20 students by default — you can change this number by adjusting the `for (let i = 0; i < 20; i++)` loop.

### Parents
```ts
// Parent accounts are seeded here:
const parent1 = await prisma.user.upsert({
  where: { email: 'parent1@abc.school' },
  update: {},
  create: { email: 'parent1@abc.school', name: 'Parent One', ... }
});
```
Change the email and name to real parent details.

### Linking a parent to a student
```ts
// Find this section inside the student loop:
if (cn === 'Grade 5A' && i === 0) parentId = parent1.id; // student index 0 = first student
if (cn === 'Grade 5A' && i === 1) parentId = parent2.id; // student index 1 = second student
```
Adjust the class name and index to match which parent belongs to which student.

### After editing — re-run the seed
```bash
# Windows PowerShell
$env:DATABASE_URL="YOUR_NEON_CONNECTION_STRING"; npm run db:seed

# Mac/Linux
DATABASE_URL="YOUR_NEON_CONNECTION_STRING" npm run db:seed
```

The seed uses `upsert` (create-or-update), so running it again is safe — it won't create duplicates. If you want a completely fresh start:

> ⚠️ **Nuclear option — wipe and reseed (destructive!):**
> Go to your Neon dashboard → Tables → select all → delete rows. Or go to **Branches** → reset to empty. Then run `npx prisma db push` and then `npm run db:seed` again.

---

## 🚦 Feature Flags — Unlock Extra Features

Claros has features that are built but hidden until you're ready to turn them on. This lets you launch with just the core features and gradually unlock more.

### Where to find them
Open `config/features.ts`:

```ts
export const FEATURES = {
  // ── ALWAYS ON ─────────────────────────
  ATTENDANCE:        true,   // Mark and view attendance
  GRADES:            true,   // Assessments and grades
  STUDENT_PROFILES:  true,   // Student management
  PARENT_DASHBOARD:  true,   // Parent view

  // ── PHASE 2 — flip when ready ────────
  ANNOUNCEMENTS:     false,  // School-wide announcements
  TIMETABLE:         false,  // Class timetables
  ATTENDANCE_EXPORT: false,  // Export attendance to CSV
  GRADE_REPORT:      false,  // Printable grade reports

  // ── PHASE 3 — future features ────────
  PARENT_TEACHER_CHAT:    false,  // Direct messaging
  HOMEWORK_TRACKER:       false,  // Homework assignments
  HEADMASTER_ANALYTICS:   false,  // School-wide analytics
  BULK_STUDENT_IMPORT:    false,  // Import students from CSV
};
```

### Method A — Code change (permanent)
Open `config/features.ts`, change `false` to `true` for any feature you want:
```ts
ANNOUNCEMENTS: true,   // ← was false
```
Save, commit, push. Vercel redeploys in ~30 seconds.

### Method B — Vercel environment variable (no code change)
1. Go to Vercel dashboard → your project → **Settings → Environment Variables**
2. Add a new variable:
   - **Name**: `NEXT_PUBLIC_FEATURE_ANNOUNCEMENTS` (replace ANNOUNCEMENTS with the feature name)
   - **Value**: `true`
3. Click **Save**
4. Go to **Deployments** → click the three dots next to the latest deploy → **Redeploy**

This is great for trying something out without touching the code.

### Method C — Disable a feature that's currently on
Same as Method B but set the value to `false`.

---

## 🐛 Known Issues & Exact Fixes

Every problem we hit building and deploying Claros — and exactly how to fix each one.

---

### ❌ "PrismaClient needs to be constructed with non-empty valid options"
**When it happens:** Running `npm run db:seed` or starting the dev server.

**Why:** Prisma 7 changed how database connections work. The connection URL must be passed via an adapter, not the old `datasource` block in `schema.prisma`.

**Fix:** Make sure `lib/prisma.ts` looks like this:
```ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const prisma = new PrismaClient({ adapter } as any);
```
And `prisma/seed.ts` must also use the adapter (not just `new PrismaClient()`).

---

### ❌ Vercel build fails — "Environment variable not found: DATABASE_URL"
**When it happens:** First Vercel deployment.

**Why:** The build command runs `prisma generate` which needs `DATABASE_URL`, but you hadn't added it to Vercel's environment variables yet.

**Fix:**
1. Vercel Dashboard → your project → **Settings → Environment Variables**
2. Add `DATABASE_URL` with your Neon connection string
3. Redeploy

---

### ❌ Vercel build fails — "Cannot find module '@prisma/client'"
**When it happens:** Vercel deployment.

**Why:** Prisma's generated client needs `prisma generate` to run as part of the build. The default Next.js `"build": "next build"` script doesn't do this.

**Fix:** In `package.json`, the build script must be:
```json
"build": "prisma generate && next build"
```
This is already set in this repo. If you change `package.json`, make sure this line is there.

---

### ❌ Vercel Edge Function error — "referencing unsupported modules: node:util/types"
**When it happens:** Vercel deployment succeeds but every page shows an error.

**Why:** The `middleware.ts` file (which runs on Vercel's Edge network) was importing from `next-auth`, which chains to `lib/prisma.ts`, which uses `pg`, which uses Node.js built-ins that aren't available in Edge runtime.

**Fix:** `middleware.ts` must NOT import from `next-auth` or any Prisma/pg chain. Instead, it just checks for the session cookie directly:
```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionToken =
    request.cookies.get('authjs.session-token') ??
    request.cookies.get('__Secure-authjs.session-token') ??
    request.cookies.get('next-auth.session-token') ??
    request.cookies.get('__Secure-next-auth.session-token');
  // ...
}
```
This is already correctly implemented in this repo.

---

### ❌ Sign-in appears to work but nothing happens / stays on login page
**When it happens:** Production deployment only.

**Why #1:** `NEXTAUTH_URL` is set to a deployment-specific preview URL (like `https://claros-abc123xyz-your-org.vercel.app`) instead of your permanent alias URL.

**Fix:** Go to Vercel → Settings → Environment Variables → update `NEXTAUTH_URL` to your permanent alias: `https://YOUR-APP-NAME.vercel.app`. Redeploy.

**Why #2:** NextAuth v5 uses different session cookie names (`authjs.session-token`) than v4 (`next-auth.session-token`). If middleware only checks the v4 cookie name, it doesn't recognise the logged-in session and redirects you back to login.

**Fix:** Already handled in `middleware.ts` by checking all four possible cookie names (see above fix).

---

### ❌ Save Attendance button not visible
**When it happens:** Teacher marks attendance on mobile — all students marked but no save button visible.

**Why:** The save button uses `position: fixed; bottom: 0` which places it directly behind the bottom navigation bar (which is also `position: fixed; bottom: 0` but with a higher z-index).

**Fix:** The save button needs to be `bottom: 64px` (the height of the nav bar) so it sits above it. Already fixed in `components/AttendanceMarker.tsx`.

---

### ❌ Seed hangs at "Seeding attendance…" for 10+ minutes
**When it happens:** Running `npm run db:seed`.

**Why:** The seed script writes ~9,000 attendance records (6 classes × 5 subjects × 15 school days × 20 students) one at a time over a remote network connection. Each write is a separate network round-trip to Neon.

**Fix options:**
1. **Just wait** — on a good connection it takes 3-10 minutes
2. **Kill the seed (Ctrl+C)** if users/classes/students were already seeded — the app works fine without historical attendance
3. **Speed up the seed yourself** (advanced): replace the individual `upsert` calls with `createMany` batches:
   ```ts
   // Instead of one upsert per record in a loop, collect all records then:
   await prisma.attendanceRecord.createMany({ data: allRecords, skipDuplicates: true });
   ```

---

### ❌ Parent attendance stats show 0% / "No records"
**When it happens:** Logging in as a parent after initial setup.

**Why:** Attendance records don't exist yet — either because the seed's attendance section stalled, or because no teacher has saved attendance yet.

**Fix:** Log in as a teacher → Attendance → pick a subject → pick today → mark students → tap **Save Attendance**. The parent view will immediately show updated stats.

---

### ❌ Grade shows "Pending" for parent
**When it happens:** Parent views grades and sees "Pending" next to an assessment.

**Why:** This is correct behaviour, not a bug. When a teacher creates an assessment (e.g. "Quiz 1"), the grade record is created for all students with `score = null`. It shows "Pending" until the teacher enters actual scores.

**Fix:** Log in as the teacher → Grades → select the subject → select the assessment → enter scores for each student → tap **Save Grades**. Parent view will update immediately.

---

### ❌ `postbuild` script causing deployment failure
**When it happens:** Old version of this repo — the `package.json` had a `"postbuild": "prisma migrate deploy"` script.

**Why:** Vercel's production build environment doesn't have database migration files (there are none — this project uses `db push` not `migrate`) so the postbuild script fails.

**Fix:** Remove the `postbuild` entry from `package.json`. Already done in this repo.

---

### ❌ "openssl is not recognised" on Windows when generating secret
**When it happens:** Trying to generate a secret with `openssl rand -base64 32` on Windows.

**Why:** Windows doesn't ship with OpenSSL in PATH by default.

**Fix:** Use the online generator instead: **[generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)**

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 15** (App Router, TypeScript) | Full-stack React with server components and API routes built in |
| Database | **PostgreSQL on Neon** | Serverless Postgres, free tier, connects via standard pg driver |
| ORM | **Prisma 7** + `@prisma/adapter-pg` | Type-safe database queries, auto-generated TypeScript types |
| Auth | **NextAuth.js v5 beta** | JWT sessions, credentials provider, bcrypt password hashing |
| UI | **Tailwind CSS v4** + **shadcn/ui** | Utility-first styling + pre-built accessible components |
| Data fetching | **TanStack React Query v5** | Client-side cache, loading states, mutation handling |
| Validation | **Zod** | Runtime schema validation for all API inputs |
| Hosting | **Vercel** | Zero-config deployment, preview URLs, edge network |
| Icons | **Lucide React** | Clean, consistent icon library |

---

## 📜 Scripts Reference

```bash
npm run dev          # Start local development server (http://localhost:3000)
npm run build        # Build for production (runs prisma generate first)
npm run start        # Start production server after building
npm run db:migrate   # Run pending database migrations
npm run db:seed      # Seed demo data (school, teachers, students, attendance)
npm run db:setup     # Migrate + seed (convenience shortcut)
```

---

## 🧪 Quick Test Checklist After Deployment

Use this to verify everything is working before handing it off:

- [ ] Login page loads at your URL
- [ ] Click **Headmaster** pill → Sign in → lands on headmaster dashboard
- [ ] Headmaster: navigate Students, Teachers, Classes, Subjects
- [ ] Headmaster: Add Subject → searchable teacher dropdown works
- [ ] Headmaster: Link Parent on a student → searchable parent dropdown works
- [ ] Sign out → click **Mr Smith** pill → Sign in → teacher dashboard
- [ ] Teacher: Attendance → select a subject → pick today → mark a few students → **Save Attendance** (button should be visible above the nav bar)
- [ ] Teacher: Attendance → **History tab** → saved session appears
- [ ] Teacher: Grades → select a subject → tap 📊 icon on an assessment → class report shows
- [ ] Sign out → click **Parent 1** pill → Sign in → parent dashboard
- [ ] Parent: Dashboard shows attendance rings (non-zero after teacher saved attendance)
- [ ] Parent: Attendance → records visible
- [ ] Parent: Grades → subject list with assessments

---

*Built with ☕, patience, and a few too many Vercel deploys.*

