import React from 'react';

export interface StatsCardData {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface StatsCardsProps {
  stats: StatsCardData[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats || stats.length === 0) return null;

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
      gap: '24px', 
      marginBottom: '32px' 
    }}>
      {stats.map((stat, i) => (
        <div key={i} className="card card--hover animate-scale-in" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px', 
          padding: '24px',
          background: 'var(--bg-glass)',
          backdropFilter: 'var(--blur)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
          animationDelay: `${i * 100}ms`
        }}>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '16px', 
            background: stat.color ? `${stat.color}15` : 'var(--accent-primary-soft)', 
            color: stat.color || 'var(--accent-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.75rem',
            boxShadow: stat.color ? `0 8px 16px ${stat.color}20` : '0 8px 16px var(--accent-primary-soft)',
            border: `1px solid ${stat.color ? `${stat.color}30` : 'var(--accent-primary-soft)'}`,
            flexShrink: 0
          }}>
            {stat.icon}
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.2px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.5px' }}>
              {stat.value}
            </div>
          </div>
          {stat.trend && (
            <div style={{ 
              marginLeft: 'auto', 
              fontSize: '0.75rem', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '20px',
              background: stat.trend === 'up' ? 'rgba(34, 197, 94, 0.1)' : stat.trend === 'down' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)',
              color: stat.trend === 'up' ? '#16a34a' : stat.trend === 'down' ? '#dc2626' : '#6b7280' 
            }}>
              {stat.trend === 'up' ? '↗' : stat.trend === 'down' ? '↘' : '→'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
