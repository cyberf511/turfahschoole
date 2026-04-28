'use client';

import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

export function LandingNav() {
  const { theme, toggleTheme } = useTheme();
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <nav className="landing-nav">
      <div className="landing-nav__inner">
        <Link href="/" className="landing-nav__logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none', color: 'inherit' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          ثانوية طرفة بنت عبدالعزيز
        </Link>
        <div className="landing-nav__actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="تبديل الثيم"
            title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '50%', transition: 'all 0.2s ease'
            }}
          >
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>
          
          {isLoaded && isSignedIn && user ? (
            <Link href="/dashboard" className="btn btn--secondary btn--sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
              <div className="avatar avatar--sm" style={{ width: '24px', height: '24px', fontSize: '0.8rem', background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>
                {user.hasImage ? (
                  <img src={user.imageUrl} alt={user.firstName || 'User'} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  (user.firstName?.[0] || user.username?.[0] || '؟')
                )}
              </div>
              <span style={{ fontWeight: 600 }}>{user.firstName || 'لوحة التحكم'}</span>
            </Link>
          ) : isLoaded ? (
            <Link href="/sign-in" className="btn btn--primary btn--sm">
              تسجيل الدخول
            </Link>
          ) : (
            <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: 'var(--radius-full)' }} />
          )}
        </div>
      </div>
    </nav>
  );
}
