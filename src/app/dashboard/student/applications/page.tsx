'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getMyApplications } from '@/actions/applications';
import type { Application } from '@/types';
import { APPLICATION_STATUS_LABELS, COMPLETION_STATUS_LABELS } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Loading } from '@/components/ui/Loading';

export default function StudentApplications() {
  const [filter, setFilter] = useState('all');

  const { data: res, error } = useSWR('student-applications', () => getMyApplications());

  const applications = res?.success ? res.data || [] : [];
  const loading = !res && !error;

  if (loading) {
    return <Loading />;
  }

  const filtered = filter === 'all' ? applications : applications.filter((a) => a.status === filter);

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">📋 طلباتي</h1>
          <p className="section-subtitle">تتبع حالة جميع طلبات التطوع</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '20px', maxWidth: '500px' }}>
        {[
          { key: 'all', label: 'الكل' },
          { key: 'pending', label: 'معلق' },
          { key: 'approved', label: 'مقبول' },
          { key: 'rejected', label: 'مرفوض' },
        ].map((t) => (
          <button key={t.key} className={`tab ${filter === t.key ? 'tab--active' : ''}`} onClick={() => setFilter(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state__icon">📋</div>
          <div className="empty-state__title">لا توجد طلبات</div>
          <div className="empty-state__desc">لم تقدم على أي فرصة بعد</div>
          <Link href="/dashboard/student/opportunities" className="btn btn--primary">استكشف الفرص</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((app) => {
            const opp = app.opportunity as { title?: string; hours?: number; location?: string } | undefined;
            let badgeClass = 'badge--pending';
            let statusText = APPLICATION_STATUS_LABELS[app.status];
            if (app.completion_status) {
              statusText = COMPLETION_STATUS_LABELS[app.completion_status];
              badgeClass = app.completion_status === 'verified' ? 'badge--verified' : 'badge--review';
            } else if (app.status === 'approved') badgeClass = 'badge--approved';
            else if (app.status === 'rejected') badgeClass = 'badge--rejected';

            return (
              <div key={app.id} className="card card--hover animate-slide-up">
                <div className="card__header">
                  <div>
                    <div className="card__title">{opp?.title || 'فرصة تطوعية'}</div>
                    <div className="card__subtitle">{opp?.location} • {opp?.hours} ساعة</div>
                  </div>
                  <span className={`badge ${badgeClass}`}>{statusText}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  تاريخ التقديم: {formatDate(app.applied_at)}
                </div>
                {app.status === 'rejected' && app.rejection_reason && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'var(--danger-soft)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--danger)' }}>
                    سبب الرفض: {app.rejection_reason}
                  </div>
                )}
                {app.status === 'approved' && !app.completion_status && (
                  <div style={{ marginTop: '12px' }}>
                    <Link href="/dashboard/student/certificates" className="btn btn--secondary btn--sm">
                      📄 رفع شهادة الإنجاز
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
