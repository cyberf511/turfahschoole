'use client';

import { ThemeProvider } from '@/components/ThemeProvider';

export function ClerkFallback() {
  return (
    <ThemeProvider>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', fontFamily: 'Cairo, sans-serif', textAlign: 'center', padding: '24px' }}>
        <div>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>⚠</div>
          <h2 style={{ color: '#111827', margin: '0 0 8px', fontSize: '1.25rem' }}>حدث خطأ في تحميل النظام</h2>
          <p style={{ color: '#6b7280', margin: '0 0 24px', fontSize: '0.95rem' }}>يرجى تحديث الصفحة والمحاولة مرة أخرى</p>
          <button onClick={() => window.location.reload()} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>تحديث الصفحة</button>
        </div>
      </div>
    </ThemeProvider>
  );
}
