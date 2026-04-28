'use client';

import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';

export function LandingNav() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="landing-nav">
      <div className="landing-nav__inner">
        <span className="landing-nav__logo">🎓 ثانوية طرفة بنت عبدالعزيز</span>
        <div className="landing-nav__actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="تبديل الثيم"
            title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link href="/sign-in" className="btn btn--primary btn--sm">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </nav>
  );
}
