'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Loader2, Zap } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Headmaster', email: 'headmaster@abc.school', color: 'bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-200' },
  { label: 'Mr Smith', email: 'mrsmith@abc.school', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200' },
  { label: 'Ms Jones', email: 'msjones@abc.school', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200' },
  { label: 'Ms Brown', email: 'msbrown@abc.school', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200' },
  { label: 'Ms Taylor', email: 'mstaylor@abc.school', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200' },
  { label: 'Parent 1', email: 'parent1@abc.school', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200' },
  { label: 'Parent 2', email: 'parent2@abc.school', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200' },
  { label: 'Parent 3', email: 'parent3@abc.school', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword('password');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error === 'CallbackRouteError') {
        setError('Your account has been deactivated. Contact the school.');
      } else if (result?.error) {
        setError('Invalid email or password.');
      } else if (result?.ok) {
        // Fetch session to determine role-based redirect
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        const role = session?.user?.role;
        if (role === 'HEADMASTER') router.push('/headmaster/dashboard');
        else if (role === 'TEACHER') router.push('/teacher/dashboard');
        else if (role === 'PARENT') router.push('/parent/dashboard');
        else router.push('/login');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-3">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Claros</h1>
          <p className="text-sm text-slate-500 mt-1">School Attendance & Grade Management</p>
        </div>

        {/* Demo quick-fill */}
        <Card className="border-dashed border-amber-300 bg-amber-50/60">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Demo — click to fill</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => fillDemo(a.email)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${a.color} ${email === a.email ? 'ring-2 ring-offset-1 ring-current' : ''}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-amber-600 mt-2 opacity-70">All passwords: <span className="font-mono font-semibold">password</span></p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign in</CardTitle>
            <CardDescription>Enter your school credentials to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@abc.school"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">
          ABC Primary School · Claros v1
        </p>
      </div>
    </div>
  );
}
