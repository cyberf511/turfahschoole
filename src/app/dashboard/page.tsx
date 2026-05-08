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

  let supabase, profile;
  try {
    supabase = await createServerSupabase();
    const result = await supabase
      .from('profiles')
      .select('role, profile_completed')
      .eq('id', user.id)
      .single();
    profile = result.data;
  } catch {
    redirect('/');
  }

  if (!profile) {
    redirect('/');
  }

  let currentRole = profile.role;
  
  // Auto-heal super_admin role if they created the account before the webhook update
  const allowedAdmins = (process.env.ADMIN_USERNAMES || 'superadmin,admin').split(',').map(s => s.trim().toLowerCase());
  
  if (
    currentRole !== 'super_admin' && 
    allowedAdmins.includes(user.username?.toLowerCase() || '')
  ) {
    try {
      await supabase!.from('profiles').update({ role: 'super_admin' }).eq('id', user.id);
    } catch { /* non-critical auto-heal */ }
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
