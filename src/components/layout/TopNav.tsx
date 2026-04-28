'use client';

import { useState, useEffect, useRef } from 'react';
import { UserButton } from '@clerk/nextjs';
import { useTheme } from '@/components/ThemeProvider';
import { getNotifications, markAsRead } from '@/actions/notifications';
import { getRelativeTime } from '@/lib/utils';
import type { Profile, Notification } from '@/types';
import Link from 'next/link';

interface TopNavProps {
  profile: Profile | null;
  onMenuClick: () => void;
}

export function TopNav({ profile, onMenuClick }: TopNavProps) {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    getNotifications().then((res) => {
      if (res.success && res.data) setNotifications(res.data);
    });
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleReadNotif = async (id: string) => {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const roleLabel = profile?.role === 'super_admin'
    ? 'المشرف العام'
    : profile?.role === 'coordinator'
    ? 'منسق التطوع'
    : 'طالب';

  return (
    <header className="topnav">
      <div className="flex-gap">
        <button className="topnav__hamburger" onClick={onMenuClick} aria-label="القائمة">
          ☰
        </button>
        <div>
          <div className="topnav__title">
            مرحباً، {profile?.full_name || 'مستخدم'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {roleLabel}
          </div>
        </div>
      </div>

      <div className="topnav__right">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="تبديل الثيم"
          title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <div className="dropdown" ref={notifRef}>
          <button
            className="notif-bell"
            onClick={() => setShowNotifs(!showNotifs)}
            aria-label="الإشعارات"
          >
            🔔
            {unreadCount > 0 && (
              <span className="notif-bell__count">{unreadCount}</span>
            )}
          </button>

          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-dropdown__header">
                <span className="notif-dropdown__title">الإشعارات</span>
                <Link
                  href="/notifications"
                  style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}
                  onClick={() => setShowNotifs(false)}
                >
                  عرض الكل
                </Link>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  لا توجد إشعارات
                </div>
              ) : (
                notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    className={`notif-item ${!notif.is_read ? 'notif-item--unread' : ''}`}
                    onClick={() => handleReadNotif(notif.id)}
                  >
                    <div className="notif-item__content">
                      <div className="notif-item__title">{notif.title}</div>
                      <div className="notif-item__message">{notif.message}</div>
                      <div className="notif-item__time">{getRelativeTime(notif.created_at)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <UserButton
          appearance={{
            elements: {
              avatarBox: { width: '36px', height: '36px' },
            },
          }}
        />
      </div>
    </header>
  );
}
