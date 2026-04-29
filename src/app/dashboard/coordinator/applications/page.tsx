'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getAllApplications, reviewApplication } from '@/actions/applications';
import type { Application } from '@/types';
import { APPLICATION_STATUS_LABELS } from '@/types';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { StatsCards } from '@/components/ui/StatsCards';
import { exportToCSV } from '@/lib/export';
import { Loading } from '@/components/ui/Loading';

// Premium SVG Icons
const Icons = {
  clipboard: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M9 14h6" /><path d="M9 10h6" /><path d="M9 18h6" /></svg>,
  check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  x: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
};

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

const EDUCATION_LABELS: Record<string, string> = {
  first_secondary: 'أولى ثانوي',
  second_secondary: 'ثانية ثانوي',
  third_secondary: 'ثالثة ثانوي',
};

const PhoneReveal = ({ phone }: { phone?: string }) => {
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (revealed) {
      setTimeLeft(60);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setRevealed(false);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [revealed]);

  if (!phone) return <span style={{ direction: 'ltr' }}>غير محدد</span>;

  if (revealed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', direction: 'ltr' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{phone}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 'bold' }}>({timeLeft}s)</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', direction: 'ltr', justifyContent: 'flex-end' }}>
      <button 
        onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
        className="btn btn--sm" 
        style={{ padding: '2px 6px', fontSize: '0.8rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
        title="إظهار الرقم"
      >
        👁️ إظهار
      </button>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>******{phone.slice(-4)}</span>
    </div>
  );
};

export default function CoordinatorApplications() {
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const { data: res, error, mutate } = useSWR(['coordinator-applications', filter, page], () => getAllApplications(filter, page, 10));

  const applications = res?.success ? res.data || [] : [];
  const totalPages = res?.success ? res.totalPages || 1 : 1;
  const stats = res?.success ? res.stats : null;
  const loading = !res && !error;

  const handleApprove = async (id: string) => {
    setReviewingId(id);
    const res = await reviewApplication(id, 'approve');
    if (res.success) {
      setSelectedApp(null);
      setToast({ message: 'تم قبول الطلب بنجاح', type: 'success' });
      mutate();
    } else {
      setToast({ message: res.error || 'حدث خطأ أثناء قبول الطلب', type: 'error' });
    }
    setReviewingId(null);
  };

  const handleReject = async () => {
    if (!showRejectModal || !rejectReason.trim()) return;
    const id = showRejectModal;
    setReviewingId(id);
    const res = await reviewApplication(id, 'reject', rejectReason);
    if (res.success) {
      setSelectedApp(null);
      setToast({ message: 'تم رفض الطلب بنجاح', type: 'success' });
      mutate();
    } else {
      setToast({ message: res.error || 'حدث خطأ أثناء رفض الطلب', type: 'error' });
    }
    setReviewingId(null);
    setShowRejectModal(null);
    setRejectReason('');
  };

  const handleExport = () => {
    const exportData = applications.map(app => {
      const student = app.student as unknown as StudentInfo | undefined;
      const opp = app.opportunity as unknown as OppInfo | undefined;
      return {
        'اسم الطالبة': student?.full_name || '—',
        'البريد الإلكتروني': student?.email || '—',
        'الفرصة': opp?.title || '—',
        'التاريخ': formatDate(app.applied_at),
        'الحالة': APPLICATION_STATUS_LABELS[app.status]
      };
    });
    exportToCSV(exportData, 'applications_export');
  };

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="dash-card-wrap__title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem' }}>
            <span style={{ color: 'var(--accent-primary)' }}><Icons.clipboard /></span>
            مراجعة الطلبات
          </h1>
          <p className="section-subtitle" style={{ marginTop: '6px' }}>مراجعة طلبات الطالبات والموافقة عليها أو رفضها</p>
        </div>
        <button className="btn btn--secondary" onClick={handleExport} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Icons.download /> تصدير اكسل
        </button>
      </div>

      {stats && (
        <StatsCards stats={[
          { label: 'إجمالي الطلبات', value: stats.total, icon: '📋', color: 'var(--accent-primary)' },
          { label: 'طلبات معلقة', value: stats.pending, icon: '⏳', color: '#f59e0b' },
          { label: 'طلبات مقبولة', value: stats.approved, icon: '✅', color: '#10b981' },
          { label: 'طلبات مرفوضة', value: stats.rejected, icon: '❌', color: '#ef4444' }
        ]} />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowRejectModal(null)}>
          <div className="modal card animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', width: '100%' }}>
            <div className="modal__header">
              <h3 className="modal__title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                <Icons.x /> رفض الطلب
              </h3>
              <button className="modal__close" onClick={() => setShowRejectModal(null)}>✕</button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="form-label">سبب الرفض (إلزامي للطالبة) *</label>
                <textarea
                  className="form-input"
                  placeholder="اكتب سبب الرفض هنا ليظهر للطالبة..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <div className="modal__footer" style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn--secondary" onClick={() => setShowRejectModal(null)} style={{ flex: 1 }}>إلغاء</button>
              <button
                className="btn btn--primary"
                onClick={handleReject}
                disabled={!rejectReason.trim() || reviewingId === showRejectModal}
                style={{ flex: 1, background: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="tabs" style={{ marginBottom: '24px', maxWidth: '500px' }}>
        {[
          { key: 'pending', label: '⏳ معلق' },
          { key: 'approved', label: '✅ مقبول' },
          { key: 'rejected', label: '❌ مرفوض' },
          { key: 'all', label: '📊 الكل' },
        ].map((t) => (
          <button key={t.key} className={`tab ${filter === t.key ? 'tab--active' : ''}`} onClick={() => { setFilter(t.key); setPage(1); }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrap" style={{ border: 'none' }}>
          <table className="data-table">
            <thead style={{ background: 'var(--bg-tertiary)' }}>
              <tr>
                <th style={{ padding: '16px 20px' }}>الطالبة</th>
                <th style={{ padding: '16px 20px' }}>الفرصة</th>
                <th style={{ padding: '16px 20px' }}>التاريخ</th>
                <th style={{ padding: '16px 20px' }}>الحالة</th>
                <th style={{ padding: '16px 20px', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px' }}>
                    <Loading fullHeight={false} />
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)' }}>
                    لا توجد طلبات {filter !== 'all' ? APPLICATION_STATUS_LABELS[filter as keyof typeof APPLICATION_STATUS_LABELS] || '' : ''}
                  </td>
                </tr>
              ) : applications.map((app) => {
                const student = app.student as unknown as StudentInfo | undefined;
                const opp = app.opportunity as unknown as OppInfo | undefined;
                return (
                  <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedApp(app)}>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="flex-gap">
                        <div className="avatar avatar--sm" style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>
                          {student?.full_name?.[0] || '؟'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student?.full_name || 'طالبة'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{student?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{opp?.title || '—'}</td>
                    <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(app.applied_at)}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className={`badge badge--${app.status}`}>
                        {APPLICATION_STATUS_LABELS[app.status]}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      {app.status === 'pending' ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            className="btn btn--sm btn--primary"
                            onClick={() => handleApprove(app.id)}
                            disabled={reviewingId === app.id}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            {reviewingId === app.id ? <div className="loading-spinner" style={{ width: '14px', height: '14px' }} /> : <><Icons.check /> قبول</>}
                          </button>
                          <button
                            className="btn btn--sm btn--secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowRejectModal(app.id);
                              setRejectReason(`نعتذر، لم يتم قبولك في الفرصة التطوعية: ${opp?.title || ''}`);
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                          >
                            <Icons.x /> رفض
                          </button>
                        </div>
                      ) : app.status === 'rejected' && app.rejection_reason ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                          تم الرفض
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--success)' }}>
                          مقبول
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Student Detail Modal */}
      {selectedApp && (() => {
        const student = selectedApp.student as unknown as StudentInfo | undefined;
        const opp = selectedApp.opportunity as unknown as OppInfo | undefined;
        return (
          <div className="modal-overlay animate-fade-in" onClick={() => setSelectedApp(null)}>
            <div className="modal card animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '100%' }}>
              <div className="modal__header">
                <h3 className="modal__title">👤 بيانات الطالبة</h3>
                <button className="modal__close" onClick={() => setSelectedApp(null)}>✕</button>
              </div>
              <div className="modal__body">
                {/* Student avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                  <div className="avatar avatar--lg" style={{ width: '56px', height: '56px', fontSize: '1.4rem', background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>
                    {student?.avatar_url
                      ? <img src={student.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : (student?.full_name?.[0] || '؟')
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{student?.full_name || 'طالبة'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{student?.email}</div>
                  </div>
                </div>

                {/* Info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="card" style={{ padding: '12px', background: 'var(--bg-secondary)', border: 'none' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>📱 الجوال</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <PhoneReveal phone={student?.phone} />
                    </div>
                  </div>
                  <div className="card" style={{ padding: '12px', background: 'var(--bg-secondary)', border: 'none' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>🎓 المرحلة</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {student?.education_level ? EDUCATION_LABELS[student.education_level] || student.education_level : 'غير محدد'}
                    </div>
                  </div>
                  <div className="card" style={{ padding: '12px', background: 'var(--bg-secondary)', border: 'none' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>🆔 آخر 3 أرقام الهوية</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', direction: 'ltr' }}>***{student?.national_id_last3 || '---'}</div>
                  </div>
                  <div className="card" style={{ padding: '12px', background: 'var(--bg-secondary)', border: 'none' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>📅 تاريخ التقديم</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatDate(selectedApp.applied_at)}</div>
                  </div>
                </div>

                {/* Opportunity info */}
                <div className="card" style={{ padding: '14px', marginTop: '16px', background: 'var(--accent-primary-soft)', border: 'none' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginBottom: '6px', fontWeight: 600 }}>🎯 الفرصة التطوعية</div>
                  <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>{opp?.title || '—'}</div>
                  <div className="flex-gap" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>⏱️ {opp?.hours || 0} ساعات</span>
                    <span>📍 {opp?.location || 'المدرسة'}</span>
                  </div>
                </div>

                {/* Status */}
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>حالة الطلب:</span>
                  <span className={`badge badge--${selectedApp.status}`}>
                    {APPLICATION_STATUS_LABELS[selectedApp.status]}
                  </span>
                </div>

                {selectedApp.rejection_reason && (
                  <div className="card" style={{ padding: '16px', marginTop: '16px', background: 'var(--danger-soft)', border: '1px solid var(--danger)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icons.x /> سبب الرفض
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {selectedApp.rejection_reason}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedApp.status === 'pending' && (
                <div className="modal__footer" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    className="btn btn--secondary"
                    onClick={() => { 
                      setShowRejectModal(selectedApp.id); 
                      setRejectReason(`نعتذر، لم يتم قبولك في الفرصة التطوعية: ${opp?.title || ''}`);
                      setSelectedApp(null); 
                    }}
                    style={{ flex: 1, color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                  >
                    رفض الطلب
                  </button>
                  <button
                    className="btn btn--primary"
                    onClick={() => handleApprove(selectedApp.id)}
                    disabled={reviewingId === selectedApp.id}
                    style={{ flex: 2 }}
                  >
                    {reviewingId === selectedApp.id ? 'جاري القبول...' : '✅ قبول الطلب'}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
