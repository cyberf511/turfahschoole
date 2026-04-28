'use client';

import { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole } from '@/actions/users';
import type { Profile } from '@/types';
import { formatDate } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  student: 'طالب',
  coordinator: 'منسق التطوع',
  super_admin: 'المشرف العام',
};

export default function AdminPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getAllUsers().then((res) => {
      if (res.success) setUsers(res.data || []);
      setLoading(false);
    });
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'student' | 'coordinator') => {
    setUpdatingId(userId);
    setMessage('');
    const res = await updateUserRole(userId, newRole);
    if (res.success) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      setMessage(`تم تحديث الدور بنجاح ✅`);
    } else {
      setMessage(res.error || 'فشل');
    }
    setUpdatingId(null);
  };

  const filtered = users.filter((u) =>
    (u.full_name?.includes(search) || u.email.includes(search))
  );

  if (loading) return <div className="page-loading" style={{ minHeight: '100vh' }}><div className="loading-spinner loading-spinner--lg" /></div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }} className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">👑 لوحة المشرف العام</h1>
          <p className="section-subtitle">إدارة المستخدمين والأدوار</p>
        </div>
        <span className="badge badge--verified">مشرف عام</span>
      </div>

      {message && (
        <div className="toast toast--success" style={{ position: 'static', marginBottom: '16px' }}>{message}</div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <input
          className="form-input"
          placeholder="🔍 ابحث بالاسم أو البريد الإلكتروني..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>المستخدم</th>
              <th>البريد الإلكتروني</th>
              <th>الدور</th>
              <th>تاريخ الانضمام</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="flex-gap">
                    <div className="avatar avatar--sm">
                      {user.avatar_url ? <img src={user.avatar_url} alt="" /> : (user.full_name?.[0] || '؟')}
                    </div>
                    <span style={{ fontWeight: 600 }}>{user.full_name || '—'}</span>
                  </div>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                <td>
                  <span className={`badge ${user.role === 'super_admin' ? 'badge--verified' : user.role === 'coordinator' ? 'badge--approved' : 'badge--role'}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{formatDate(user.created_at)}</td>
                <td>
                  {user.role === 'super_admin' ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>—</span>
                  ) : user.role === 'student' ? (
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={() => handleRoleChange(user.id, 'coordinator')}
                      disabled={updatingId === user.id}
                    >
                      {updatingId === user.id ? '...' : '⬆️ ترقية لمنسق'}
                    </button>
                  ) : (
                    <button
                      className="btn btn--danger btn--sm"
                      onClick={() => handleRoleChange(user.id, 'student')}
                      disabled={updatingId === user.id}
                    >
                      {updatingId === user.id ? '...' : '⬇️ تخفيض لطالب'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
