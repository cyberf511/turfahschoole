'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { getProfile } from '@/actions/profile';
import type { Profile } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    getProfile().then((res) => {
      if (res.success && res.data) setProfile(res.data);
    });
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar
        profile={profile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
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
