'use client';

import { useEffect, useState } from 'react';
import { getMyApplications, getStudentHours } from '@/actions/applications';
import type { Application } from '@/types';
import { APPLICATION_STATUS_LABELS, COMPLETION_STATUS_LABELS } from '@/types';
import Link from 'next/link';

export default function StudentDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyApplications(),
      getStudentHours(),
    ]).then(([appsRes, hoursRes]) => {
      if (appsRes.success) setApplications(appsRes.data || []);
      if (hoursRes.success) setTotalHours(hoursRes.data || 0);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner loading-spinner--lg" />
        <div className="page-loading__text">جاري التحميل...</div>
      </div>
    );
  }

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = applications.filter((a) => a.status === 'approved').length;
  const verifiedCount = applications.filter((a) => a.completion_status === 'verified').length;

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">لوحة المعلومات</h1>
          <p className="section-subtitle">مرحباً بك في لوحة التحكم الخاصة بك</p>
        </div>
        <Link href="/dashboard/student/opportunities" className="btn btn--primary">
          🔍 استكشف الفرص
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid-4 stagger-children" style={{ marginBottom: '24px' }}>
        <div className="stats-card animate-slide-up">
          <div className="stats-card__icon stats-card__icon--blue">⏱️</div>
          <div className="stats-card__info">
            <div className="stats-card__label">ساعات التطوع</div>
            <div className="stats-card__value">{totalHours}</div>
          </div>
        </div>
        <div className="stats-card animate-slide-up">
          <div className="stats-card__icon stats-card__icon--amber">📋</div>
          <div className="stats-card__info">
            <div className="stats-card__label">طلبات معلقة</div>
            <div className="stats-card__value">{pendingCount}</div>
          </div>
        </div>
        <div className="stats-card animate-slide-up">
          <div className="stats-card__icon stats-card__icon--green">✅</div>
          <div className="stats-card__info">
            <div className="stats-card__label">طلبات مقبولة</div>
            <div className="stats-card__value">{approvedCount}</div>
          </div>
        </div>
        <div className="stats-card animate-slide-up">
          <div className="stats-card__icon stats-card__icon--purple">🏆</div>
          <div className="stats-card__info">
            <div className="stats-card__label">شهادات موثقة</div>
            <div className="stats-card__value">{verifiedCount}</div>
          </div>
        </div>
      </div>

      {/* Hours Progress */}
      <div className="hours-widget animate-slide-up" style={{ marginBottom: '24px' }}>
        <div className="hours-widget__header">
          <span className="hours-widget__title">⏱️ ساعات التطوع المكتملة</span>
        </div>
        <div className="hours-widget__value">{totalHours}</div>
        <div className="hours-widget__label">ساعة تطوعية مكتملة وموثقة</div>
        <div className="progress progress--lg">
          <div
            className="progress__fill"
            style={{ width: `${Math.min((totalHours / 40) * 100, 100)}%` }}
          />
        </div>
        <div className="progress-label" style={{ marginTop: '8px' }}>
          <span>{totalHours} ساعة مكتملة</span>
          <span>الهدف: 40 ساعة</span>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card animate-slide-up">
        <div className="card__header">
          <h3 className="card__title">📋 آخر الطلبات</h3>
          <Link href="/dashboard/student/applications" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)' }}>
            عرض الكل
          </Link>
        </div>
        {applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📋</div>
            <div className="empty-state__title">لا توجد طلبات بعد</div>
            <div className="empty-state__desc">ابدأ بالتقديم على فرص التطوع المتاحة</div>
            <Link href="/dashboard/student/opportunities" className="btn btn--primary">
              استكشف الفرص
            </Link>
          </div>
        ) : (
          <div className="activity-list">
            {applications.slice(0, 5).map((app) => {
              const opp = app.opportunity as { title?: string; hours?: number } | undefined;
              let statusLabel = APPLICATION_STATUS_LABELS[app.status];
              let dotColor = 'activity-item__dot--amber';
              if (app.completion_status) {
                statusLabel = COMPLETION_STATUS_LABELS[app.completion_status];
                dotColor = app.completion_status === 'verified' ? 'activity-item__dot--green' : 'activity-item__dot--blue';
              } else if (app.status === 'approved') {
                dotColor = 'activity-item__dot--green';
              } else if (app.status === 'rejected') {
                dotColor = 'activity-item__dot--red';
              }

              return (
                <div key={app.id} className="activity-item">
                  <div className={`activity-item__dot ${dotColor}`} />
                  <div className="activity-item__content">
                    <div className="activity-item__text">
                      {opp?.title || 'فرصة تطوعية'} — <span style={{ color: 'var(--text-secondary)' }}>{statusLabel}</span>
                    </div>
                    <div className="activity-item__time">
                      {opp?.hours ? `${opp.hours} ساعة` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
