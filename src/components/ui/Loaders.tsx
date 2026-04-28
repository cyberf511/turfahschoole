'use client';

export function PageLoader() {
  return (
    <div className="premium-loader">
      <div className="premium-loader__inner">
        <div className="premium-loader__ring">
          <div className="premium-loader__ring-arc" />
          <div className="premium-loader__ring-arc premium-loader__ring-arc--2" />
        </div>
        <div className="premium-loader__logo">🎓</div>
      </div>
      <div className="premium-loader__text">جاري التحميل...</div>
      <div className="premium-loader__bar">
        <div className="premium-loader__bar-fill" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="skeleton-dashboard animate-fade-in">
      {/* Stats row */}
      <div className="skeleton-stats">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton-stat-card">
            <div className="skeleton skeleton-circle" />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text skeleton-text--sm" />
              <div className="skeleton skeleton-text skeleton-text--lg" />
            </div>
          </div>
        ))}
      </div>
      {/* Progress */}
      <div className="skeleton-card skeleton-card--wide">
        <div className="skeleton skeleton-text skeleton-text--sm" style={{ width: '30%' }} />
        <div className="skeleton skeleton-text skeleton-text--xl" style={{ width: '20%', margin: '16px auto' }} />
        <div className="skeleton skeleton-bar" />
      </div>
      {/* Activity */}
      <div className="skeleton-card">
        <div className="skeleton skeleton-text skeleton-text--sm" style={{ width: '40%', marginBottom: '20px' }} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton-activity-row">
            <div className="skeleton skeleton-dot" />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text skeleton-text--sm" style={{ width: '50%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
