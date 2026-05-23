'use client';

import { BottomNav } from '@/components/BottomNav';
import { LayoutDashboard, ClipboardList, BookOpen, Users } from 'lucide-react';
import { GraduationCap } from 'lucide-react';
import { signOut } from 'next-auth/react';

const teacherNavItems = [
  { href: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/teacher/attendance', icon: ClipboardList, label: 'Attendance' },
  { href: '/teacher/grades', icon: BookOpen, label: 'Grades' },
  { href: '/teacher/students', icon: Users, label: 'Students' },
];

export function TeacherShell({
  children,
  teacherName,
}: {
  children: React.ReactNode;
  teacherName: string;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">Claros</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-xs text-slate-500 hover:text-red-600 transition-colors"
        >
          Sign out
        </button>
      </header>
      <main className="flex-1 overflow-auto pb-20">{children}</main>
      <BottomNav items={teacherNavItems} />
    </div>
  );
}
