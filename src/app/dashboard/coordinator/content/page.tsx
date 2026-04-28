'use client';

import { useEffect, useState, useRef } from 'react';
import { Loading } from '@/components/ui/Loading';
import { getAllContent, createContent, updateContent, deleteContent, getContentUploadUrl, type SiteContent } from '@/actions/content';

const TYPE_LABELS: Record<SiteContent['type'], string> = {
  hero_image: '🖼️ صورة الغلاف',
  news: '📰 خبر',
  achievement: '🏆 إنجاز',
  stat: '📊 إحصائية',
  gallery_image: '📸 صورة معرض',
};

const TYPE_OPTIONS: SiteContent['type'][] = ['hero_image', 'stat', 'news', 'achievement', 'gallery_image'];

export default function ContentManagement() {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    type: 'stat' as SiteContent['type'],
    title: '',
    description: '',
    image_url: '',
    stat_value: '',
    stat_label: '',
    sort_order: 0,
  });

  const load = async () => {
    const res = await getAllContent();
    if (res.success) setContent(res.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ type: 'stat', title: '', description: '', image_url: '', stat_value: '', stat_label: '', sort_order: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const urlRes = await getContentUploadUrl(file.name);
    if (urlRes.success && urlRes.data) {
      try {
        await fetch(urlRes.data.signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        // Build the public URL
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-content/${urlRes.data.path}`;
        setForm((prev) => ({ ...prev, image_url: publicUrl }));
        setMessage({ text: 'تم رفع الصورة ✅', type: 'success' });
      } catch {
        setMessage({ text: 'فشل في رفع الصورة', type: 'error' });
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (editingId) {
      const res = await updateContent(editingId, {
        title: form.title || undefined,
        description: form.description || undefined,
        image_url: form.image_url || undefined,
        stat_value: form.stat_value || undefined,
        stat_label: form.stat_label || undefined,
        sort_order: form.sort_order,
      });
      if (res.success) {
        setMessage({ text: 'تم التحديث ✅', type: 'success' });
        resetForm();
        load();
      } else {
        setMessage({ text: res.error || 'فشل', type: 'error' });
      }
    } else {
      const res = await createContent(form);
      if (res.success) {
        setMessage({ text: 'تم الإنشاء ✅', type: 'success' });
        resetForm();
        load();
      } else {
        setMessage({ text: res.error || 'فشل', type: 'error' });
      }
    }
  };

  const handleEdit = (item: SiteContent) => {
    setForm({
      type: item.type,
      title: item.title || '',
      description: item.description || '',
      image_url: item.image_url || '',
      stat_value: item.stat_value || '',
      stat_label: item.stat_label || '',
      sort_order: item.sort_order,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المحتوى؟')) return;
    const res = await deleteContent(id);
    if (res.success) {
      setContent((prev) => prev.filter((c) => c.id !== id));
      setMessage({ text: 'تم الحذف', type: 'success' });
    }
  };

  const handleTogglePublish = async (item: SiteContent) => {
    const res = await updateContent(item.id, { is_published: !item.is_published });
    if (res.success) {
      setContent((prev) => prev.map((c) => c.id === item.id ? { ...c, is_published: !c.is_published } : c));
    }
  };

  const filtered = filter === 'all' ? content : content.filter((c) => c.type === filter);

  if (loading) return <Loading />;

  const needsImage = ['hero_image', 'news', 'achievement', 'gallery_image'].includes(form.type);
  const needsStats = form.type === 'stat';
  const needsTitle = ['news', 'achievement', 'gallery_image'].includes(form.type);
  const needsDesc = ['news', 'achievement'].includes(form.type);

  return (
    <div className="animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">🎨 إدارة محتوى الصفحة الرئيسية</h1>
          <p className="section-subtitle">أضف وعدّل الصور والأخبار والإنجازات والإحصائيات</p>
        </div>
        <button className="btn btn--primary" onClick={() => { resetForm(); setShowForm(true); }}>
          ➕ إضافة محتوى
        </button>
      </div>

      {message.text && (
        <div className={`toast toast--${message.type === 'success' ? 'success' : 'error'}`} style={{ position: 'static', marginBottom: '16px' }}>
          {message.text}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="tabs" style={{ marginBottom: '20px', flexWrap: 'wrap' }}>
        <button className={`tab ${filter === 'all' ? 'tab--active' : ''}`} onClick={() => setFilter('all')}>الكل ({content.length})</button>
        {TYPE_OPTIONS.map((t) => (
          <button key={t} className={`tab ${filter === t ? 'tab--active' : ''}`} onClick={() => setFilter(t)}>
            {TYPE_LABELS[t]} ({content.filter((c) => c.type === t).length})
          </button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', borderColor: 'var(--accent-primary)' }}>
          <div className="card__header">
            <h3 className="card__title">{editingId ? '✏️ تعديل المحتوى' : '➕ إضافة محتوى جديد'}</h3>
            <button className="btn btn--secondary btn--sm" onClick={resetForm}>✕ إغلاق</button>
          </div>
          <form onSubmit={handleSubmit} className="onboarding-form" style={{ padding: '20px 0 0' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">نوع المحتوى</label>
                <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as SiteContent['type'] })} disabled={!!editingId}>
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">ترتيب العرض</label>
                <input className="form-input" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} dir="ltr" style={{ textAlign: 'right' }} />
              </div>
            </div>

            {needsTitle && (
              <div className="form-group">
                <label className="form-label">العنوان</label>
                <input className="form-input" placeholder="أدخل العنوان" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
            )}

            {needsDesc && (
              <div className="form-group">
                <label className="form-label">الوصف</label>
                <textarea className="form-input" placeholder="أدخل الوصف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            )}

            {needsStats && (
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">القيمة (مثال: 500+)</label>
                  <input className="form-input" placeholder="500+" value={form.stat_value} onChange={(e) => setForm({ ...form, stat_value: e.target.value })} dir="ltr" style={{ textAlign: 'right' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">التسمية (مثال: طالبة حالية)</label>
                  <input className="form-input" placeholder="طالبة حالية" value={form.stat_label} onChange={(e) => setForm({ ...form, stat_label: e.target.value })} />
                </div>
              </div>
            )}

            {needsImage && (
              <div className="form-group">
                <label className="form-label">الصورة</label>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                {form.image_url ? (
                  <div style={{ position: 'relative' }}>
                    <img src={form.image_url} alt="" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                    <button type="button" className="btn btn--danger btn--sm" style={{ position: 'absolute', top: '8px', insetInlineEnd: '8px' }} onClick={() => setForm({ ...form, image_url: '' })}>
                      🗑️ حذف
                    </button>
                  </div>
                ) : (
                  <div className="file-upload" onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer' }}>
                    {uploading ? (
                      <div className="loading-spinner" style={{ margin: '0 auto' }} />
                    ) : (
                      <>
                        <div className="file-upload__icon">📁</div>
                        <div className="file-upload__text">اضغط لرفع صورة</div>
                        <div className="file-upload__hint">JPG, PNG, WebP — حد أقصى 10MB</div>
                      </>
                    )}
                  </div>
                )}
                <div style={{ marginTop: '8px' }}>
                  <span className="form-hint">أو أدخل رابط الصورة مباشرة:</span>
                  <input className="form-input" placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} dir="ltr" style={{ marginTop: '4px' }} />
                </div>
              </div>
            )}

            <div className="flex-gap">
              <button type="submit" className="btn btn--primary">{editingId ? 'حفظ التعديلات' : 'إضافة'}</button>
              <button type="button" className="btn btn--secondary" onClick={resetForm}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Content List */}
      {filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state__icon">🎨</div>
          <div className="empty-state__title">لا يوجد محتوى</div>
          <div className="empty-state__desc">أضف محتوى ليظهر في الصفحة الرئيسية</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((item) => (
            <div key={item.id} className="card card--hover animate-slide-up">
              <div className="card__header">
                <div className="flex-gap" style={{ flex: 1 }}>
                  {item.image_url && (
                    <img src={item.image_url} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div className="flex-gap" style={{ marginBottom: '4px' }}>
                      <span className="badge badge--role">{TYPE_LABELS[item.type]}</span>
                      <span className={`badge ${item.is_published ? 'badge--approved' : 'badge--rejected'}`}>
                        {item.is_published ? 'منشور' : 'مخفي'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>ترتيب: {item.sort_order}</span>
                    </div>
                    {item.type === 'stat' ? (
                      <div style={{ fontWeight: 600 }}>{item.stat_value} — {item.stat_label}</div>
                    ) : (
                      <div style={{ fontWeight: 600 }}>{item.title || 'بدون عنوان'}</div>
                    )}
                    {item.description && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {item.description.substring(0, 80)}{item.description.length > 80 ? '...' : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-gap">
                  <button className="btn btn--secondary btn--sm" onClick={() => handleTogglePublish(item)}>
                    {item.is_published ? '👁️ إخفاء' : '👁️ نشر'}
                  </button>
                  <button className="btn btn--secondary btn--sm" onClick={() => handleEdit(item)}>✏️ تعديل</button>
                  <button className="btn btn--danger btn--sm" onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
