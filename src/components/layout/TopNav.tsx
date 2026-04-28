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

  const firstName = user?.firstName || '';

  return (
    <header className="topnav">
      {/* Right side: hamburger + welcome */}
      <div className="topnav__right">
        <button className="topnav__hamburger" onClick={onMenuToggle} aria-label="القائمة">
          ☰
        </button>
        <div className="topnav__welcome">
          <span className="topnav__greeting">مرحباً، {firstName}</span>
          <span className="topnav__role-hint">{user?.primaryEmailAddress?.emailAddress || ''}</span>
        </div>
      </div>

      {/* Left side: search + actions */}
      <div className="topnav__left">
        {/* Search placeholder */}
        <div className="topnav__search">
          <span className="topnav__search-icon">🔍</span>
          <input type="text" placeholder="ابحث..." className="topnav__search-input" />
        </div>

        {/* Theme toggle */}
        <button className="theme-toggle" onClick={toggleTheme} aria-label="تبديل الثيم">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Notifications */}
        <div className="notif-bell" ref={notifRef}>
          <button onClick={() => setShowNotifs(!showNotifs)} aria-label="الإشعارات">
            🔔
            {unreadCount > 0 && <span className="notif-bell__count">{unreadCount}</span>}
          </button>
          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-dropdown__header">
                <span className="notif-dropdown__title">الإشعارات</span>
                <Link href="/notifications" className="btn btn--ghost btn--sm" onClick={() => setShowNotifs(false)}>
                  عرض الكل
                </Link>
              </div>
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                لا توجد إشعارات جديدة
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
