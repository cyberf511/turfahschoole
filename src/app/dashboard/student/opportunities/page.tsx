'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getOpportunities } from '@/actions/opportunities';
import { applyToOpportunity } from '@/actions/applications';
import type { Opportunity } from '@/types';
import { formatDate } from '@/lib/utils';
import { Loading } from '@/components/ui/Loading';

export default function StudentOpportunities() {
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const { data: res, error } = useSWR('student-opportunities', () => getOpportunities(true));
  
  const opportunities = res?.success ? (res.data as Opportunity[]) || [] : [];
  const loading = !res && !error;

  const handleApply = async (id: string) => {
    setApplyingId(id);
    setMessage({ text: '', type: '' });
    const result = await applyToOpportunity(id);
    if (result.success) {
      setMessage({ text: 'تم تقديم الطلب بنجاح ✅', type: 'success' });
    } else {
      setMessage({ text: result.error || 'حدث خطأ', type: 'error' });
    }
    setApplyingId(null);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">🔍 فرص التطوع المتاحة</h1>
          <p className="section-subtitle">تصفح الفرص المتاحة وقدّم طلبك</p>
        </div>
      </div>

      {message.text && (
        <div className={`toast toast--${message.type === 'success' ? 'success' : 'error'}`} style={{ position: 'static', marginBottom: '16px' }}>
          {message.text}
        </div>
      )}

      {opportunities.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state__icon">🔍</div>
          <div className="empty-state__title">لا توجد فرص متاحة حالياً</div>
          <div className="empty-state__desc">سيتم إضافة فرص جديدة قريباً، تابع الإشعارات</div>
        </div>
      ) : (
        <div className="grid-3 stagger-children">
          {opportunities.map((opp) => (
            <div key={opp.id} className="opp-card hover-lift animate-slide-up">
              <h3 className="opp-card__title">{opp.title}</h3>
              <p className="opp-card__desc">{opp.description}</p>
              <div className="opp-card__meta">
                <span className="opp-card__meta-item">📍 {opp.location}</span>
                <span className="opp-card__meta-item">⏱️ {opp.hours} ساعة</span>
                {opp.start_date && (
                  <span className="opp-card__meta-item">📅 {formatDate(opp.start_date)}</span>
                )}
              </div>
              {opp.requirements && (
                <div style={{ marginBottom: '12px' }}>
                  <span className="badge badge--role">📌 {opp.requirements}</span>
                </div>
              )}
              <div className="opp-card__actions">
                <button
                  className="btn btn--primary btn--full"
                  onClick={() => handleApply(opp.id)}
                  disabled={applyingId === opp.id}
                >
                  {applyingId === opp.id ? (
                    <span className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                  ) : (
                    'تقديم طلب'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
