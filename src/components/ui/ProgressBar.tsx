import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  height?: number;
  animated?: boolean;
  status?: 'uploading' | 'deleting' | 'processing' | 'success';
}

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const GearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const statusConfig = {
  uploading: { icon: UploadIcon, label: 'جاري الرفع', color: 'var(--accent-primary)' },
  deleting: { icon: TrashIcon, label: 'جاري الحذف', color: 'var(--error)' },
  processing: { icon: GearIcon, label: 'جاري المعالجة', color: 'var(--accent-primary)' },
  success: { icon: CheckCircleIcon, label: 'تم بنجاح', color: 'var(--success)' },
};

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
  color,
  height = 8,
  animated = true,
  status = 'processing',
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayProgress(progress), 50);
    return () => clearTimeout(timer);
  }, [progress]);

  const config = statusConfig[status];
  const Icon = config.icon;
  const barColor = color || config.color;
  const displayLabel = label || config.label;
  const isComplete = displayProgress >= 100;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: barColor, display: 'flex', opacity: isComplete ? 1 : 0.8 }}>
            {status === 'uploading' && <UploadIcon />}
            {status === 'deleting' && <TrashIcon />}
            {status === 'processing' && <GearIcon />}
            {status === 'success' && <CheckCircleIcon />}
          </span>
          {displayLabel}
        </span>
        {showPercentage && (
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: barColor,
            fontFamily: 'monospace',
            background: `color-mix(in srgb, ${barColor} 10%, transparent)`,
            padding: '2px 8px',
            borderRadius: '9999px',
            transition: 'all 0.3s ease',
          }}>
            {Math.round(displayProgress)}%
          </span>
        )}
      </div>
      <div
        style={{
          width: '100%',
          background: 'var(--bg-tertiary)',
          borderRadius: '9999px',
          overflow: 'hidden',
          height: `${height}px`,
          position: 'relative',
          boxShadow: isComplete ? `inset 0 1px 2px rgba(0,0,0,0.05)` : 'none',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${displayProgress}%`,
            background: isComplete
              ? `linear-gradient(90deg, ${barColor}, ${barColor}ee)`
              : `linear-gradient(90deg, ${barColor}cc, ${barColor}, ${barColor}ee)`,
            borderRadius: '9999px',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: isComplete ? `0 0 6px ${barColor}66` : 'none',
          }}
        >
          {animated && !isComplete && (
            <div
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          )}
          {isComplete && animated && (
            <div
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                animation: 'shimmer 1.8s infinite',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
