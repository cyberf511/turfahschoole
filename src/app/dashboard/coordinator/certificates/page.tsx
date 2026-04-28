'use client';

import { useEffect, useState } from 'react';
import { getCertificatesForReview, verifyCertificate, getSignedDownloadUrl } from '@/actions/certificates';
import { formatDate } from '@/lib/utils';

interface CertApp {
  id: string;
  certificate_url: string;
  certificate_uploaded_at: string;
  student: { full_name?: string; email?: string } | null;
  opportunity: { title?: string; hours?: number } | null;
}

export default function CoordinatorCertificates() {
  const [certs, setCerts] = useState<CertApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getCertificatesForReview().then((res) => {
      if (res.success) setCerts((res.data || []) as CertApp[]);
      setLoading(false);
    });
  }, []);

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    const res = await verifyCertificate(id);
    if (res.success) {
      setCerts((prev) => prev.filter((c) => c.id !== id));
      setMessage('تم توثيق الشهادة بنجاح ✅');
    }
    setVerifyingId(null);
  };

  const handleDownload = async (path: string) => {
    const res = await getSignedDownloadUrl(path);
    if (res.success && res.data) {
      window.open(res.data, '_blank');
    }
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner loading-spinner--lg" /></div>;

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">✅ مراجعة الشهادات</h1>
          <p className="section-subtitle">مراجعة وتوثيق شهادات الإنجاز المرفوعة من الطلاب</p>
        </div>
      </div>

      {message && (
        <div className="toast toast--success" style={{ position: 'static', marginBottom: '16px' }}>
          {message}
        </div>
      )}

      {certs.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state__icon">✅</div>
          <div className="empty-state__title">لا توجد شهادات بانتظار المراجعة</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {certs.map((cert) => (
            <div key={cert.id} className="card card--hover animate-slide-up">
              <div className="card__header">
                <div>
                  <div className="card__title">
                    {cert.student?.full_name || 'طالب'} — {cert.opportunity?.title || 'فرصة'}
                  </div>
                  <div className="card__subtitle">
                    {cert.opportunity?.hours} ساعة • رُفعت في {cert.certificate_uploaded_at ? formatDate(cert.certificate_uploaded_at) : '—'}
                  </div>
                </div>
                <span className="badge badge--review">قيد المراجعة</span>
              </div>
              <div className="card__footer">
                <button className="btn btn--secondary btn--sm" onClick={() => handleDownload(cert.certificate_url)}>
                  📥 عرض الشهادة
                </button>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => handleVerify(cert.id)}
                  disabled={verifyingId === cert.id}
                >
                  {verifyingId === cert.id ? '...' : '✅ توثيق'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
