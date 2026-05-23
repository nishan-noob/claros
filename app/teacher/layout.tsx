import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TeacherShell } from './TeacherShell';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') redirect('/login');
  return <TeacherShell teacherName={session.user.name}>{children}</TeacherShell>;
}
