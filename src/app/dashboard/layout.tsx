'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { getProfile } from '@/actions/profile';
import type { Profile } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    getProfile()
      .then((res) => {
        if (res.success && res.data) setProfile(res.data);
      })
      .catch(() => {
        // Profile fetch failed, user will see sidebar without profile
      });
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved === 'true') setSidebarCollapsed(true);
    } catch {
      // Storage unavailable
    }
  }, []);

  const toggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      try { localStorage.setItem('sidebar-collapsed', String(!prev)); } catch { /* noop */ }
      return !prev;
    });
  };

  return (
    <div className={`dashboard-layout ${sidebarCollapsed ? 'dashboard-layout--collapsed' : ''}`}>
      <Sidebar
        profile={profile}
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={toggleCollapse}
      />
      <div className="dashboard-main">
        <TopNav onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="dashboard-content animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
