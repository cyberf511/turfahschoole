'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getOpportunity, updateOpportunity } from '@/actions/opportunities';
import { Edit } from 'lucide-react';

export default function EditOpportunity() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', location: '', hours: '',
    requirements: '', max_participants: '', start_date: '', end_date: '',
  });

  useEffect(() => {
    getOpportunity(id).then((res) => {
      if (res.success && res.data) {
        const d = res.data;
        setForm({
          title: d.title || '',
          description: d.description || '',
          location: d.location || '',
          hours: d.hours ? d.hours.toString() : '',
          requirements: d.requirements || '',
          max_participants: d.max_participants ? d.max_participants.toString() : '',
          start_date: d.start_date || '',
          end_date: d.end_date || '',
        });
      } else {
        setError('تعذر تحميل بيانات الفرصة');
      }
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.location || !form.hours) {
      setError('العنوان والوصف والموقع والساعات مطلوبة');
      return;
    }
    setSaving(true);
    setError('');
    const res = await updateOpportunity(id, {
      title: form.title,
      description: form.description,
      location: form.location,
      hours: parseFloat(form.hours),
      requirements: form.requirements || undefined,
      max_participants: form.max_participants ? parseInt(form.max_participants) : undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
    });
    if (res.success) {
      router.push('/dashboard/coordinator/opportunities');
    } else {
      setError(res.error || 'حدث خطأ أثناء التحديث');
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner loading-spinner--lg" /></div>;

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Edit color="var(--accent-primary)" /> تعديل الفرصة التطوعية</h1>
          <p className="section-subtitle">تعديل بيانات الفرصة التطوعية الحالية</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '700px' }}>
        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label className="form-label">عنوان الفرصة *</label>
            <input className="form-input" placeholder="مثال: تنظيف الحي" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">الوصف *</label>
            <textarea className="form-input" placeholder="وصف تفصيلي للفرصة التطوعية" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">الموقع *</label>
              <input className="form-input" placeholder="مثال: مدرسة الملك فهد" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">عدد الساعات *</label>
              <input className="form-input" type="number" min="1" step="0.5" placeholder="مثال: 8" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} dir="ltr" style={{ textAlign: 'right' }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">المتطلبات (اختياري)</label>
            <input className="form-input" placeholder="أي متطلبات خاصة" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">الحد الأقصى للمشاركين</label>
              <input className="form-input" type="number" min="1" placeholder="اختياري" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} dir="ltr" style={{ textAlign: 'right' }} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">تاريخ البداية</label>
              <input className="form-input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">تاريخ النهاية</label>
              <input className="form-input" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          {error && <div className="form-error" style={{ padding: '10px', background: 'var(--danger-soft)', borderRadius: 'var(--radius-md)' }}>{error}</div>}
          <div className="flex-gap">
            <button type="submit" className="btn btn--primary btn--lg" disabled={saving}>
              {saving ? <span className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : 'حفظ التغييرات'}
            </button>
            <button type="button" className="btn btn--secondary btn--lg" onClick={() => router.back()}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}
