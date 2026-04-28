'use client';

import { useEffect, useState } from 'react';
import { getAllApplications, reviewApplication } from '@/actions/applications';
import type { Application } from '@/types';
import { APPLICATION_STATUS_LABELS } from '@/types';
import { formatDate } from '@/lib/utils';

interface StudentInfo {
  full_name?: string;
  email?: string;
  avatar_url?: string;
  phone?: string;
  education_level?: string;
  national_id_last3?: string;
}

interface OppInfo {
  title?: string;
  location?: string;
  hours?: number;
}

export default function CoordinatorApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const loadApps = async () => {
    setLoading(true);
    const res = await getAllApplications(filter);
    if (res.success) setApplications(res.data || []);
    setLoading(false);
  };

  useEffect(() => { loadApps(); }, [filter]);

  const handleApprove = async (id: string) => {
    setReviewingId(id);
    const res = await reviewApplication(id, 'approve');
    if (res.success) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setSelectedApp(null);
    }
    setReviewingId(null);
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setReviewingId(id);
    const res = await reviewApplication(id, 'reject', rejectReason);
    if (res.success) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setSelectedApp(null);
    }
    setReviewingId(null);
    setShowRejectModal(null);
    setRejectReason('');
  };

  const EDUCATION_LABELS: Record<string, string> = {
    first_secondary: 'أولى ثانوي',
    second_secondary: 'ثانية ثانوي',
    third_secondary: 'ثالثة ثانوي',
  };

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">📋 مراجعة الطلبات</h1>
          <p className="section-subtitle">مراجعة طلبات الطالبات والموافقة عليها أو رفضها</p>
        </div>
        <span className="badge badge--role" style={{ fontSize: '0.8rem' }}>
          {applications.length} طلب
        </span>
      </div>

      <div className="tabs" style={{ marginBottom: '20px', maxWidth: '500px' }}>
        {[
          { key: 'pending', label: '⏳ معلق' },
          { key: 'approved', label: '✅ مقبول' },
          { key: 'rejected', label: '❌ مرفوض' },
          { key: 'all', label: '📊 الكل' },
        ].map((t) => (
          <button key={t.key} className={`tab ${filter === t.key ? 'tab--active' : ''}`} onClick={() => setFilter(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loading"><div className="loading-spinner loading-spinner--lg" /></div>
      ) : applications.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state__icon">📋</div>
          <div className="empty-state__title">لا توجد طلبات {filter !== 'all' ? APPLICATION_STATUS_LABELS[filter as keyof typeof APPLICATION_STATUS_LABELS] || '' : ''}</div>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>الطالبة</th>
                <th>الفرصة</th>
                <th>التاريخ</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const student = app.student as unknown as StudentInfo | undefined;
                const opp = app.opportunity as unknown as OppInfo | undefined;
                return (
                  <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedApp(app)}>
                    <td>
                      <div className="flex-gap">
                        <div className="avatar avatar--sm">{student?.full_name?.[0] || '؟'}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{student?.full_name || 'طالبة'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{student?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{opp?.title || '—'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{formatDate(app.applied_at)}</td>
                    <td>
                      <span className={`badge badge--${app.status}`}>
                        {APPLICATION_STATUS_LABELS[app.status]}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {app.status === 'pending' && (
                        <div className="flex-gap">
                          <button
                            className="btn btn--sm btn--primary"
                            onClick={() => handleApprove(app.id)}
                            disabled={reviewingId === app.id}
                          >
                            {reviewingId === app.id ? '...' : '✅ قبول'}
                          </button>
                          <button
                            className="btn btn--sm btn--danger"
                            onClick={() => setShowRejectModal(app.id)}
                          >
                            ❌ رفض
                          </button>
                        </div>
                      )}
                      {app.status === 'rejected' && app.rejection_reason && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                          {app.rejection_reason}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedApp && (() => {
        const student = selectedApp.student as unknown as StudentInfo | undefined;
        const opp = selectedApp.opportunity as unknown as OppInfo | undefined;
        return (
          <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
              <div className="modal__header">
                <h3 className="modal__title">👤 بيانات الطالبة</h3>
                <button className="modal__close" onClick={() => setSelectedApp(null)}>✕</button>
              </div>
              <div className="modal__body">
                {/* Student avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                  <div className="avatar avatar--lg" style={{ width: '56px', height: '56px', fontSize: '1.4rem' }}>
                    {student?.avatar_url
                      ? <img src={student.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : (student?.full_name?.[0] || '؟')
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{student?.full_name || 'طالبة'}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>{student?.email}</div>
                  </div>
                </div>

                {/* Info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>📱 الجوال</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student?.phone || 'غير محدد'}</div>
                  </div>
                  <div className="card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>🎓 المرحلة</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {student?.education_level ? EDUCATION_LABELS[student.education_level] || student.education_level : 'غير محدد'}
                    </div>
                  </div>
                  <div className="card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>🆔 آخر 3 أرقام الهوية</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', direction: 'ltr' }}>***{student?.national_id_last3 || '---'}</div>
                  </div>
                  <div className="card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>📅 تاريخ التقديم</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatDate(selectedApp.applied_at)}</div>
                  </div>
                </div>

                {/* Opportunity info */}
                <div className="card" style={{ padding: '14px', marginTop: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>🎯 الفرصة التطوعية</div>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>{opp?.title || '—'}</div>
                  <div className="flex-gap" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>⏱️ {opp?.hours || 0} ساعات</span>
                    <span>📍 {opp?.location || 'المدرسة'}</span>
                  </div>
                </div>

                {/* Status */}
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>الحالة:</span>
                  <span className={`badge badge--${selectedApp.status}`}>
                    {APPLICATION_STATUS_LABELS[selectedApp.status]}
                  </span>
                </div>

                {selectedApp.rejection_reason && (
                  <div className="card" style={{ padding: '12px', marginTop: '10px', background: 'var(--danger-soft)', border: '1px solid var(--danger)' }}>
                    <span style={{ fontSize: '0.82rem' }}>❌ سبب الرفض: {selectedApp.rejection_reason}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedApp.status === 'pending' && (
                <div className="modal__footer">
                  <button
                    className="btn btn--primary"
                    onClick={() => handleApprove(selectedApp.id)}
                    disabled={reviewingId === selectedApp.id}
                  >
                    {reviewingId === selectedApp.id ? '...' : '✅ قبول الطلب'}
                  </button>
                  <button
                    className="btn btn--danger"
                    onClick={() => { setShowRejectModal(selectedApp.id); setSelectedApp(null); }}
                  >
                    ❌ رفض الطلب
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">رفض الطلب</h3>
              <button className="modal__close" onClick={() => setShowRejectModal(null)}>✕</button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="form-label">سبب الرفض *</label>
                <textarea
                  className="form-input"
                  placeholder="اكتب سبب الرفض هنا..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal__footer">
              <button
                className="btn btn--danger"
                onClick={() => handleReject(showRejectModal)}
                disabled={!rejectReason.trim() || reviewingId === showRejectModal}
              >
                تأكيد الرفض
              </button>
              <button className="btn btn--secondary" onClick={() => setShowRejectModal(null)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
