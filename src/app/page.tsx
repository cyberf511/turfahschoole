import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getPublishedContent, type SiteContent } from '@/actions/content';
import { LandingClient } from '@/components/landing/LandingClient';
import { LandingNav } from '@/components/landing/LandingNav';

// SVG Library for Landing Page
const Icons = {
  graduationCap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginInlineEnd: '8px' }}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
  login: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginInlineEnd: '8px' }}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>,
  sparkles: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginInlineEnd: '8px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  news: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginInlineEnd: '12px', color: 'var(--accent-primary)' }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
  trophy: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginInlineEnd: '12px', color: 'var(--accent-primary)' }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>,
  gallery: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginInlineEnd: '12px', color: 'var(--accent-primary)' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
  features: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginInlineEnd: '12px', color: 'var(--accent-primary)' }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
  search: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  chart: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  cert: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>,
  bell: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
  shield: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  device: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
};

export default async function LandingPage() {
  const { userId } = await auth();

  const contentRes = await getPublishedContent();
  const content = contentRes.data || [];

  const heroImages = content.filter((c) => c.type === 'hero_image');
  const stats = content.filter((c) => c.type === 'stat');
  const news = content.filter((c) => c.type === 'news');
  const achievements = content.filter((c) => c.type === 'achievement');
  const gallery = content.filter((c) => c.type === 'gallery_image');

  return (
    <div className="landing">
      <LandingNav />
      {/* === HERO === */}
      <section className="landing-hero">
        {heroImages.length > 0 && (
          <div className="landing-hero__bg">
            <LandingClient heroImages={heroImages} />
          </div>
        )}
        <div className="landing-hero__content animate-slide-up">
          <div className="landing-hero__badge"><Icons.graduationCap /> ثانوية طرفة بنت عبدالعزيز</div>
          <h1 className="landing-hero__title">
            منصة <span>العمل التطوعي</span>
          </h1>
          <p className="landing-hero__desc">
            منصة لحصر ساعات التطوع لدى الطالبات وتقديم الفرص التطوعية. تقدّمي لفرص التطوع، تتبعي ساعاتك، واحصلي على شهاداتك الموثقة — كل ذلك في مكان واحد.
          </p>
          <div className="landing-hero__actions">
            {userId ? (
              <Link href="/dashboard" className="btn btn--primary btn--lg" id="hero-signin">
                <Icons.login /> العودة للوحة التحكم
              </Link>
            ) : (
              <Link href="/sign-in" className="btn btn--primary btn--lg" id="hero-signin">
                <Icons.login /> تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* === STATS === */}
      {stats.length > 0 && (
        <section className="landing-stats">
          <div className="landing-stats__grid stagger-children">
            {stats.map((stat) => (
              <div key={stat.id} className="landing-stat animate-slide-up">
                <div className="landing-stat__value">{stat.stat_value}</div>
                <div className="landing-stat__label">{stat.stat_label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === NEWS === */}
      {news.length > 0 && (
        <section className="landing-section">
          <h2 className="landing-section__title"><Icons.news /> أخبار المدرسة</h2>
          <div className="landing-news__grid stagger-children">
            {news.map((item) => (
              <article key={item.id} className="landing-news-card hover-lift animate-slide-up">
                {item.image_url && (
                  <div className="landing-news-card__img">
                    <img src={item.image_url} alt={item.title || ''} />
                  </div>
                )}
                <div className="landing-news-card__body">
                  <h3 className="landing-news-card__title">{item.title}</h3>
                  <p className="landing-news-card__desc">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* === ACHIEVEMENTS === */}
      {achievements.length > 0 && (
        <section className="landing-section landing-section--alt">
          <h2 className="landing-section__title"><Icons.trophy /> إنجازاتنا</h2>
          <div className="landing-achievements__grid stagger-children">
            {achievements.map((item) => (
              <div key={item.id} className="landing-achievement hover-lift animate-slide-up">
                {item.image_url && (
                  <div className="landing-achievement__img">
                    <img src={item.image_url} alt={item.title || ''} />
                  </div>
                )}
                <h3 className="landing-achievement__title">{item.title}</h3>
                <p className="landing-achievement__desc">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === GALLERY === */}
      {gallery.length > 0 && (
        <section className="landing-section">
          <h2 className="landing-section__title"><Icons.gallery /> معرض الصور</h2>
          <div className="landing-gallery stagger-children">
            {gallery.map((img) => (
              <div key={img.id} className="landing-gallery__item hover-lift animate-slide-up">
                <img src={img.image_url || ''} alt={img.title || 'صورة'} />
                {img.title && <div className="landing-gallery__caption">{img.title}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === FEATURES === */}
      <section className="landing-section landing-section--alt">
        <h2 className="landing-section__title"><Icons.features /> مميزات المنصة</h2>
        <div className="landing-features__grid stagger-children">
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon"><Icons.search /></div>
            <h3 className="landing-feature__title">استكشف الفرص</h3>
            <p className="landing-feature__desc">تصفح مجموعة متنوعة من فرص التطوع المتاحة وقدّم طلبك بسهولة</p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon"><Icons.chart /></div>
            <h3 className="landing-feature__title">تتبع تقدمك</h3>
            <p className="landing-feature__desc">راقب ساعات التطوع المكتملة وتقدمك عبر لوحة معلومات تفاعلية</p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon"><Icons.cert /></div>
            <h3 className="landing-feature__title">شهادات موثقة</h3>
            <p className="landing-feature__desc">ارفع شهاداتك واحصل على التوثيق الرسمي من منسقي التطوع</p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon"><Icons.bell /></div>
            <h3 className="landing-feature__title">إشعارات فورية</h3>
            <p className="landing-feature__desc">تابع حالة طلباتك وشهاداتك من خلال نظام إشعارات ذكي</p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon"><Icons.shield /></div>
            <h3 className="landing-feature__title">أمان متقدم</h3>
            <p className="landing-feature__desc">بياناتك محمية بأعلى معايير التشفير والخصوصية</p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon"><Icons.device /></div>
            <h3 className="landing-feature__title">متجاوب بالكامل</h3>
            <p className="landing-feature__desc">تجربة سلسة على جميع الأجهزة: الجوال، الآيباد، واللابتوب</p>
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="landing-cta">
        <div className="landing-cta__content animate-slide-up">
          <h2 className="landing-cta__title">ابدأ رحلة التطوع الآن</h2>
          <p className="landing-cta__desc">سجّل دخولك وانضم لمئات الطالبات في برنامج التطوع</p>
          <div className="landing-hero__actions">
            {userId ? (
              <Link href="/dashboard" className="btn btn--primary btn--lg">
                العودة للوحة التحكم
              </Link>
            ) : (
              <Link href="/sign-in" className="btn btn--primary btn--lg">
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} ثانوية طرفة بنت عبدالعزيز — منصة العمل التطوعي</p>
      </footer>
    </div>
  );
}
