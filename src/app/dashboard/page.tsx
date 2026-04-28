import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminSupabase } from '@/lib/supabase/admin';

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  const supabase = createAdminSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, profile_completed')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  if (profile.role === 'super_admin') {
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
