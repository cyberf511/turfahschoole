'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getAllUsers, updateUserRole, deleteUser } from '@/actions/users';
import type { Profile } from '@/types';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { StatsCards } from '@/components/ui/StatsCards';
import { exportToCSV } from '@/lib/export';
import { Loading } from '@/components/ui/Loading';

const ROLE_LABELS: Record<string, string> = {
  student: 'طالبة',
  coordinator: 'منسقة التطوع',
  super_admin: 'المشرفة العامة',
};

// Premium SVG Icons
const Icons = {
  shield: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  upArrow: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>,
  downArrow: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>,
  trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  users: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
};

export default function AdminPage() {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Pagination & Stats
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    const res = await getAllUsers(page, 10);
    if (res.success) {
      setUsers(res.data || []);
      setTotalPages(res.totalPages || 1);
      if (res.stats) setStats(res.stats);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: 'student' | 'coordinator') => {
    setUpdatingId(userId);
    const res = await updateUserRole(userId, newRole);
    if (res.success) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      setToast({ message: 'تم تحديث صلاحية المستخدم بنجاح', type: 'success' });
      loadData(); // Reload stats
    } else {
      setToast({ message: res.error || 'فشل التحديث', type: 'error' });
    }
    setUpdatingId(null);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;

    setDeletingId(userToDelete);
    setUserToDelete(null); // Close modal

    const res = await deleteUser(userToDelete);
    if (res.success) {
      setToast({ message: 'تم حذف المستخدم نهائياً', type: 'success' });
      if (users.length === 1 && page > 1) setPage(page - 1);
      else loadData(); // Reload stats & page
    } else {
      setToast({ message: res.error || 'فشل الحذف', type: 'error' });
    }
    setDeletingId(null);
  };

  const handleExport = () => {
    const exportData = users.map(u => ({
      'الاسم': u.full_name || '—',
      'البريد الإلكتروني': u.email,
      'الصلاحية': ROLE_LABELS[u.role],
      'تاريخ الانضمام': formatDate(u.created_at)
    }));
    exportToCSV(exportData, 'users_export');
  };

  const filtered = users.filter((u) =>
    (u.full_name?.includes(search) || u.email.includes(search))
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 0' }} className="animate-slide-up">

      {/* Header Section */}
      <div className="section-header">
        <div>
          <h1 className="dash-card-wrap__title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem' }}>
            <span style={{ color: 'var(--accent-primary)' }}><Icons.shield /></span>
            لوحة المشرف العام
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            إدارة كافة المستخدمين وتعيين الصلاحيات الخاصة بالمنصة
          </p>
        </div>
        <button className="btn btn--secondary" onClick={handleExport} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Icons.download /> تصدير CSV
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <StatsCards stats={[
          { label: 'إجمالي المستخدمين', value: stats.total, icon: '👥', color: 'var(--accent-primary)' },
          { label: 'الطلاب', value: stats.students, icon: '🎓', color: '#10b981' },
          { label: 'المنسقةين', value: stats.coordinators, icon: '👨‍💼', color: '#f59e0b' },
          { label: 'المشرفين', value: stats.admins, icon: '🛡️', color: '#8b5cf6' }
        ]} />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="تأكيد الحذف النهائي"
        description="هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ سيتم مسح كافة بياناته نهائياً ولا يمكن التراجع عن هذا الإجراء."
        onConfirm={executeDelete}
        confirmText="نعم، احذف"
        isDanger={true}
        icon={<Icons.trash />}
      />

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)' }}>
        <span style={{ color: 'var(--text-tertiary)' }}><Icons.search /></span>
        <input
          className="form-input"
          placeholder="ابحث باستخدام الاسم أو البريد الإلكتروني..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', padding: 0, boxShadow: 'none' }}
        />
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrap" style={{ border: 'none' }}>
          <table className="data-table">
            <thead style={{ background: 'var(--bg-tertiary)' }}>
              <tr>
                <th style={{ padding: '16px 20px' }}>المستخدم</th>
                <th style={{ padding: '16px 20px' }}>البريد الإلكتروني</th>
                <th style={{ padding: '16px 20px' }}>الصلاحية</th>
                <th style={{ padding: '16px 20px' }}>تاريخ الانضمام</th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)' }}>
                    لا توجد نتائج مطابقة للبحث
                  </td>
                </tr>
              ) : filtered.map((user) => (
                <tr key={user.id}>
                  <td style={{ padding: '16px 20px' }}>
                    <div className="flex-gap">
                      <div className="avatar avatar--sm" style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>
                        {user.avatar_url ? <img src={user.avatar_url} alt="" /> : (user.full_name?.[0] || '؟')}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.full_name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className={`badge ${user.role === 'super_admin' ? 'badge--verified' : user.role === 'coordinator' ? 'badge--approved' : 'badge--role'}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(user.created_at)}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {user.role === 'super_admin' ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', padding: '0 8px' }}>—</span>
                      ) : user.role === 'student' ? (
                        <button
                          className="btn btn--primary btn--sm"
                          onClick={() => handleRoleChange(user.id, 'coordinator')}
                          disabled={updatingId === user.id || deletingId === user.id}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          {updatingId === user.id ? <div className="loading-spinner" style={{ width: '14px', height: '14px' }} /> : <><Icons.upArrow /> ترقية لمنسقة</>}
                        </button>
                      ) : (
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => handleRoleChange(user.id, 'student')}
                          disabled={updatingId === user.id || deletingId === user.id}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        >
                          {updatingId === user.id ? <div className="loading-spinner" style={{ width: '14px', height: '14px' }} /> : <><Icons.downArrow /> تخفيض لطالب</>}
                        </button>
                      )}

                      {currentUser?.id !== user.id && (
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => setUserToDelete(user.id)}
                          disabled={deletingId === user.id || updatingId === user.id}
                          title="حذف المستخدم"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', padding: 0, color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'transparent' }}
                        >
                          {deletingId === user.id ? <div className="loading-spinner" style={{ width: '14px', height: '14px' }} /> : <Icons.trash />}
                        </button>
                      )}
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
