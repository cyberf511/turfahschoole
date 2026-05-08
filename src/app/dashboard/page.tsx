import { redirect } from 'next/navigation';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function DashboardPage() {
  let user;
  try {
    user = await currentUser();
  } catch {
    redirect('/sign-in');
  }
  if (!user) redirect('/sign-in');

  const publicMeta = user.publicMetadata as Record<string, unknown> | undefined;
  let currentRole = (publicMeta?.role as string) || '';
  let profileCompleted = (publicMeta?.profileCompleted as boolean) ?? false;

  // Fallback: query Supabase if publicMetadata not set (legacy users)
  const allowedAdmins = (process.env.ADMIN_USERNAMES || 'superadmin,admin').split(',').map(s => s.trim().toLowerCase());

  if (!currentRole) {
    const supabase = await createServerSupabase();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, profile_completed')
      .eq('id', user.id)
      .single();

    if (profile) {
      currentRole = profile.role;
      profileCompleted = profile.profile_completed;
      // Sync to Clerk for instant access on next visit
      try {
        const client = await clerkClient();
        await client.users.updateUser(user.id, {
          publicMetadata: { role: profile.role, profileCompleted: profile.profile_completed },
        });
      } catch {}
    }
  }

  // Admin username override (env var based, protects against stale metadata)
  if (currentRole !== 'super_admin' && allowedAdmins.includes(user.username?.toLowerCase() || '')) {
    currentRole = 'super_admin';
    profileCompleted = true; // admins bypass onboarding
  }

  if (!currentRole) {
    redirect('/');
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
