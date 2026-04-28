'use client';

const Icons = {
  graduationCap: () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
};

interface LoadingProps {
  text?: string;
  fullHeight?: boolean;
}

export function Loading({ text = "جاري تحميل البيانات...", fullHeight = true }: LoadingProps) {
  return (
    <div className="premium-loader" style={fullHeight ? {} : { minHeight: 'auto', padding: '40px 0' }}>
      <div className="premium-loader__inner">
        <div className="premium-loader__ring-arc"></div>
        <div className="premium-loader__ring-arc premium-loader__ring-arc--2"></div>
        <div className="premium-loader__logo">
          <Icons.graduationCap />
        </div>
      </div>
      {text && <div className="premium-loader__text">{text}</div>}
      <div className="premium-loader__bar">
        <div className="premium-loader__bar-fill"></div>
      </div>
    </div>
  );
}
