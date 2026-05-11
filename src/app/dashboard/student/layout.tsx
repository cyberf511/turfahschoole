import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  let user;
  try {
    user = await currentUser();
  } catch {
    redirect('/sign-in');
  }
  if (!user) redirect('/sign-in');

  let supabase;
  try {
    supabase = await createServerSupabase();
  } catch {
    redirect('/sign-in');
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'student' && profile.role !== 'super_admin')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '16px' }}>404</h1>
          <p>الصفحة غير موجودة</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
