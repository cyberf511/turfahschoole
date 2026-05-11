'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import { completeProfile } from '@/actions/profile';
import { createAuthedSupabase } from '@/lib/supabase/client';
import type { EducationLevel } from '@/types';
import { EDUCATION_LABELS } from '@/types';

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    education_level: '' as EducationLevel | '',
    phone: '',
  });

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.push('/sign-in'); return; }
    (async () => {
      const token = await getToken({ template: 'supabase' });
      if (!token) { setChecking(false); return; }
      const authedSupabase = createAuthedSupabase(token);
      const { data: profile } = await authedSupabase
        .from('profiles')
        .select('role, profile_completed')
        .single();
      if (profile?.profile_completed) {
        const role = profile.role;
        router.push(role === 'coordinator' ? '/dashboard/coordinator' : role === 'super_admin' ? '/dashboard/admin' : '/dashboard/student');
      } else {
        setChecking(false);
      }
    })();
  }, [isLoaded, isSignedIn, getToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name || !formData.national_id || !formData.education_level || !formData.phone) {
      setError('جميع الحقول مطلوبة');
      return;
    }

    if (formData.national_id.length < 10) {
      setError('رقم الهوية يجب أن يكون 10 أرقام على الأقل');
      return;
    }

    setLoading(true);
    const result = await completeProfile({
      full_name: formData.full_name,
      national_id: formData.national_id,
      education_level: formData.education_level as EducationLevel,
      phone: formData.phone,
    });

    if (result.success) {
      router.push('/dashboard/student');
    } else {
      setError(result.error || 'حدث خطأ');
      setLoading(false);
    }
  };

  const filledSteps = [
    !!formData.full_name,
    !!formData.national_id,
    !!formData.education_level,
    !!formData.phone,
  ];
  const filledCount = filledSteps.filter(Boolean).length;

  if (checking) return <div className="onboarding-page"><div className="onboarding-card card card--glass animate-scale-in" style={{ textAlign: 'center', padding: '60px 24px' }}>جاري التحقق من البيانات...</div></div>;

  return (
    <div className="onboarding-page">
      <div className="onboarding-card card card--glass animate-scale-in">
        <div className="auth-card__header" style={{ marginBottom: '8px' }}>
          <div className="auth-card__logo">إكمال الملف الشخصي</div>
          <p className="auth-card__subtitle">أكمل بياناتك للبدء في استخدام المنصة</p>
        </div>

        <div className="onboarding-card__steps">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`onboarding-card__step ${i < filledCount ? 'onboarding-card__step--active' : ''}`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label className="form-label">الاسم الكامل</label>
            <input
              type="text"
              className="form-input"
              placeholder="أدخل اسمك الكامل"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">رقم الهوية الوطنية</label>
            <input
              type="text"
              className="form-input"
              placeholder="أدخل رقم الهوية الوطنية"
              value={formData.national_id}
              onChange={(e) => setFormData({ ...formData, national_id: e.target.value.replace(/\D/g, '') })}
              maxLength={10}
              dir="ltr"
              style={{ textAlign: 'right' }}
            />
            <span className="form-hint">🔒 رقم الهوية مشفر بالكامل ولا يظهر إلا آخر 3 أرقام</span>
          </div>

          <div className="form-group">
            <label className="form-label">المستوى التعليمي</label>
            <select
              className="form-input"
              value={formData.education_level}
              onChange={(e) => setFormData({ ...formData, education_level: e.target.value as EducationLevel })}
            >
              <option value="">اختر المستوى التعليمي</option>
              {Object.entries(EDUCATION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">رقم الهاتف</label>
            <input
              type="tel"
              className="form-input"
              placeholder="05XXXXXXXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
              maxLength={10}
              dir="ltr"
              style={{ textAlign: 'right' }}
            />
            <span className="form-hint">🔒 يتم تشفير رقم الهاتف بالكامل ولا يظهر إلا آخر 4 أرقام</span>
          </div>

          {error && <div className="form-error" style={{ padding: '10px', background: 'var(--danger-soft)', borderRadius: 'var(--radius-md)' }}>{error}</div>}

          <button type="submit" className="btn btn--primary btn--lg btn--full" disabled={loading}>
            {loading ? <span className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : 'حفظ والمتابعة'}
          </button>
        </form>
      </div>
    </div>
  );
}
