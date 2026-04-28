'use client';

import useSWR from 'swr';
import { Loading } from '@/components/ui/Loading';
import { getCoordinatorStats } from '@/actions/stats';
import Link from 'next/link';
import { Plus, FileText, Clock, Award, ClipboardList } from 'lucide-react';

export default function CoordinatorDashboard() {
  const { data: res, error } = useSWR('coordinator-stats', getCoordinatorStats);
  
  const stats = res?.success && res.data ? res.data : { opportunities: 0, pendingApps: 0, pendingCerts: 0, totalApps: 0 };
  const loading = !res && !error;

  if (loading) return <Loading />;

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">لوحة المنسقة</h1>
          <p className="section-subtitle">نظرة عامة على برنامج التطوع</p>
        </div>
        <Link href="/dashboard/coordinator/opportunities/new" className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> إنشاء فرصة جديدة
        </Link>
      </div>

      <div className="grid-4 stagger-children" style={{ marginBottom: '24px' }}>
        <div className="stats-card animate-slide-up">
          <div className="stats-card__icon stats-card__icon--blue"><FileText size={28} /></div>
          <div className="stats-card__info">
            <div className="stats-card__label">الفرص</div>
            <div className="stats-card__value">{stats.opportunities}</div>
          </div>
        </div>
        <div className="stats-card animate-slide-up">
          <div className="stats-card__icon stats-card__icon--amber"><Clock size={28} /></div>
          <div className="stats-card__info">
            <div className="stats-card__label">طلبات بانتظار المراجعة</div>
            <div className="stats-card__value">{stats.pendingApps}</div>
          </div>
        </div>
        <div className="stats-card animate-slide-up">
          <div className="stats-card__icon stats-card__icon--purple"><Award size={28} /></div>
          <div className="stats-card__info">
            <div className="stats-card__label">شهادات بانتظار التحقق</div>
            <div className="stats-card__value">{stats.pendingCerts}</div>
          </div>
        </div>
        <div className="stats-card animate-slide-up">
          <div className="stats-card__icon stats-card__icon--green"><ClipboardList size={28} /></div>
          <div className="stats-card__info">
            <div className="stats-card__label">إجمالي الطلبات</div>
            <div className="stats-card__value">{stats.totalApps}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid-3 stagger-children">
        <Link href="/dashboard/coordinator/applications" className="card card--hover animate-slide-up" style={{ textDecoration: 'none' }}>
          <div className="card__header">
            <h3 className="card__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ClipboardList size={20} /> مراجعة الطلبات</h3>
          </div>
          <p className="card__body">
            {stats.pendingApps > 0
              ? `لديك ${stats.pendingApps} طلبات بانتظار المراجعة`
              : 'لا توجد طلبات معلقة'}
          </p>
        </Link>

        <Link href="/dashboard/coordinator/certificates" className="card card--hover animate-slide-up" style={{ textDecoration: 'none' }}>
          <div className="card__header">
            <h3 className="card__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={20} /> مراجعة الشهادات</h3>
          </div>
          <p className="card__body">
            {stats.pendingCerts > 0
              ? `لديك ${stats.pendingCerts} شهادات بانتظار التحقق`
              : 'لا توجد شهادات معلقة'}
          </p>
        </Link>

        <Link href="/dashboard/coordinator/opportunities" className="card card--hover animate-slide-up" style={{ textDecoration: 'none' }}>
          <div className="card__header">
            <h3 className="card__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20} /> إدارة الفرص</h3>
          </div>
          <p className="card__body">إدارة وتعديل فرص التطوع المتاحة</p>
        </Link>
      </div>
    </div>
  );
}
