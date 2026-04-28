'use client';

import { useEffect, useState } from 'react';
import { getOpportunities, toggleOpportunity } from '@/actions/opportunities';
import type { Opportunity } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function CoordinatorOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOpportunities(false).then((res) => {
      if (res.success) setOpportunities(res.data || []);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    await toggleOpportunity(id, !current);
    setOpportunities((prev) => prev.map((o) => o.id === id ? { ...o, is_active: !current } : o));
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner loading-spinner--lg" /></div>;

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">📝 إدارة الفرص</h1>
          <p className="section-subtitle">إنشاء وإدارة فرص التطوع</p>
        </div>
        <Link href="/dashboard/coordinator/opportunities/new" className="btn btn--primary">
          ➕ إنشاء فرصة جديدة
        </Link>
      </div>

      {opportunities.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state__icon">📝</div>
          <div className="empty-state__title">لا توجد فرص بعد</div>
          <div className="empty-state__desc">أنشئ أول فرصة تطوعية</div>
          <Link href="/dashboard/coordinator/opportunities/new" className="btn btn--primary">إنشاء فرصة</Link>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>الموقع</th>
                <th>الساعات</th>
                <th>التاريخ</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr key={opp.id}>
                  <td style={{ fontWeight: 600 }}>{opp.title}</td>
                  <td>{opp.location}</td>
                  <td>{opp.hours} ساعة</td>
                  <td>{opp.start_date ? formatDate(opp.start_date) : '—'}</td>
                  <td>
                    <span className={`badge ${opp.is_active ? 'badge--approved' : 'badge--rejected'}`}>
                      {opp.is_active ? 'نشطة' : 'متوقفة'}
                    </span>
                  </td>
                  <td>
                    <div className="flex-gap">
                      <button
                        className={`btn btn--sm ${opp.is_active ? 'btn--danger' : 'btn--secondary'}`}
                        onClick={() => handleToggle(opp.id, opp.is_active)}
                      >
                        {opp.is_active ? 'إيقاف' : 'تفعيل'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
