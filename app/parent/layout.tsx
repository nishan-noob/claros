import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ParentShell } from './ParentShell';

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== 'PARENT') redirect('/login');
  return <ParentShell>{children}</ParentShell>;
}
