'use client';

import { useState, useRef } from 'react';
import useSWR from 'swr';
import { getMyApplications } from '@/actions/applications';
import { getSignedUploadUrl, uploadCertificate } from '@/actions/certificates';
import type { Application } from '@/types';
import { COMPLETION_STATUS_LABELS } from '@/types';
import { Loading } from '@/components/ui/Loading';

export default function StudentCertificates() {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const { data: res, error, mutate } = useSWR('student-certificates', () => getMyApplications());

  const applications = res?.success ? (res.data || []).filter((a) => a.status === 'approved' || a.completion_status) : [];
  const loading = !res && !error;

  const handleFileSelect = (appId: string) => {
    setSelectedAppId(appId);
    fileRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAppId) return;

    setUploadingId(selectedAppId);
    setMessage({ text: '', type: '' });

    const urlRes = await getSignedUploadUrl(file.name);
    if (!urlRes.success || !urlRes.data) {
      setMessage({ text: urlRes.error || 'فشل في رفع الملف', type: 'error' });
      setUploadingId(null);
      return;
    }

    try {
      await fetch(urlRes.data.signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      const certRes = await uploadCertificate(selectedAppId, urlRes.data.path);
      if (certRes.success) {
        setMessage({ text: 'تم رفع الشهادة بنجاح ✅', type: 'success' });
        mutate();
      } else {
        setMessage({ text: certRes.error || 'فشل', type: 'error' });
      }
    } catch {
      setMessage({ text: 'فشل في رفع الملف', type: 'error' });
    }

    setUploadingId(null);
    setSelectedAppId(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">📄 شهاداتي</h1>
          <p className="section-subtitle">ارفع شهادات الإنجاز لتوثيقها</p>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleUpload} />

      {message.text && (
        <div className={`toast toast--${message.type === 'success' ? 'success' : 'error'}`} style={{ position: 'static', marginBottom: '16px' }}>
          {message.text}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state__icon">📄</div>
          <div className="empty-state__title">لا توجد شهادات</div>
          <div className="empty-state__desc">ستظهر هنا الشهادات بعد قبول طلباتك</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {applications.map((app) => {
            const opp = app.opportunity as { title?: string; hours?: number } | undefined;
            const hasUploaded = !!app.completion_status;

            return (
              <div key={app.id} className="card card--hover animate-slide-up">
                <div className="card__header">
                  <div>
                    <div className="card__title">{opp?.title || 'فرصة تطوعية'}</div>
                    <div className="card__subtitle">{opp?.hours} ساعة</div>
                  </div>
                  {hasUploaded && (
                    <span className={`badge ${app.completion_status === 'verified' ? 'badge--verified' : 'badge--review'}`}>
                      {COMPLETION_STATUS_LABELS[app.completion_status!]}
                    </span>
                  )}
                </div>

                {!hasUploaded && (
                  <div
                    className="file-upload"
                    onClick={() => handleFileSelect(app.id)}
                    style={{ marginTop: '12px' }}
                  >
                    {uploadingId === app.id ? (
                      <div className="loading-spinner" style={{ margin: '0 auto' }} />
                    ) : (
                      <>
                        <div className="file-upload__icon">📁</div>
                        <div className="file-upload__text">اضغط لرفع شهادة الإنجاز</div>
                        <div className="file-upload__hint">PDF, JPG, PNG — حد أقصى 10MB</div>
                      </>
                    )}
                  </div>
                )}

                {app.completion_status === 'completed_under_review' && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'var(--info-soft)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--info)' }}>
                    ⏳ الشهادة قيد المراجعة من قبل منسق التطوع
                  </div>
                )}

                {app.completion_status === 'verified' && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'var(--success-soft)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--success)' }}>
                    ✅ تم توثيق الشهادة وإضافة الساعات
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
