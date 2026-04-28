'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
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
  { href: '/dashboard/student/certificates', icon: '📜', label: 'شهاداتي' },
];

const coordinatorNav = [
  { href: '/dashboard/coordinator', icon: '🏠', label: 'الرئيسية' },
  { href: '/dashboard/coordinator/opportunities', icon: '📝', label: 'الفرص التطوعية' },
  { href: '/dashboard/coordinator/applications', icon: '📋', label: 'طلبات الطالبات' },
  { href: '/dashboard/coordinator/certificates', icon: '✅', label: 'مراجعة الشهادات' },
  { href: '/dashboard/coordinator/content', icon: '🎨', label: 'إدارة المحتوى' },
];

const commonNav = [
  { href: '/notifications', icon: '🔔', label: 'الإشعارات' },
];

export function Sidebar({ profile, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const role = profile?.role || 'student';
  const navItems = role === 'coordinator' || role === 'super_admin' ? coordinatorNav : studentNav;
  const roleLabel = role === 'coordinator' ? 'المنسقة' : role === 'super_admin' ? 'مشرفة عامة' : 'الطالبات';
  const sectionLabel = role === 'coordinator' || role === 'super_admin' ? 'المنسقة' : 'الطالبات';

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Logo */}
        <div className="sidebar__header">
          <div className="sidebar__logo-wrap">
            <div className="sidebar__logo-icon">🎓</div>
            <div>
              <div className="sidebar__logo-text">منصة التطوع</div>
              <div className="sidebar__logo-sub">ثانوية طرفة بنت عبدالعزيز</div>
            </div>
          </div>
        </div>

        <nav className="sidebar__nav">
          {/* Section label */}
          <div className="sidebar__section">{sectionLabel}</div>

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                onClick={onClose}
              >
                <span className="sidebar__item-icon">{item.icon}</span>
                <span className="sidebar__item-label">{item.label}</span>
                {isActive && <span className="sidebar__item-indicator" />}
              </Link>
            );
          })}

          {/* Common nav */}
          <div className="sidebar__divider" />
          {commonNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                onClick={onClose}
              >
                <span className="sidebar__item-icon">{item.icon}</span>
                <span className="sidebar__item-label">{item.label}</span>
              </Link>
            );
          })}

          {role === 'super_admin' && (
            <>
              <div className="sidebar__divider" />
              <div className="sidebar__section">الإدارة</div>
              <Link
                href="/admin"
                className={`sidebar__item ${pathname === '/admin' ? 'sidebar__item--active' : ''}`}
                onClick={onClose}
              >
                <span className="sidebar__item-icon">🔒</span>
                <span className="sidebar__item-label">لوحة الإدارة</span>
              </Link>
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: { width: '36px', height: '36px' },
                },
              }}
            />
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{profile?.full_name || 'مستخدم'}</div>
              <div className="sidebar__user-role">{roleLabel}</div>
            </div>
          </div>
        </div>
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
    </>
  );
}
