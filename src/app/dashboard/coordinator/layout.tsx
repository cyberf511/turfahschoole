import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  let role = (user.publicMetadata as Record<string, unknown> | undefined)?.role as string | undefined;

  // Fallback: query Supabase if publicMetadata not set (legacy users)
  if (!role) {
    const supabase = await createServerSupabase();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    role = profile?.role;
  }

  if (!role || (role !== 'coordinator' && role !== 'super_admin')) {
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
