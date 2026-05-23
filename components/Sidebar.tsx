'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FlaskConical,
  UserCog,
  Megaphone,
  BarChart3,
  GraduationCap as Logo,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FEATURES } from '@/config/features';
import { useState } from 'react';

type NavItem = { href: string; icon: LucideIcon; label: string };

const navItems: NavItem[] = [
  { href: '/headmaster/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/headmaster/students', icon: Users, label: 'Students' },
  { href: '/headmaster/teachers', icon: GraduationCap, label: 'Teachers' },
  { href: '/headmaster/classes', icon: BookOpen, label: 'Classes' },
  { href: '/headmaster/subjects', icon: FlaskConical, label: 'Subjects' },
  { href: '/headmaster/accounts', icon: UserCog, label: 'Accounts' },
  ...(FEATURES.ANNOUNCEMENTS
    ? [{ href: '/headmaster/announcements', icon: Megaphone, label: 'Announcements' }]
    : []),
  ...(FEATURES.HEADMASTER_ANALYTICS
    ? [{ href: '/headmaster/analytics', icon: BarChart3, label: 'Analytics' }]
    : []),
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0 transition-all duration-200',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Logo className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <span className="font-bold text-slate-900 text-lg">Claros</span>}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 space-y-1">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && 'Sign out'}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-100 w-full transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
            <Logo className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">Claros</span>
        </div>
        <MobileMenu navItems={navItems} pathname={pathname} />
      </header>
    </>
  );
}

function MobileMenu({
  navItems,
  pathname,
}: {
  navItems: NavItem[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
      >
        <div className="w-5 h-0.5 bg-current mb-1" />
        <div className="w-5 h-0.5 bg-current mb-1" />
        <div className="w-5 h-0.5 bg-current" />
      </button>

      {open && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-slate-200 shadow-md z-40 px-4 py-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium',
                  active ? 'text-indigo-600' : 'text-slate-600'
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-600 w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      )}
    </>
  );
}
