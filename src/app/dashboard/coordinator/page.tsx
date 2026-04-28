'use client';

import { useEffect, useState } from 'react';
import { getAllApplications } from '@/actions/applications';
import { getCertificatesForReview } from '@/actions/certificates';
import { getOpportunities } from '@/actions/opportunities';
import Link from 'next/link';

export default function CoordinatorDashboard() {
  const [stats, setStats] = useState({ opportunities: 0, pendingApps: 0, pendingCerts: 0, totalApps: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOpportunities(false),
      getAllApplications('pending'),
      getCertificatesForReview(),
      getAllApplications(),
    ]).then(([oppsRes, pendingRes, certsRes, allAppsRes]) => {
      setStats({
        opportunities: oppsRes.data?.length || 0,
        pendingApps: pendingRes.data?.length || 0,
        pendingCerts: certsRes.data?.length || 0,
        totalApps: allAppsRes.data?.length || 0,
      });
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="page-loading"><div className="loading-spinner loading-spinner--lg" /></div>;

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">لوحة المنسق</h1>
          <p className="section-subtitle">نظرة عامة على برنامج التطوع</p>
        </div>
        <Link href="/dashboard/coordinator/opportunities/new" className="btn btn--primary">
          ➕ إنشاء فرصة جديدة
        </Link>
      </div>

      <div className="grid-4 stagger-children" style={{ marginBottom: '24px' }}>
        <div className="stats-card animate-slide-up">
          <div className="stats-card__icon stats-card__icon--blue">📝</div>
          <div className="stats-card__info">
            <div className="stats-card__label">الفرص</div>
            <div className="stats-card__value">{stats.opportunities}</div>
          </div>
        </div>
        <div className="stats-card animate-slide-up">
          <div className="stats-card__icon stats-card__icon--amber">⏳</div>
          <div className="stats-card__info">
            <div className="stats-card__label">طلبات بانتظار المراجعة</div>
            <div className="stats-card__value">{stats.pendingApps}</div>
          </div>
        </div>
        <div className="stats-card animate-slide-up">
          <div className="stats-card__icon stats-card__icon--purple">📄</div>
          <div className="stats-card__info">
            <div className="stats-card__label">شهادات بانتظار التحقق</div>
            <div className="stats-card__value">{stats.pendingCerts}</div>
          </div>
        </div>
        <div className="stats-card animate-slide-up">
          <div className="stats-card__icon stats-card__icon--green">📋</div>
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
            <h3 className="card__title">📋 مراجعة الطلبات</h3>
          </div>
          <p className="card__body">
            {stats.pendingApps > 0
              ? `لديك ${stats.pendingApps} طلبات بانتظار المراجعة`
              : 'لا توجد طلبات معلقة'}
          </p>
        </Link>

        <Link href="/dashboard/coordinator/certificates" className="card card--hover animate-slide-up" style={{ textDecoration: 'none' }}>
          <div className="card__header">
            <h3 className="card__title">✅ مراجعة الشهادات</h3>
          </div>
          <p className="card__body">
            {stats.pendingCerts > 0
              ? `لديك ${stats.pendingCerts} شهادات بانتظار التحقق`
              : 'لا توجد شهادات معلقة'}
          </p>
        </Link>

        <Link href="/dashboard/coordinator/opportunities" className="card card--hover animate-slide-up" style={{ textDecoration: 'none' }}>
          <div className="card__header">
            <h3 className="card__title">📝 إدارة الفرص</h3>
          </div>
          <p className="card__body">إدارة وتعديل فرص التطوع المتاحة</p>
        </Link>
      </div>
    </div>
  );
}
