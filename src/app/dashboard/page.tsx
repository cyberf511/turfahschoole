import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, profile_completed')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/');
  }

  let currentRole = profile.role;
  
  // Auto-heal super_admin role if they created the account before the webhook update
  const allowedAdmins = ['admin', 'super_admin', 'superadmin'];
  
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
