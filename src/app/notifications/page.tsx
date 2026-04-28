'use client';

import { useEffect, useState } from 'react';
import { getNotifications, markAsRead, markAllAsRead } from '@/actions/notifications';
import type { Notification } from '@/types';
import { getRelativeTime } from '@/lib/utils';

const typeIcons: Record<string, string> = {
  application_submitted: '📋',
  application_approved: '✅',
  application_rejected: '❌',
  certificate_uploaded: '📄',
  certificate_verified: '🏆',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications().then((res) => {
      if (res.success) setNotifications(res.data || []);
      setLoading(false);
    });
  }, []);

  const handleRead = async (id: string) => {
    await markAsRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleReadAll = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner loading-spinner--lg" /></div>;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }} className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">🔔 الإشعارات</h1>
          <p className="section-subtitle">
            {unreadCount > 0 ? `لديك ${unreadCount} إشعارات غير مقروءة` : 'جميع الإشعارات مقروءة'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn--secondary btn--sm" onClick={handleReadAll}>
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state__icon">🔔</div>
          <div className="empty-state__title">لا توجد إشعارات</div>
          <div className="empty-state__desc">ستظهر هنا إشعاراتك عند وجود تحديثات</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`card card--hover ${!notif.is_read ? '' : ''}`}
              style={{
                cursor: 'pointer',
                background: !notif.is_read ? 'var(--accent-primary-soft)' : undefined,
                borderColor: !notif.is_read ? 'var(--accent-primary)' : undefined,
              }}
              onClick={() => handleRead(notif.id)}
            >
              <div className="flex-gap">
                <span style={{ fontSize: '1.3rem' }}>{typeIcons[notif.type] || '🔔'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>
                    {notif.title}
                    {!notif.is_read && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', marginInlineStart: '8px' }} />}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{notif.message}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    {getRelativeTime(notif.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
