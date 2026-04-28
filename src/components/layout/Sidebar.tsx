'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import type { Profile } from '@/types';

interface SidebarProps {
  profile: Profile | null;
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

const Icons = {
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>,
  Clipboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>,
  Certificate: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  Pen: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>,
  Layout: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>,
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Cap: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
};

const studentNav = [
  { href: '/dashboard/student', icon: Icons.Home, label: 'الرئيسية' },
  { href: '/dashboard/student/opportunities', icon: Icons.Search, label: 'فرص التطوع' },
  { href: '/dashboard/student/applications', icon: Icons.Clipboard, label: 'طلباتي' },
  { href: '/dashboard/student/certificates', icon: Icons.Certificate, label: 'شهاداتي' },
];

const coordinatorNav = [
  { href: '/dashboard/coordinator', icon: Icons.Home, label: 'الرئيسية' },
  { href: '/dashboard/coordinator/opportunities', icon: Icons.Pen, label: 'الفرص التطوعية' },
  { href: '/dashboard/coordinator/applications', icon: Icons.Clipboard, label: 'طلبات الطالبات' },
  { href: '/dashboard/coordinator/certificates', icon: Icons.Certificate, label: 'مراجعة الشهادات' },
  { href: '/dashboard/coordinator/content', icon: Icons.Layout, label: 'إدارة المحتوى' },
];

const commonNav = [
  { href: '/dashboard/notifications', icon: Icons.Bell, label: 'الإشعارات' },
];

export function Sidebar({ profile, isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const role = profile?.role || 'student';
  const navItems = role === 'coordinator' || role === 'super_admin' ? coordinatorNav : studentNav;
  const sectionLabel = role === 'coordinator' || role === 'super_admin' ? 'المنسقة' : 'الطالبات';
  const roleLabel = role === 'coordinator' ? 'منسقة' : role === 'super_admin' ? 'مشرفة عامة' : 'طالبة';

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''} ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar__header">
          <Link href="/" className="sidebar__logo-wrap" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="sidebar__logo-icon">
              <Icons.Cap />
            </div>
            {!isCollapsed && (
              <div className="sidebar__logo-info">
                <div className="sidebar__logo-text">منصة التطوع</div>
                <div className="sidebar__logo-sub">ثانوية طرفة بنت عبدالعزيز</div>
              </div>
            )}
          </Link>
          <button
            className="sidebar__collapse-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'توسيع' : 'تصغير'}
            title={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }}>
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          {!isCollapsed && <div className="sidebar__section">{sectionLabel}</div>}

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="sidebar__item-icon"><Icon /></span>
                {!isCollapsed && <span className="sidebar__item-label">{item.label}</span>}
                {isActive && <span className="sidebar__item-indicator" />}
              </Link>
            );
          })}

          <div className="sidebar__divider" />

          {commonNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="sidebar__item-icon"><Icon /></span>
                {!isCollapsed && <span className="sidebar__item-label">{item.label}</span>}
              </Link>
            );
          })}

          {role === 'super_admin' && (
            <>
              <div className="sidebar__divider" />
              {!isCollapsed && <div className="sidebar__section">الإدارة</div>}
              <Link
                href="/dashboard/admin"
                className={`sidebar__item ${pathname === '/dashboard/admin' ? 'sidebar__item--active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'لوحة الإدارة' : undefined}
              >
                <span className="sidebar__item-icon"><Icons.Lock /></span>
                {!isCollapsed && <span className="sidebar__item-label">لوحة الإدارة</span>}
              </Link>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: { width: '34px', height: '34px' },
                },
              }}
            />
            {!isCollapsed && (
              <div className="sidebar__user-info">
                <div className="sidebar__user-name">{profile?.full_name || 'مستخدم'}</div>
                <div className="sidebar__user-role">{roleLabel}</div>
              </div>
            )}
          </div>
        </div>
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
    </>
  );
}
