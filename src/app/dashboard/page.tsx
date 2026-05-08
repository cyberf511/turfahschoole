import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  let user;
  try {
    user = await currentUser();
  } catch {
    redirect('/sign-in');
  }
  if (!user) redirect('/sign-in');

  const publicMeta = user.publicMetadata as Record<string, unknown> | undefined;
  let currentRole = (publicMeta?.role as string) || 'student';
  let profileCompleted = (publicMeta?.profileCompleted as boolean) ?? false;

  // Admin username override (env var based, protects against stale metadata)
  const allowedAdmins = (process.env.ADMIN_USERNAMES || 'superadmin,admin').split(',').map(s => s.trim().toLowerCase());
  if (currentRole !== 'super_admin' && allowedAdmins.includes(user.username?.toLowerCase() || '')) {
    currentRole = 'super_admin';
    profileCompleted = true; // admins bypass onboarding
  }

  if (currentRole === 'super_admin') {
    redirect('/dashboard/admin');
  }

  if (!profileCompleted) {
    redirect('/onboarding');
  }

  if (currentRole === 'coordinator') {
    redirect('/dashboard/coordinator');
  }

  redirect('/dashboard/student');
}
