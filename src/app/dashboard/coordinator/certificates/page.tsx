'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getCertificatesForReview, verifyCertificate, getSignedDownloadUrl } from '@/actions/certificates';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { Toast } from '@/components/ui/Toast';
import { StatsCards } from '@/components/ui/StatsCards';
import { Loading } from '@/components/ui/Loading';
import { exportToCSV } from '@/lib/export';

// Premium SVG Icons
const Icons = {
  cert: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>,
  check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
};

interface CertApp {
  id: string;
  certificate_url: string;
  certificate_uploaded_at: string;
  student: { full_name?: string; email?: string } | null;
  opportunity: { title?: string; hours?: number } | null;
}

export default function CoordinatorCertificates() {
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: res, error, mutate } = useSWR(['coordinator-certificates', page], () => getCertificatesForReview(page, 10));

  const certs = res?.success ? (res.data as CertApp[]) || [] : [];
  const totalPages = res?.success ? res.totalPages || 1 : 1;
  const stats = res?.success ? res.stats : null;
  const loading = !res && !error;

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    const res = await verifyCertificate(id);
    if (res.success) {
      setToast({ message: 'تم توثيق الشهادة بنجاح ✅', type: 'success' });
      if (certs.length === 1 && page > 1) setPage(page - 1);
      else mutate();
    } else {
      setToast({ message: res.error || 'حدث خطأ أثناء التوثيق', type: 'error' });
    }
    setVerifyingId(null);
  };

  const handleDownload = async (path: string) => {
    const res = await getSignedDownloadUrl(path);
    if (res.success && res.data) {
      window.open(res.data, '_blank');
    } else {
      setToast({ message: 'فشل في فتح الشهادة', type: 'error' });
    }
  };

  const handleExport = () => {
    const exportData = certs.map(cert => ({
      'الطالبة': cert.student?.full_name || '—',
      'البريد الإلكتروني': cert.student?.email || '—',
      'الفرصة التطوعية': cert.opportunity?.title || '—',
      'الساعات': cert.opportunity?.hours || 0,
      'تاريخ الرفع': cert.certificate_uploaded_at ? formatDate(cert.certificate_uploaded_at) : '—'
    }));
    exportToCSV(exportData, 'certificates_review_export');
  };

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="dash-card-wrap__title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem' }}>
            <span style={{ color: 'var(--accent-primary)' }}><Icons.cert /></span>
            مراجعة الشهادات
          </h1>
          <p className="section-subtitle" style={{ marginTop: '6px' }}>مراجعة وتوثيق شهادات الإنجاز المرفوعة من الطالبات</p>
        </div>
        <button className="btn btn--secondary" onClick={handleExport} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Icons.download /> تصدير اكسل
        </button>
      </div>

      {stats && (
        <StatsCards stats={[
          { label: 'إجمالي الشهادات المرفوعة', value: stats.total, icon: '📄', color: 'var(--accent-primary)' },
          { label: 'بانتظار المراجعة', value: stats.pending, icon: '⏳', color: '#f59e0b' },
          { label: 'شهادات موثقة', value: stats.verified, icon: '✅', color: '#10b981' }
        ]} />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrap" style={{ border: 'none' }}>
          <table className="data-table">
            <thead style={{ background: 'var(--bg-tertiary)' }}>
              <tr>
                <th style={{ padding: '16px 20px' }}>الطالبة</th>
                <th style={{ padding: '16px 20px' }}>الفرصة</th>
                <th style={{ padding: '16px 20px' }}>الساعات</th>
                <th style={{ padding: '16px 20px' }}>تاريخ الرفع</th>
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
              ) : certs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)' }}>
                    لا توجد شهادات بانتظار المراجعة حالياً
                  </td>
                </tr>
              ) : certs.map((cert) => (
                <tr key={cert.id}>
                  <td style={{ padding: '16px 20px' }}>
                    <div className="flex-gap">
                      <div className="avatar avatar--sm" style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>
                        {cert.student?.full_name?.[0] || '؟'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cert.student?.full_name || 'طالبة'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{cert.student?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{cert.opportunity?.title || '—'}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{cert.opportunity?.hours} ساعة</td>
                  <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {cert.certificate_uploaded_at ? formatDate(cert.certificate_uploaded_at) : '—'}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={() => handleDownload(cert.certificate_url)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Icons.eye /> عرض الشهادة
                      </button>
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => handleVerify(cert.id)}
                        disabled={verifyingId === cert.id}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#10b981', borderColor: '#10b981' }}
                      >
                        {verifyingId === cert.id ? <div className="loading-spinner" style={{ width: '14px', height: '14px' }} /> : <><Icons.check /> توثيق</>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
