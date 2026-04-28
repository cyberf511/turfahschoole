import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard');

  return (
    <div className="landing">
      <div className="landing-hero">
        <div className="landing-hero__content animate-slide-up">
          <div className="landing-hero__badge">🎓 منصة التطوع الطلابي</div>
          <h1 className="landing-hero__title">
            ابدأ رحلتك في <span>العمل التطوعي</span>
          </h1>
          <p className="landing-hero__desc">
            منصة احترافية متكاملة لإدارة برامج التطوع الطلابي. تقدّم لفرص التطوع، تتبع ساعاتك، واحصل على شهاداتك الموثقة — كل ذلك في مكان واحد.
          </p>
          <div className="landing-hero__actions">
            <Link href="/sign-in" className="btn btn--primary btn--lg">
              تسجيل الدخول
            </Link>
            <Link href="/sign-up" className="btn btn--secondary btn--lg">
              إنشاء حساب جديد
            </Link>
          </div>
        </div>
      </div>

      <section className="landing-features animate-fade-in">
        <h2 className="landing-features__title">مميزات المنصة</h2>
        <div className="landing-features__grid stagger-children">
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon">🔍</div>
            <h3 className="landing-feature__title">استكشف الفرص</h3>
            <p className="landing-feature__desc">
              تصفح مجموعة متنوعة من فرص التطوع المتاحة وقدّم طلبك بسهولة
            </p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon">📊</div>
            <h3 className="landing-feature__title">تتبع تقدمك</h3>
            <p className="landing-feature__desc">
              راقب ساعات التطوع المكتملة وتقدمك عبر لوحة معلومات تفاعلية
            </p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon">🏆</div>
            <h3 className="landing-feature__title">شهادات موثقة</h3>
            <p className="landing-feature__desc">
              ارفع شهاداتك واحصل على التوثيق الرسمي من منسقي التطوع
            </p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon">🔔</div>
            <h3 className="landing-feature__title">إشعارات فورية</h3>
            <p className="landing-feature__desc">
              تابع حالة طلباتك وشهاداتك من خلال نظام إشعارات ذكي
            </p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon">🔒</div>
            <h3 className="landing-feature__title">أمان متقدم</h3>
            <p className="landing-feature__desc">
              بياناتك محمية بأعلى معايير التشفير والخصوصية
            </p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon">📱</div>
            <h3 className="landing-feature__title">متجاوب بالكامل</h3>
            <p className="landing-feature__desc">
              تجربة سلسة على جميع الأجهزة: الجوال، الآيباد، واللابتوب
            </p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} منصة التطوع الطلابي — جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}
