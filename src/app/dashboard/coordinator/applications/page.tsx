'use client';

import { useEffect, useState } from 'react';
import { getAllApplications, reviewApplication } from '@/actions/applications';
import type { Application } from '@/types';
import { APPLICATION_STATUS_LABELS } from '@/types';
import { formatDate } from '@/lib/utils';

export default function CoordinatorApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

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
    }
    setReviewingId(null);
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setReviewingId(id);
    const res = await reviewApplication(id, 'reject', rejectReason);
    if (res.success) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
    }
    setReviewingId(null);
    setShowRejectModal(null);
    setRejectReason('');
  };

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">📋 مراجعة الطلبات</h1>
          <p className="section-subtitle">مراجعة طلبات الطلاب والموافقة عليها أو رفضها</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '20px', maxWidth: '500px' }}>
        {[
          { key: 'pending', label: 'معلق' },
          { key: 'approved', label: 'مقبول' },
          { key: 'rejected', label: 'مرفوض' },
          { key: 'all', label: 'الكل' },
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
          <div className="empty-state__title">لا توجد طلبات</div>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>الفرصة</th>
                <th>التاريخ</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const student = app.student as { full_name?: string; email?: string } | undefined;
                const opp = app.opportunity as { title?: string } | undefined;
                return (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{student?.full_name || 'طالب'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{student?.email}</div>
                    </td>
                    <td>{opp?.title || '—'}</td>
                    <td>{formatDate(app.applied_at)}</td>
                    <td>
                      <span className={`badge badge--${app.status}`}>
                        {APPLICATION_STATUS_LABELS[app.status]}
                      </span>
                    </td>
                    <td>
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
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
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
