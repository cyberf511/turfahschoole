'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Profile } from '@/types';

interface SidebarProps {
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
}

const studentNav = [
  { href: '/dashboard/student', icon: '🏠', label: 'الرئيسية' },
  { href: '/dashboard/student/opportunities', icon: '🔍', label: 'فرص التطوع' },
  { href: '/dashboard/student/applications', icon: '📋', label: 'طلباتي' },
  { href: '/dashboard/student/certificates', icon: '📄', label: 'شهاداتي' },
];

const coordinatorNav = [
  { href: '/dashboard/coordinator', icon: '🏠', label: 'الرئيسية' },
  { href: '/dashboard/coordinator/opportunities', icon: '📝', label: 'إدارة الفرص' },
  { href: '/dashboard/coordinator/applications', icon: '📋', label: 'مراجعة الطلبات' },
  { href: '/dashboard/coordinator/certificates', icon: '✅', label: 'مراجعة الشهادات' },
  { href: '/dashboard/coordinator/content', icon: '🎨', label: 'إدارة المحتوى' },
];

export function Sidebar({ profile, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const role = profile?.role || 'student';

  const navItems = role === 'coordinator' || role === 'super_admin'
    ? coordinatorNav
    : studentNav;

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)
    : '؟';

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar__header">
        <span className="sidebar__logo">⭐ ثانوية طرفة</span>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section">
          {role === 'coordinator' || role === 'super_admin' ? 'لوحة المنسق' : 'لوحة الطالب'}
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar__item ${pathname === item.href ? 'sidebar__item--active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar__item-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {role === 'super_admin' && (
          <>
            <div className="sidebar__section">المشرف العام</div>
            <Link
              href="/admin"
              className={`sidebar__item ${pathname === '/admin' ? 'sidebar__item--active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar__item-icon">👑</span>
              إدارة المستخدمين
            </Link>
          </>
        )}

        <div className="sidebar__section">عام</div>
        <Link
          href="/notifications"
          className={`sidebar__item ${pathname === '/notifications' ? 'sidebar__item--active' : ''}`}
          onClick={onClose}
        >
          <span className="sidebar__item-icon">🔔</span>
          الإشعارات
        </Link>
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="avatar avatar--sm">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" />
            ) : (
              initials
            )}
          </div>
          <div>
            <div className="sidebar__user-name">{profile?.full_name || 'مستخدم'}</div>
            <div className="sidebar__user-role">
              {role === 'super_admin' ? 'المشرف العام' : role === 'coordinator' ? 'منسق التطوع' : 'طالب'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
