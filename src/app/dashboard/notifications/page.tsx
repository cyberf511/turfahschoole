'use client';

import { useEffect, useState } from 'react';
import { Loading } from '@/components/ui/Loading';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNotifications, markAsRead, markAllAsRead } from '@/actions/notifications';
import type { Notification } from '@/types';
import { getRelativeTime } from '@/lib/utils';

// Premium SVG Icons
const Icons = {
  submitted: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  approved: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  rejected: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  certificate: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  bell: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
};

const getIconForType = (type: string) => {
  if (type.includes('approved') || type.includes('verified')) return <Icons.approved />;
  if (type.includes('rejected')) return <Icons.rejected />;
  if (type.includes('certificate')) return <Icons.certificate />;
  return <Icons.submitted />;
};

export default function NotificationsPage() {
  const router = useRouter();
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

  if (loading) return <Loading />;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0' }}>
      
      {/* Back Button */}
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => router.back()} className="btn btn--secondary btn--sm" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
          <Icons.back />
          العودة للوحة القيادة
        </button>
      </div>

      <div className="dash-card-wrap">
        <div className="dash-card-wrap__header" style={{ marginBottom: '24px', alignItems: 'center' }}>
          <div>
            <h1 className="dash-card-wrap__title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}>
              <Icons.bell />
              الإشعارات
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
              {unreadCount > 0 ? `لديك ${unreadCount} إشعارات غير مقروءة بانتظارك` : 'تمت قراءة جميع الإشعارات بنجاح'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn--primary btn--sm" onClick={handleReadAll}>
              تحديد الكل كمقروء
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <div className="empty-state__icon" style={{ opacity: 0.5, marginBottom: '16px' }}><Icons.bell /></div>
            <div className="empty-state__title">صندوق الإشعارات فارغ</div>
            <div className="empty-state__desc">لا يوجد أي جديد لعرضه حالياً، سنعلمك بأي تحديثات قريباً.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleRead(notif.id)}
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  background: notif.is_read ? 'var(--bg-primary)' : 'var(--accent-primary-soft)',
                  border: `1px solid ${notif.is_read ? 'var(--border)' : 'var(--accent-primary)'}`,
                  cursor: notif.is_read ? 'default' : 'pointer',
                  transition: 'all var(--transition-fast)',
                  boxShadow: notif.is_read ? 'none' : '0 4px 12px rgba(59,130,246,0.05)'
                }}
              >
                <div style={{ 
                  width: '48px', height: '48px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'var(--bg-tertiary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getIconForType(notif.type)}
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {notif.title}
                      {!notif.is_read && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                      {getRelativeTime(notif.created_at)}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {notif.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
