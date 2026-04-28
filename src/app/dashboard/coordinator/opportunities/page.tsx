'use client';

import { useEffect, useState } from 'react';
import { getOpportunities, toggleOpportunity, deleteOpportunity } from '@/actions/opportunities';
import type { Opportunity } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { StatsCards } from '@/components/ui/StatsCards';
import { exportToCSV } from '@/lib/export';
import { Loading } from '@/components/ui/Loading';

// Premium SVG Icons
const Icons = {
  briefcase: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  clock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
};

export default function CoordinatorOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Stats
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);
  
  // Modals & Toasts
  const [oppToDelete, setOppToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    const res = await getOpportunities(false, page, 10);
    if (res.success) {
      setOpportunities(res.data || []);
      setTotalPages(res.totalPages || 1);
      if (res.stats) setStats(res.stats);
    }
    setLoading(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    setProcessingId(id);
    const res = await toggleOpportunity(id, !current);
    if (res.success) {
      setOpportunities((prev) => prev.map((o) => o.id === id ? { ...o, is_active: !current } : o));
      setToast({ message: !current ? 'تم تفعيل الفرصة بنجاح' : 'تم إيقاف الفرصة بنجاح', type: 'success' });
      loadData(); // refresh stats
    } else {
      setToast({ message: res.error || 'حدث خطأ أثناء تحديث الحالة', type: 'error' });
    }
    setProcessingId(null);
  };

  const executeDelete = async () => {
    if (!oppToDelete) return;
    setProcessingId(oppToDelete);
    const id = oppToDelete;
    setOppToDelete(null); // hide modal

    const res = await deleteOpportunity(id);
    if (res.success) {
      setToast({ message: 'تم حذف الفرصة بنجاح', type: 'success' });
      if (opportunities.length === 1 && page > 1) setPage(page - 1);
      else loadData(); // refresh table & stats
    } else {
      setToast({ message: res.error || 'حدث خطأ أثناء الحذف', type: 'error' });
    }
    setProcessingId(null);
  };

  const handleExport = () => {
    const exportData = opportunities.map(o => ({
      'العنوان': o.title,
      'الوصف': o.description,
      'الموقع': o.location,
      'الساعات': o.hours,
      'الحالة': o.is_active ? 'نشطة' : 'متوقفة',
      'تاريخ البداية': o.start_date ? formatDate(o.start_date) : '—',
      'تاريخ الإنشاء': formatDate(o.created_at)
    }));
    exportToCSV(exportData, 'opportunities_export');
  };

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="dash-card-wrap__title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem' }}>
            <span style={{ color: 'var(--accent-primary)' }}><Icons.briefcase /></span>
            إدارة الفرص
          </h1>
          <p className="section-subtitle" style={{ marginTop: '6px' }}>إنشاء وإدارة فرص التطوع وتعديلها</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn--secondary" onClick={handleExport} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Icons.download /> تصدير CSV
          </button>
          <Link href="/dashboard/coordinator/opportunities/new" className="btn btn--primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Icons.plus /> إنشاء فرصة جديدة
          </Link>
        </div>
      </div>

      {stats && (
        <StatsCards stats={[
          { label: 'إجمالي الفرص', value: stats.total, icon: '📝', color: 'var(--accent-primary)' },
          { label: 'الفرص النشطة', value: stats.active, icon: '✅', color: '#10b981' },
          { label: 'الفرص المتوقفة', value: stats.inactive, icon: '⏸️', color: '#f59e0b' },
          { label: 'إجمالي الساعات', value: stats.totalHours, icon: '⏱️', color: '#8b5cf6' }
        ]} />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <Modal 
        isOpen={!!oppToDelete}
        onClose={() => setOppToDelete(null)}
        title="تأكيد الحذف"
        description="هل أنت متأكد من رغبتك في حذف هذه الفرصة؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذف جميع الطلبات المرتبطة بها."
        onConfirm={executeDelete}
        confirmText="نعم، احذف"
        isDanger={true}
        icon={<Icons.trash />}
      />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrap" style={{ border: 'none' }}>
          <table className="data-table">
            <thead style={{ background: 'var(--bg-tertiary)' }}>
              <tr>
                <th style={{ padding: '16px 20px' }}>العنوان</th>
                <th style={{ padding: '16px 20px' }}>الموقع</th>
                <th style={{ padding: '16px 20px' }}>الساعات</th>
                <th style={{ padding: '16px 20px' }}>التاريخ</th>
                <th style={{ padding: '16px 20px' }}>الحالة</th>
                <th style={{ padding: '16px 20px', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px' }}>
                    <Loading fullHeight={false} />
                  </td>
                </tr>
              ) : opportunities.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)' }}>
                    لا توجد فرص تطوعية بعد، أنشئ أول فرصة!
                  </td>
                </tr>
              ) : opportunities.map((opp) => (
                <tr key={opp.id}>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>{opp.title}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{opp.location}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{opp.hours} ساعة</td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{opp.start_date ? formatDate(opp.start_date) : '—'}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className={`badge ${opp.is_active ? 'badge--approved' : 'badge--rejected'}`}>
                      {opp.is_active ? 'نشطة' : 'متوقفة'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <button
                        className={`btn btn--sm ${opp.is_active ? 'btn--secondary' : 'btn--primary'}`}
                        onClick={() => handleToggle(opp.id, opp.is_active)}
                        disabled={processingId === opp.id}
                        style={opp.is_active ? { color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' } : {}}
                      >
                        {processingId === opp.id ? <div className="loading-spinner" style={{ width: '14px', height: '14px' }} /> : (opp.is_active ? 'إيقاف' : 'تفعيل')}
                      </button>
                      
                      <Link 
                        href={`/dashboard/coordinator/opportunities/${opp.id}/edit`}
                        className="btn btn--secondary btn--sm"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', padding: 0 }}
                        title="تعديل الفرصة"
                      >
                        <Icons.edit />
                      </Link>

                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={() => setOppToDelete(opp.id)}
                        disabled={processingId === opp.id}
                        title="حذف الفرصة"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', padding: 0, color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                      >
                        <Icons.trash />
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
