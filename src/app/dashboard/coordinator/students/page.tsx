'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { bulkPreRegisterStudents, getPreRegisteredStudents, type PreRegisteredStudent } from '@/actions/students';
import { Loading } from '@/components/ui/Loading';

export default function CoordinatorStudents() {
  const { data: res, error, mutate } = useSWR('pre-registered-students', getPreRegisteredStudents);
  const students = res?.success ? res.data || [] : [];
  const loading = !res && !error;

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage({ text: '', type: '' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').map(row => row.split(','));
      
      // Assume CSV format: email,full_name,national_id,phone,education_level
      // Skip header row if exists
      let startIndex = 0;
      if (rows[0] && rows[0][0].toLowerCase().includes('email')) startIndex = 1;

      const parsedStudents: PreRegisteredStudent[] = [];
      
      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (row.length >= 2 && row[0].trim() !== '') {
          parsedStudents.push({
            email: row[0].trim(),
            full_name: row[1]?.trim() || '',
            national_id: row[2]?.trim() || undefined,
            phone: row[3]?.trim() || undefined,
            education_level: row[4]?.trim() || 'first_secondary'
          });
        }
      }

      if (parsedStudents.length === 0) {
        setMessage({ text: 'لم يتم العثور على بيانات صالحة في الملف', type: 'error' });
        setUploading(false);
        return;
      }

      const uploadRes = await bulkPreRegisterStudents(parsedStudents);
      if (uploadRes.success) {
        setMessage({ text: `تم رفع ${uploadRes.data?.count} طالبة بنجاح ✅`, type: 'success' });
        mutate();
      } else {
        setMessage({ text: uploadRes.error || 'فشل في الرفع', type: 'error' });
      }
      setUploading(false);
    };

    reader.onerror = () => {
      setMessage({ text: 'حدث خطأ أثناء قراءة الملف', type: 'error' });
      setUploading(false);
    };

    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const downloadTemplate = () => {
    const headers = ['email', 'full_name', 'national_id', 'phone', 'education_level'];
    const sample = ['student@example.com', 'نورة محمد', '1122334455', '0500000000', 'first_secondary'];
    
    const csvContent = [
      headers.join(','),
      sample.join(',')
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for Excel UTF-8 BOM
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'قالب_تسجيل_الطالبات.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-slide-up">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="section-title">👥 إدارة الطالبات (التسجيل المسبق)</h1>
          <p className="section-subtitle">رفع قائمة الطالبات لتخطي مرحلة التسجيل (Onboarding)</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn--secondary" onClick={downloadTemplate} style={{ fontSize: '0.85rem' }}>
            ⬇️ تحميل قالب CSV
          </button>
          <label className="btn btn--primary" style={{ cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {uploading ? 'جاري الرفع...' : '+ رفع ملف CSV'}
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
          </label>
        </div>
      </div>

      {message.text && (
        <div className={`toast toast--${message.type === 'success' ? 'success' : 'error'}`} style={{ position: 'static', marginBottom: '24px' }}>
          {message.text}
        </div>
      )}

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>كيفية تجهيز ملف CSV</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.8' }}>
          يجب أن يحتوي ملف الإكسل (المحفوظ بصيغة CSV - Comma Separated Values) على الأعمدة التالية بالترتيب:
          <br />
          <strong style={{ color: 'var(--text-primary)' }}>1. البريد الإلكتروني (Email)</strong> (إلزامي)<br />
          <strong style={{ color: 'var(--text-primary)' }}>2. الاسم الكامل (Full Name)</strong> (إلزامي)<br />
          <strong style={{ color: 'var(--text-primary)' }}>3. رقم الهوية (National ID)</strong> (اختياري)<br />
          <strong style={{ color: 'var(--text-primary)' }}>4. رقم الجوال (Phone)</strong> (اختياري)<br />
          <strong style={{ color: 'var(--text-primary)' }}>5. المرحلة الدراسية (Education Level)</strong> (اختياري: first_secondary, second_secondary, third_secondary)
        </p>
      </div>

      <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>الطالبات المسجلات مسبقاً ({students.length})</h2>
      
      {students.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state__icon">📋</div>
          <div className="empty-state__title">لا توجد سجلات مسبقة</div>
          <div className="empty-state__desc">قم برفع ملف CSV لإضافة طالبات للنظام مباشرة ليتمكنوا من تخطي صفحة التسجيل</div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>البريد الإلكتروني</th>
                <th>الاسم الكامل</th>
                <th>الجوال</th>
                <th>الهوية</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr key={idx}>
                  <td style={{ direction: 'ltr', textAlign: 'right' }}>{student.email}</td>
                  <td>{student.full_name}</td>
                  <td style={{ direction: 'ltr', textAlign: 'right' }}>{student.phone || '—'}</td>
                  <td>{student.national_id || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
