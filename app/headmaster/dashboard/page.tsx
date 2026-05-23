import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';
import { startOfMonth } from 'date-fns';

async function getStats() {
  const [totalStudents, totalTeachers, totalClasses, attendanceRecords, recentGrades] =
    await Promise.all([
      prisma.student.count({ where: { active: true } }),
      prisma.user.count({ where: { role: 'TEACHER', active: true } }),
      prisma.class.count(),
      prisma.attendanceRecord.findMany({
        where: { session: { date: { gte: startOfMonth(new Date()) } } },
        select: { status: true },
      }),
      prisma.studentGrade.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { score: { not: null } },
        select: {
          score: true,
          assessment: { select: { title: true, maxScore: true, subject: { select: { name: true, class: { select: { name: true } } } } } },
          student: { select: { name: true } },
          createdAt: true,
        },
      }),
    ]);

  const present = attendanceRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absent = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
  const total = present + absent;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

  return { totalStudents, totalTeachers, totalClasses, attendanceRate, recentGrades };
}

export default async function HeadmasterDashboard() {
  const { totalStudents, totalTeachers, totalClasses, attendanceRate, recentGrades } =
    await getStats();

  const stats = [
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Teachers', value: totalTeachers, icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Classes', value: totalClasses, icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
    { label: 'Attendance Rate (Month)', value: `${attendanceRate}%`, icon: TrendingUp, color: attendanceRate >= 90 ? 'text-emerald-600 bg-emerald-50' : attendanceRate >= 75 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">ABC Primary School · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="text-sm text-slate-500 mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Recent Grade Activity</h2>
        {recentGrades.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-400 text-sm">
              No grades recorded yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentGrades.map((g, i) => {
              const pct = g.score !== null ? Math.round((g.score / g.assessment.maxScore) * 100) : 0;
              return (
                <Card key={i}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{g.student.name}</p>
                      <p className="text-xs text-slate-500">
                        {g.assessment.title} · {g.assessment.subject.name} · {g.assessment.subject.class.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700">{g.score}/{g.assessment.maxScore}</p>
                      <p className="text-xs text-slate-400">{pct}%</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
