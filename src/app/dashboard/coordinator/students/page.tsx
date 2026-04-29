'use client';

import { useState } from 'react';
import useSWR from 'swr';
import * as XLSX from 'xlsx';
import { bulkPreRegisterStudents, getPreRegisteredStudents, updatePreRegisteredStudent, deletePreRegisteredStudent } from '@/actions/students';
import { Loading } from '@/components/ui/Loading';
import type { PreRegisteredStudent } from '@/actions/students';

export default function CoordinatorStudents() {
  const { data: res, error, mutate } = useSWR('pre-registered-students', getPreRegisteredStudents);
  const students = res?.success ? res.data || [] : [];
  const loading = !res && !error;

  const [isUploading, setIsUploading] = useState(false);
  const [editingStudent, setEditingStudent] = useState<PreRegisteredStudent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string }>({ type: 'success', text: '' });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage({ text: '', type: 'success' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        let startIndex = 0;
        if (rows[0] && typeof rows[0][0] === 'string' && (rows[0][0].includes('email') || rows[0][0].includes('البريد'))) startIndex = 1;

        const parsedStudents: PreRegisteredStudent[] = [];
        
        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (row && row.length >= 2 && row[0] && String(row[0]).trim() !== '') {
            parsedStudents.push({
              email: String(row[0]).trim(),
              full_name: String(row[1] || '').trim(),
              national_id: row[2] ? String(row[2]).trim() : undefined,
              phone: row[3] ? String(row[3]).trim() : undefined,
              education_level: row[4] ? String(row[4]).trim() : 'first_secondary'
            });
          }
        }

        if (parsedStudents.length === 0) {
          setMessage({ text: 'لم يتم العثور على بيانات صالحة في الملف', type: 'error' });
          return;
        }

        const uploadRes = await bulkPreRegisterStudents(parsedStudents);
        if (uploadRes.success) {
          setMessage({ text: `تم رفع ${uploadRes.data?.count} طالبة بنجاح ✅`, type: 'success' });
          mutate();
        } else {
          setMessage({ text: uploadRes.error || 'فشل في الرفع', type: 'error' });
        }
      } catch (err) {
        console.error(err);
        setMessage({ text: 'حدث خطأ في قراءة ملف الإكسل', type: 'error' });
      }
    };

    reader.onerror = () => {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء معالجة الملف' });
    };

    reader.onloadend = () => {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    };

    reader.readAsArrayBuffer(file);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.id) return;
    
    setIsSubmitting(true);
    const res = await updatePreRegisteredStudent(editingStudent.id, editingStudent);
    if (res.success) {
      setMessage({ type: 'success', text: 'تم تحديث بيانات الطالبة بنجاح' });
      setEditingStudent(null);
      mutate();
    } else {
      setMessage({ type: 'error', text: res.error || 'حدث خطأ أثناء التحديث' });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الطالبة؟')) return;
    
    setDeletingId(id);
    const res = await deletePreRegisteredStudent(id);
    if (res.success) {
      setMessage({ type: 'success', text: 'تم حذف الطالبة بنجاح' });
      mutate();
    } else {
      setMessage({ type: 'error', text: res.error || 'حدث خطأ أثناء الحذف' });
    }
    setDeletingId(null);
  };

  const handleDisable = () => {
    setMessage({ type: 'error', text: 'لا يمكن تعطيل الطالبات في مرحلة التسجيل المسبق، يمكنك حذفهن فقط.' });
  };

  const downloadTemplate = () => {
    const headers = ['البريد الإلكتروني', 'الاسم الرباعي', 'رقم الهوية', 'رقم الجوال', 'المرحلة الدراسية'];
    const sample = ['student@example.com', 'نورة محمد', '1122334455', '0500000000', 'first_secondary'];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطالبات");
    XLSX.writeFile(wb, "قالب_تسجيل_الطالبات.xlsx");
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-slide-up">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="section-title">👥 الطالبات</h1>
          <p className="section-subtitle">إدارة الطالبات وتخطي مرحلة التسجيل عبر رفع ملف الإكسل</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn--secondary" onClick={downloadTemplate} style={{ fontSize: '0.85rem' }}>
            ⬇️ تحميل قالب إكسل (XLSX)
          </button>
          <label className="btn btn--primary" style={{ cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isUploading ? 'جاري الرفع...' : '+ رفع ملف إكسل'}
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isUploading} />
          </label>
        </div>
      </div>



      <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>قائمة الطالبات ({students.length})</h2>
      
      {students.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state__icon">📋</div>
          <div className="empty-state__title">لا توجد سجلات مسبقة</div>
          <div className="empty-state__desc">قم برفع ملف إكسل لإضافة طالبات للنظام مباشرة ليتمكنوا من تخطي صفحة التسجيل</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrap" style={{ border: 'none' }}>
            <table className="data-table">
              <thead style={{ background: 'var(--bg-tertiary)' }}>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center', padding: '16px 20px' }}>#</th>
                  <th style={{ padding: '16px 20px' }}>البريد الإلكتروني</th>
                  <th style={{ padding: '16px 20px' }}>الاسم الكامل</th>
                  <th style={{ padding: '16px 20px' }}>الجوال</th>
                  <th style={{ padding: '16px 20px' }}>الهوية</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={idx} style={{ cursor: 'default' }}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-tertiary)', padding: '16px 20px' }}>{idx + 1}</td>
                    <td style={{ textAlign: 'right', padding: '16px 20px' }}>
                      <span dir="ltr" style={{ display: 'inline-block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{student.email}</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="flex-gap">
                        <div className="avatar avatar--sm" style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>
                          {student.full_name?.[0] || '؟'}
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.full_name}</div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', padding: '16px 20px' }}>
                      <span dir="ltr" style={{ display: 'inline-block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{student.phone || '—'}</span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '16px 20px' }}>
                      <span dir="ltr" style={{ display: 'inline-block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{student.national_id || '—'}</span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => setEditingStudent(student)}
                        >
                          ✏️ تعديل
                        </button>
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={handleDisable}
                          style={{ color: '#f59e0b', borderColor: 'transparent' }}
                          title="تعطيل"
                        >
                          🚫
                        </button>
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => student.id && handleDelete(student.id)}
                          disabled={deletingId === student.id}
                          style={{ color: 'var(--error)', borderColor: 'transparent' }}
                          title="حذف"
                        >
                          {deletingId === student.id ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <div className="modal-overlay animate-fade-in" onClick={() => !isSubmitting && setEditingStudent(null)}>
          <div className="modal card animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">تعديل بيانات الطالبة</h3>
              <button className="modal__close" onClick={() => !isSubmitting && setEditingStudent(null)} disabled={isSubmitting}>×</button>
            </div>
            <div className="modal__content">
              <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">الاسم الكامل</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingStudent.full_name}
                    onChange={e => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editingStudent.email}
                    onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم الجوال</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingStudent.phone || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم الهوية</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingStudent.national_id || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, national_id: e.target.value })}
                  />
                </div>
                <div className="modal__footer" style={{ marginTop: '24px' }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setEditingStudent(null)} disabled={isSubmitting}>
                    إلغاء
                  </button>
                  <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
