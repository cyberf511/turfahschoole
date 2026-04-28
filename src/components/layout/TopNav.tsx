'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';

interface TopNavProps {
  onMenuToggle: () => void;
  unreadCount?: number;
}

export function TopNav({ onMenuToggle, unreadCount = 0 }: TopNavProps) {
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const firstName = user?.firstName || 'مستخدم';
  const email = user?.primaryEmailAddress?.emailAddress || '';

  return (
    <header className="topnav">
      <div className="topnav__inner">
        {/* Mobile Hamburger */}
        <button className="topnav__hamburger" onClick={onMenuToggle} aria-label="القائمة">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        {/* Search */}
        <div className="topnav__search">
          <svg className="topnav__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" placeholder="ابحث في المنصة..." className="topnav__search-input" />
        </div>

        <div className="topnav__spacer"></div>

        {/* Actions Container */}
        <div className="topnav__actions">
          {/* Theme toggle */}
          <button className="topnav__btn theme-toggle" onClick={toggleTheme} aria-label="تبديل الثيم" title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}>
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>

          {/* Notifications */}
          <div className="notif-bell" ref={notifRef}>
            <button className="topnav__btn" onClick={() => setShowNotifs(!showNotifs)} aria-label="الإشعارات" title="الإشعارات">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              {unreadCount > 0 && <span className="notif-bell__count">{unreadCount}</span>}
            </button>
            {showNotifs && (
              <div className="notif-dropdown">
                <div className="notif-dropdown__header">
                  <span className="notif-dropdown__title">الإشعارات</span>
                  <Link href="/notifications" className="notif-dropdown__link" onClick={() => setShowNotifs(false)}>
                    عرض الكل
                  </Link>
                </div>
                <div className="notif-dropdown__empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', opacity: 0.5 }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  <p>لا توجد إشعارات جديدة</p>
                </div>
              </div>
            )}
          </div>

          <div className="topnav__divider"></div>

          {/* User info */}
          <div className="topnav__user">
            <div className="topnav__greeting-wrap">
              <span className="topnav__greeting">مرحباً، {firstName}</span>
              <span className="topnav__role-hint" title={email}>{email}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
