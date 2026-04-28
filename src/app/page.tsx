import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getPublishedContent, type SiteContent } from '@/actions/content';
import { LandingClient } from '@/components/landing/LandingClient';

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard');

  const contentRes = await getPublishedContent();
  const content = contentRes.data || [];

  const heroImages = content.filter((c) => c.type === 'hero_image');
  const stats = content.filter((c) => c.type === 'stat');
  const news = content.filter((c) => c.type === 'news');
  const achievements = content.filter((c) => c.type === 'achievement');
  const gallery = content.filter((c) => c.type === 'gallery_image');

  return (
    <div className="landing">
      {/* === HERO === */}
      <section className="landing-hero">
        {heroImages.length > 0 && (
          <div className="landing-hero__bg">
            <LandingClient heroImages={heroImages} />
          </div>
        )}
        <div className="landing-hero__content animate-slide-up">
          <div className="landing-hero__badge">🎓 ثانوية طرفة بنت عبدالعزيز</div>
          <h1 className="landing-hero__title">
            منصة <span>العمل التطوعي</span>
          </h1>
          <p className="landing-hero__desc">
            منصة لحصر ساعات التطوع لدى الطالبات وتقديم الفرص التطوعية. تقدّمي لفرص التطوع، تتبعي ساعاتك، واحصلي على شهاداتك الموثقة — كل ذلك في مكان واحد.
          </p>
          <div className="landing-hero__actions">
            <Link href="/sign-in" className="btn btn--primary btn--lg" id="hero-signin">
              🔑 تسجيل الدخول
            </Link>
            <Link href="/sign-up" className="btn btn--secondary btn--lg" id="hero-signup">
              ✨ إنشاء حساب جديد
            </Link>
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
          <h2 className="landing-section__title">📰 أخبار المدرسة</h2>
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
          <h2 className="landing-section__title">🏆 إنجازاتنا</h2>
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
          <h2 className="landing-section__title">📸 معرض الصور</h2>
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
        <h2 className="landing-section__title">✨ مميزات المنصة</h2>
        <div className="landing-features__grid stagger-children">
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon">🔍</div>
            <h3 className="landing-feature__title">استكشف الفرص</h3>
            <p className="landing-feature__desc">تصفح مجموعة متنوعة من فرص التطوع المتاحة وقدّم طلبك بسهولة</p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon">📊</div>
            <h3 className="landing-feature__title">تتبع تقدمك</h3>
            <p className="landing-feature__desc">راقب ساعات التطوع المكتملة وتقدمك عبر لوحة معلومات تفاعلية</p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon">🏆</div>
            <h3 className="landing-feature__title">شهادات موثقة</h3>
            <p className="landing-feature__desc">ارفع شهاداتك واحصل على التوثيق الرسمي من منسقي التطوع</p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon">🔔</div>
            <h3 className="landing-feature__title">إشعارات فورية</h3>
            <p className="landing-feature__desc">تابع حالة طلباتك وشهاداتك من خلال نظام إشعارات ذكي</p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon">🔒</div>
            <h3 className="landing-feature__title">أمان متقدم</h3>
            <p className="landing-feature__desc">بياناتك محمية بأعلى معايير التشفير والخصوصية</p>
          </div>
          <div className="landing-feature hover-lift animate-slide-up">
            <div className="landing-feature__icon">📱</div>
            <h3 className="landing-feature__title">متجاوب بالكامل</h3>
            <p className="landing-feature__desc">تجربة سلسة على جميع الأجهزة: الجوال، الآيباد، واللابتوب</p>
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="landing-cta">
        <div className="landing-cta__content animate-slide-up">
          <h2 className="landing-cta__title">ابدأ رحلة التطوع الآن</h2>
          <p className="landing-cta__desc">سجّل دخولك وانضم لمئات الطلاب في برنامج التطوع</p>
          <div className="landing-hero__actions">
            <Link href="/sign-in" className="btn btn--primary btn--lg">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} منصة التطوع الطلابي — جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}
