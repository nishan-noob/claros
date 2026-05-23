// config/features.ts
//
// HOW TO UNLOCK A FEATURE:
//   Option A (zero code): In Vercel dashboard → Settings → Environment Variables,
//   add NEXT_PUBLIC_FEATURE_<NAME>=true, then redeploy.
//   Option B (one line): Change false → true below, git push. Vercel deploys in ~30s.
//
// Every UI element behind a flag must use <FeatureGate feature="..."> so it
// simply disappears when false — no errors, no broken routes, nothing visible.

const env = (key: string, fallback: boolean): boolean => {
  const val = process.env[`NEXT_PUBLIC_FEATURE_${key}`];
  if (val === 'true') return true;
  if (val === 'false') return false;
  return fallback;
};

export const FEATURES = {
  // ── LAUNCH — always on ────────────────────────────────────────
  ATTENDANCE:             env('ATTENDANCE',             true),
  GRADES:                 env('GRADES',                 true),
  STUDENT_PROFILES:       env('STUDENT_PROFILES',       true),
  PARENT_DASHBOARD:       env('PARENT_DASHBOARD',       true),

  // ── PHASE 2 — flip when ready ────────────────────────────────
  ANNOUNCEMENTS:          env('ANNOUNCEMENTS',          false),
  TIMETABLE:              env('TIMETABLE',              false),
  ATTENDANCE_EXPORT:      env('ATTENDANCE_EXPORT',      false),
  GRADE_REPORT:           env('GRADE_REPORT',           false),

  // ── PHASE 3 — polish / future ────────────────────────────────
  PARENT_TEACHER_CHAT:    env('PARENT_TEACHER_CHAT',    false),
  HOMEWORK_TRACKER:       env('HOMEWORK_TRACKER',       false),
  HEADMASTER_ANALYTICS:   env('HEADMASTER_ANALYTICS',   false),
  BULK_STUDENT_IMPORT:    env('BULK_STUDENT_IMPORT',    false),
} as const;

export type FeatureKey = keyof typeof FEATURES;
