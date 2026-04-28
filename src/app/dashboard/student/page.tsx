'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getMyApplications, getStudentHours } from '@/actions/applications';
import type { Application, Opportunity } from '@/types';
import { APPLICATION_STATUS_LABELS, COMPLETION_STATUS_LABELS } from '@/types';
import Link from 'next/link';
import { PageLoader } from '@/components/ui/Loaders';

const Icons = {
  clock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  clipboard: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  check: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  x: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  barChart: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  search: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  target: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  mapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  clockSmall: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  clockMed: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  clipboardMed: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  checkMed: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  xMed: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
};

// For fetching available opportunities
async function getAvailableOpportunities() {
  const { getOpportunities } = await import('@/actions/opportunities');
  return getOpportunities(true);
}

export default function StudentDashboard() {
  const { user } = useUser();
  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyApplications(),
      getStudentHours(),
      getAvailableOpportunities(),
    ]).then(([appsRes, hoursRes, oppsRes]) => {
      if (appsRes.success) setApplications(appsRes.data || []);
      if (hoursRes.success) setTotalHours(hoursRes.data || 0);
      if (oppsRes.success) setOpportunities((oppsRes.data || []).slice(0, 3));
      setLoading(false);
    });
  }, []);

  if (loading) return <PageLoader />;

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = applications.filter((a) => a.status === 'approved').length;
  const verifiedCount = applications.filter((a) => a.completion_status === 'verified').length;
  const targetHours = 40;
  const progressPercent = Math.min(Math.round((totalHours / targetHours) * 100), 100);
  const firstName = user?.firstName || 'طالبة';

  // Activity items from applications
  const recentApps = applications.slice(0, 4);

  return (
    <div className="dash-page animate-fade-in">
      {/* Welcome */}
      <div className="dash-welcome">
        <h1 className="dash-welcome__name">مرحباً، {firstName} 👋</h1>
        <p className="dash-welcome__sub">هنا نظرة عامة على نشاطك التطوعي</p>
      </div>

      {/* Stats Row */}
      <div className="dash-stats stagger-children">
        <div className="dash-stat-card dash-stat-card--blue animate-slide-up">
          <div className="dash-stat-card__top">
            <div className="dash-stat-card__icon"><Icons.clock /></div>
            <span className="dash-stat-card__title">إجمالي الساعات</span>
          </div>
          <div className="dash-stat-card__value">{totalHours}</div>
          <div className="dash-stat-card__sub">من أصل الساعات المطلوبة</div>
          <div className="dash-stat-card__sparkline">
            <svg viewBox="0 0 100 24" preserveAspectRatio="none">
              <polyline points="0,20 15,16 30,18 45,10 60,14 75,6 100,8" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>
        <div className="dash-stat-card dash-stat-card--amber animate-slide-up">
          <div className="dash-stat-card__top">
            <div className="dash-stat-card__icon"><Icons.clipboard /></div>
            <span className="dash-stat-card__title">الطلبات قيد المعالجة</span>
          </div>
          <div className="dash-stat-card__value">{pendingCount}</div>
          <div className="dash-stat-card__sub">طلب قيد المراجعة</div>
          <div className="dash-stat-card__sparkline">
            <svg viewBox="0 0 100 24" preserveAspectRatio="none">
              <polyline points="0,18 20,14 40,20 60,8 80,12 100,6" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>
        <div className="dash-stat-card dash-stat-card--green animate-slide-up">
          <div className="dash-stat-card__top">
            <div className="dash-stat-card__icon"><Icons.check /></div>
            <span className="dash-stat-card__title">الشهادات المعتمدة</span>
          </div>
          <div className="dash-stat-card__value">{verifiedCount}</div>
          <div className="dash-stat-card__sub">شهادة معتمدة</div>
          <div className="dash-stat-card__sparkline">
            <svg viewBox="0 0 100 24" preserveAspectRatio="none">
              <polyline points="0,22 25,18 50,10 75,14 100,4" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>
        {/* Ring card */}
        <div className="dash-stat-card dash-stat-card--ring animate-slide-up">
          <div className="dash-stat-card__top">
            <div className="dash-stat-card__icon"><Icons.barChart /></div>
            <span className="dash-stat-card__title">تقدم الساعات</span>
          </div>
          <div className="dash-stat-card__ring-wrap">
            <svg viewBox="0 0 100 100" className="dash-ring-svg">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-tertiary)" strokeWidth="6" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#ringGrad)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${progressPercent * 2.639} 263.9`}
                transform="rotate(-90 50 50)"
                className="dash-ring-progress"
              />
              <defs>
                <linearGradient id="ringGrad">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="dash-stat-card__ring-text">
              <span className="dash-stat-card__ring-pct">{progressPercent}%</span>
            </div>
          </div>
          <div className="dash-stat-card__sub">{totalHours} من {targetHours} ساعة مطلوبة</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="dash-progress-card animate-slide-up">
        <div className="dash-progress-card__header">
          <span className="dash-progress-card__title">تقدم ساعات التطوع</span>
          <div className="dash-progress-card__target-inline">
            <span className="dash-progress-card__target-lbl">الهدف الكلي:</span>
            <span className="dash-progress-card__target-val">{targetHours} ساعة</span>
          </div>
        </div>
        <div className="dash-progress-bar-wrap">
          <div className="dash-progress-bar">
            <div className="dash-progress-bar__fill" style={{ width: `${progressPercent}%` }}>
              <span className="dash-progress-bar__tooltip">{totalHours} ساعة</span>
            </div>
          </div>
          <div className="dash-progress-bar__labels">
            <span>0</span>
            <span>{targetHours}</span>
          </div>
        </div>
        <p className="dash-progress-card__msg">أنتِ على الطريق الصحيح! استمري في عطائك</p>
      </div>

      {/* Two columns: Opportunities + Activities */}
      <div className="dash-two-cols">
        {/* Opportunities */}
        <div className="dash-card-wrap animate-slide-up">
          <div className="dash-card-wrap__header">
            <h2 className="dash-card-wrap__title">الفرص التطوعية المتاحة</h2>
            <Link href="/dashboard/student/opportunities" className="dash-card-wrap__link">عرض الكل</Link>
          </div>
          {opportunities.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon" style={{ color: 'var(--text-tertiary)' }}><Icons.search /></div>
              <div className="empty-state__title">لا توجد فرص حالياً</div>
              <div className="empty-state__desc">سيتم إضافة فرص جديدة قريباً</div>
            </div>
          ) : (
            <div className="dash-opps-grid">
              {opportunities.map((opp) => (
                <div key={opp.id} className="dash-opp-card hover-lift">
                  <div className="dash-opp-card__img">
                    <div className="dash-opp-card__img-placeholder" style={{ color: 'var(--accent-primary)' }}><Icons.target /></div>
                    <span className="dash-opp-card__category">تطوع</span>
                  </div>
                  <div className="dash-opp-card__body">
                    <h3 className="dash-opp-card__title">{opp.title}</h3>
                    <p className="dash-opp-card__desc">{opp.description}</p>
                    <div className="dash-opp-card__meta">
                      <span><Icons.clockSmall /> {opp.hours} ساعات</span>
                      <span><Icons.mapPin /> {opp.location || 'المدرسة'}</span>
                    </div>
                    <Link href="/dashboard/student/opportunities" className="btn btn--primary btn--sm btn--full">
                      تقديم الآن
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="dash-card-wrap animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="dash-card-wrap__header">
            <h2 className="dash-card-wrap__title">الأنشطة الأخيرة</h2>
            <Link href="/dashboard/student/applications" className="dash-card-wrap__link">عرض الكل</Link>
          </div>
          {recentApps.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 16px' }}>
              <div className="empty-state__icon" style={{ color: 'var(--text-tertiary)' }}><Icons.clipboard /></div>
              <div className="empty-state__title">لا توجد أنشطة</div>
            </div>
          ) : (
            <div className="dash-activity-list">
              {recentApps.map((app) => {
                const opp = (app.opportunity as unknown) as { title?: string; hours?: number } | undefined;
                let icon = <Icons.clipboardMed />;
                let colorClass = 'dash-activity--amber';
                if (app.completion_status === 'verified') { icon = <Icons.checkMed />; colorClass = 'dash-activity--green'; }
                else if (app.status === 'approved') { icon = <Icons.checkMed />; colorClass = 'dash-activity--green'; }
                else if (app.status === 'rejected') { icon = <Icons.xMed />; colorClass = 'dash-activity--red'; }

                const statusText = app.completion_status
                  ? COMPLETION_STATUS_LABELS[app.completion_status]
                  : APPLICATION_STATUS_LABELS[app.status];

                return (
                  <div key={app.id} className={`dash-activity-item ${colorClass}`}>
                    <div className="dash-activity-item__icon">{icon}</div>
                    <div className="dash-activity-item__content">
                      <div className="dash-activity-item__text">
                        {statusText} في فرصة <strong>{opp?.title || 'تطوعية'}</strong>
                      </div>
                      <div className="dash-activity-item__time">
                        {app.applied_at ? new Date(app.applied_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
