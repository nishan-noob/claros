import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const session = await auth();

  if (!session) redirect('/login');

  switch (session.user.role) {
    case 'HEADMASTER': redirect('/headmaster/dashboard');
    case 'TEACHER': redirect('/teacher/dashboard');
    case 'PARENT': redirect('/parent/dashboard');
    default: redirect('/login');
  }
}
