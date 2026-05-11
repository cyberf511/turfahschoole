'use client';

import { useState } from 'react';
import useSWR from 'swr';
import ExcelJS from 'exceljs';
import { bulkPreRegisterStudents, getPreRegisteredStudents, updatePreRegisteredStudent, deletePreRegisteredStudent, bulkDeletePreRegisteredStudents, addPreRegisteredStudent } from '@/actions/students';
import { PreRegisteredStudentSchema } from '@/lib/validations';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { PreRegisteredStudent } from '@/actions/students';
import { EDUCATION_LABELS } from '@/types';

const Icons = {
  trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
};

export default function CoordinatorStudents() {
  const { data: res, error, mutate } = useSWR('pre-registered-students', getPreRegisteredStudents);
  const students = res?.success ? res.data || [] : [];
  const loading = !res && !error;

  const [isUploading, setIsUploading] = useState(false);
  const [editingStudent, setEditingStudent] = useState<PreRegisteredStudent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalError, setAddModalError] = useState('');
  const [editModalError, setEditModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStudent, setNewStudent] = useState<Omit<PreRegisteredStudent, 'id'>>({
    email: '',
    full_name: '',
    national_id: '',
    phone: '',
    education_level: 'first_secondary'
  });
  const [viewingStudent, setViewingStudent] = useState<PreRegisteredStudent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string }>({ type: 'success', text: '' });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);
    setMessage({ text: '', type: 'success' });

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => prev < 90 ? prev + 10 : prev);
    }, 200);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        const rows: any[][] = [];
        worksheet.eachRow((row) => {
          rows.push((row.values as any[]).slice(1));
        });

        let startIndex = 0;
        if (rows[0] && typeof rows[0][0] === 'string' && (rows[0][0].includes('email') || rows[0][0].includes('البريد'))) startIndex = 1;

        const parsedStudents: PreRegisteredStudent[] = [];
        const validationErrors: string[] = [];
        
        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (row && row.length >= 2 && row[0] && String(row[0]).trim() !== '') {
            const studentData = {
              email: String(row[0]).trim(),
              full_name: String(row[1] || '').trim(),
              national_id: row[2] ? String(row[2]).trim() : '',
              phone: row[3] ? String(row[3]).trim() : undefined,
              education_level: row[4] ? String(row[4]).trim() : 'first_secondary'
            };

            const validation = PreRegisteredStudentSchema.safeParse(studentData);
            if (validation.success) {
              parsedStudents.push(studentData);
            } else {
              validationErrors.push(`السطر ${i + 1}: ${validation.error.issues[0]?.message}`);
            }
          }
        }

        if (validationErrors.length > 0) {
          setMessage({ text: `أخطاء في البيانات:\n${validationErrors.slice(0, 5).join('\n')}${validationErrors.length > 5 ? `\n...و ${validationErrors.length - 5} أخطاء أخرى` : ''}`, type: 'error' });
          return;
        }

        if (parsedStudents.length === 0) {
          setMessage({ text: 'لم يتم العثور على بيانات صالحة في الملف', type: 'error' });
          return;
        }

        const uploadRes = await bulkPreRegisterStudents(parsedStudents);
        if (uploadRes.success) {
          setUploadProgress(100);
          setMessage({ text: `تم رفع ${uploadRes.data?.count} طالبة بنجاح ✅`, type: 'success' });
          mutate();
        } else {
          setUploadProgress(0);
          setMessage({ text: uploadRes.error || 'فشل في الرفع', type: 'error' });
        }
      } catch (err) {
        console.error(err);
        setUploadProgress(0);
        setMessage({ text: 'حدث خطأ في قراءة ملف الإكسل', type: 'error' });
      }
      clearInterval(progressInterval);
    };

    reader.onerror = () => {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء معالجة الملف' });
    };

    reader.onloadend = () => {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1500);
      if (e.target) e.target.value = '';
    };

    reader.readAsArrayBuffer(file);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.id) return;
    
    setEditModalError('');
    setIsSubmitting(true);
    const res = await updatePreRegisteredStudent(editingStudent.id, editingStudent);
    if (res.success) {
      setEditingStudent(null);
      mutate();
    } else {
      setEditModalError(res.error || 'حدث خطأ أثناء التحديث');
    }
    setIsSubmitting(false);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddModalError('');
    
    const validation = PreRegisteredStudentSchema.safeParse(newStudent);
    if (!validation.success) {
      setAddModalError(validation.error.issues[0]?.message || 'البيانات غير صالحة');
      return;
    }
    
    setIsSubmitting(true);
    const res = await addPreRegisteredStudent(newStudent);
    if (res.success) {
      setMessage({ type: 'success', text: 'تم إضافة الطالبة بنجاح' });
      setShowAddModal(false);
      setNewStudent({ email: '', full_name: '', national_id: '', phone: '', education_level: 'first_secondary' });
      mutate();
    } else {
      setAddModalError(res.error || 'حدث خطأ أثناء الإضافة');
    }
    setIsSubmitting(false);
  };

  const executeDelete = async () => {
    if (!studentToDelete) return;
    
    setDeletingId(studentToDelete);
    const id = studentToDelete;
    setStudentToDelete(null);
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

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (!students) return;
    if (selectedIds.size === students.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(students.map(s => s.id as string)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setIsBulkProcessing(true);
    setBulkDeleteProgress(0);
    
    const idsArray = Array.from(selectedIds);
    const total = idsArray.length;
    const progressInterval = setInterval(() => {
      setBulkDeleteProgress(prev => {
        const next = prev + (100 / total);
        return next < 90 ? next : prev;
      });
    }, 150);
    
    const res = await bulkDeletePreRegisteredStudents(idsArray);
    clearInterval(progressInterval);
    
    if (res.success) {
      setBulkDeleteProgress(100);
      setTimeout(() => {
        setMessage({ type: 'success', text: `تم حذف ${total} طالبة بنجاح ✅` });
        setSelectedIds(new Set());
        setShowBulkDeleteModal(false);
        setBulkDeleteProgress(0);
        mutate();
      }, 800);
    } else {
      setBulkDeleteProgress(0);
      setMessage({ type: 'error', text: res.error || 'حدث خطأ أثناء الحذف الجماعي' });
    }
    setIsBulkProcessing(false);
  };

  const downloadTemplate = async () => {
    const headers = ['البريد الإلكتروني', 'الاسم الرباعي', 'رقم الهوية', 'رقم الجوال', 'المرحلة الدراسية'];
    const sample = ['student@example.com', 'نورة محمد', '1122334455', '0500000000', 'first_secondary'];
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('الطالبات');
    worksheet.addRow(headers);
    worksheet.addRow(sample);
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'قالب_تسجيل_الطالبات.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <button className="btn btn--primary" onClick={() => setShowAddModal(true)}>
            + إضافة طالبة
          </button>
          <label className="btn btn--primary" style={{ cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isUploading ? 'جاري الرفع...' : '+ رفع ملف إكسل'}
            <input type="file" id="file-upload" name="file-upload" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isUploading} />
          </label>
        </div>
      </div>

      {isUploading && (
        <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
          <ProgressBar progress={uploadProgress} status="uploading" />
        </div>
      )}

      {message.text && (
        <div className={`alert alert--${message.type}`} style={{ marginBottom: '16px' }}>
          {message.text}
        </div>
      )}

      <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>قائمة الطالبات ({students.length})</h2>
      
      {students.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state__icon">📋</div>
          <div className="empty-state__title">لا توجد سجلات مسبقة</div>
          <div className="empty-state__desc">قم برفع ملف إكسل لإضافة طالبات للنظام مباشرة ليتمكنوا من تخطي صفحة التسجيل</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {selectedIds.size > 0 && (
            <div style={{ background: 'var(--accent-primary-soft)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>تم تحديد {selectedIds.size} طالبة</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn--secondary btn--sm" onClick={() => setShowBulkDeleteModal(true)} disabled={isBulkProcessing} style={{ color: 'var(--error)', borderColor: 'transparent' }}>حذف المحدد</button>
              </div>
            </div>
          )}
          <div className="data-table-wrap" style={{ border: 'none' }}>
            <table className="data-table">
              <thead style={{ background: 'var(--bg-tertiary)' }}>
                <tr>
                    <th style={{ padding: '16px 20px', width: '40px' }}>
                    <input type="checkbox" id="select-all-students" name="select-all-students" checked={students.length > 0 && selectedIds.size === students.length} onChange={toggleAll} />
                  </th>
                  <th style={{ width: '40px', textAlign: 'center', padding: '16px 20px' }}>#</th>
                  <th style={{ padding: '16px 20px' }}>البريد الإلكتروني</th>
                  <th style={{ padding: '16px 20px' }}>الاسم الكامل</th>
                  <th style={{ padding: '16px 20px' }}>المرحلة</th>
                  <th style={{ padding: '16px 20px' }}>الجوال</th>
                  <th style={{ padding: '16px 20px' }}>الهوية</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.id} style={{ background: student.id && selectedIds.has(student.id) ? 'var(--accent-primary-soft)' : 'transparent' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <input type="checkbox" id={`select-student-${student.id}`} name="select-student" checked={student.id ? selectedIds.has(student.id) : false} onChange={() => student.id && toggleSelection(student.id)} />
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-tertiary)', padding: '16px 20px' }}>{idx + 1}</td>
                    <td style={{ textAlign: 'right', padding: '16px 20px' }}>
                      <span dir="ltr" style={{ display: 'inline-block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{student.email}</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="flex-gap" style={{ cursor: 'pointer' }} onClick={() => setViewingStudent(student)}>
                        <div className="avatar avatar--sm" style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>
                          {student.full_name?.[0] || '؟'}
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--accent-primary)', textDecoration: 'underline', textDecorationColor: 'var(--border)' }}>{student.full_name}</div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', padding: '16px 20px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{EDUCATION_LABELS[student.education_level as keyof typeof EDUCATION_LABELS] || student.education_level || '—'}</span>
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
                          onClick={() => student.id && setStudentToDelete(student.id)}
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

      <Modal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        title="تأكيد الحذف"
        description="هل أنت متأكد من رغبتك في حذف هذه الطالبة من نظام التسجيل المسبق؟"
        onConfirm={executeDelete}
        confirmText="نعم، احذف"
        isDanger={true}
        icon={<Icons.trash />}
      />

      <Modal
        isOpen={showBulkDeleteModal}
        onClose={() => !isBulkProcessing && setShowBulkDeleteModal(false)}
        title="تأكيد الحذف الجماعي"
        description={`هل أنت متأكد من رغبتك في حذف ${selectedIds.size} طالبة؟`}
        onConfirm={!isBulkProcessing ? handleBulkDelete : undefined}
        confirmText={isBulkProcessing ? 'جاري الحذف...' : 'نعم، احذف المحدد'}
        cancelText={isBulkProcessing ? undefined : 'إلغاء'}
        isDanger={true}
        icon={<Icons.trash />}
      >
        {isBulkProcessing && (
          <ProgressBar progress={bulkDeleteProgress} status="deleting" />
        )}
      </Modal>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => !isSubmitting && setShowAddModal(false)}>
          <div className="modal card animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">إضافة طالبة جديدة</h3>
              <button className="modal__close" onClick={() => !isSubmitting && setShowAddModal(false)} disabled={isSubmitting}>×</button>
            </div>
            <div className="modal__content">
              <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {addModalError && (
                  <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>
                    {addModalError}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="add-full-name">الاسم الرباعي</label>
                  <input
                    type="text"
                    id="add-full-name"
                    name="full_name"
                    className="form-input"
                    value={newStudent.full_name}
                    onChange={e => setNewStudent({ ...newStudent, full_name: e.target.value })}
                    required
                    placeholder="مثال: نورة محمد أحمد العتيبي"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="add-email">البريد الإلكتروني</label>
                  <input
                    type="email"
                    id="add-email"
                    name="email"
                    className="form-input"
                    value={newStudent.email}
                    onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                    required
                    placeholder="student@example.com"
                    dir="ltr"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="add-phone">رقم الجوال</label>
                  <input
                    type="text"
                    id="add-phone"
                    name="phone"
                    className="form-input"
                    value={newStudent.phone}
                    onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="add-national-id">رقم الهوية</label>
                  <input
                    type="text"
                    id="add-national-id"
                    name="national_id"
                    className="form-input"
                    value={newStudent.national_id}
                    onChange={e => setNewStudent({ ...newStudent, national_id: e.target.value })}
                    required
                    placeholder="1xxxxxxxxx"
                    dir="ltr"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="add-education-level">المرحلة الدراسية</label>
                  <select
                    id="add-education-level"
                    name="education_level"
                    className="form-input"
                    value={newStudent.education_level}
                    onChange={e => setNewStudent({ ...newStudent, education_level: e.target.value })}
                  >
                    <option value="first_secondary">أول ثانوي</option>
                    <option value="second_secondary">ثاني ثانوي</option>
                    <option value="third_secondary">ثالث ثانوي</option>
                  </select>
                </div>
                <div className="modal__footer" style={{ marginTop: '24px' }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
                    إلغاء
                  </button>
                  <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                    {isSubmitting ? 'جاري الإضافة...' : 'إضافة الطالبة'}
                  </button>
                </div>
              </form>
            </div>
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
                {editModalError && (
                  <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>
                    {editModalError}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-full-name">الاسم الكامل</label>
                  <input
                    type="text"
                    id="edit-full-name"
                    name="full_name"
                    className="form-input"
                    value={editingStudent.full_name}
                    onChange={e => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-email">البريد الإلكتروني</label>
                  <input
                    type="email"
                    id="edit-email"
                    name="email"
                    className="form-input"
                    value={editingStudent.email}
                    onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-phone">رقم الجوال</label>
                  <input
                    type="text"
                    id="edit-phone"
                    name="phone"
                    className="form-input"
                    value={editingStudent.phone || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-national-id">رقم الهوية</label>
                  <input
                    type="text"
                    id="edit-national-id"
                    name="national_id"
                    className="form-input"
                    value={editingStudent.national_id || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, national_id: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-education-level">المرحلة الدراسية</label>
                  <select
                    id="edit-education-level"
                    name="education_level"
                    className="form-input"
                    value={editingStudent.education_level || 'first_secondary'}
                    onChange={e => setEditingStudent({ ...editingStudent, education_level: e.target.value })}
                  >
                    {Object.entries(EDUCATION_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
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

      {/* Student Detail Modal */}
      {viewingStudent && (
        <div className="modal-overlay animate-fade-in" onClick={() => setViewingStudent(null)}>
          <div className="modal card animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal__header">
              <h3 className="modal__title">بيانات الطالبة</h3>
              <button className="modal__close" onClick={() => setViewingStudent(null)}>×</button>
            </div>
            <div className="modal__content" style={{ padding: '0 24px 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div className="avatar" style={{ width: 72, height: 72, fontSize: '1.8rem', background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)', margin: '0 auto 12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {viewingStudent.full_name?.[0] || '?'}
                </div>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', color: 'var(--text-primary)' }}>{viewingStudent.full_name}</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'البريد الإلكتروني', value: viewingStudent.email, dir: 'ltr' },
                  { label: 'رقم الجوال', value: viewingStudent.phone || '—', dir: 'ltr' },
                  { label: 'رقم الهوية', value: viewingStudent.national_id || '—', dir: 'ltr' },
                  { label: 'المرحلة الدراسية', value: EDUCATION_LABELS[viewingStudent.education_level as keyof typeof EDUCATION_LABELS] || viewingStudent.education_level || '—' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.label}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', textAlign: 'left' }} dir={item.dir}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
