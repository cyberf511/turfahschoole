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

const statusConfig = {
  uploading: { icon: '⬆️', label: 'جاري الرفع', color: 'var(--accent-primary)' },
  deleting: { icon: '🗑️', label: 'جاري الحذف', color: 'var(--error)' },
  processing: { icon: '⚙️', label: 'جاري المعالجة', color: 'var(--accent-primary)' },
  success: { icon: '✅', label: 'تم بنجاح', color: 'var(--success)' },
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
  const barColor = color || config.color;
  const displayLabel = label || config.label;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {config.icon} {displayLabel}
        </span>
        {showPercentage && (
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: barColor, fontFamily: 'monospace' }}>
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
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${displayProgress}%`,
            background: `linear-gradient(90deg, ${barColor}, ${barColor}dd)`,
            borderRadius: '9999px',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {animated && displayProgress < 100 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(
                  90deg,
                  transparent,
                  rgba(255,255,255,0.15),
                  transparent
                )`,
                animation: 'shimmer 1.5s infinite',
              }}
            />
          )}
          {displayProgress >= 100 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(
                  90deg,
                  transparent,
                  rgba(255,255,255,0.1),
                  transparent
                )`,
                animation: 'shimmer 1s infinite',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
