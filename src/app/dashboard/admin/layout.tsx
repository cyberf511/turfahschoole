import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  const role = (user.publicMetadata as Record<string, unknown> | undefined)?.role as string | undefined;

  // Return 404-like page for non-admins to keep panel hidden
  if (role !== 'super_admin') {
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
