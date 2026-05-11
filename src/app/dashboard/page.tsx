import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function DashboardPage() {
  let user;
  try {
    user = await currentUser();
  } catch {
    redirect('/sign-in');
  }
  if (!user) redirect('/sign-in');

  const supabase = await createServerSupabase();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, profile_completed')
    .eq('id', user.id)
    .single();

  if (!profile || profileError) {
    redirect('/');
  }

  let currentRole = profile.role;

  const allowedAdmins = (process.env.ADMIN_USERNAMES || 'superadmin,admin').split(',').map(s => s.trim().toLowerCase());

  if (
    currentRole !== 'super_admin' &&
    allowedAdmins.includes(user.username?.toLowerCase() || '')
  ) {
    await supabase.from('profiles').update({ role: 'super_admin' }).eq('id', user.id);
    currentRole = 'super_admin';
  }

  if (currentRole === 'super_admin') {
    redirect('/dashboard/admin');
  }

  if (!profile.profile_completed) {
    redirect('/onboarding');
  }

  if (profile.role === 'coordinator') {
    redirect('/dashboard/coordinator');
  }

  redirect('/dashboard/student');
}
