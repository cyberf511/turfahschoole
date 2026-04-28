import React from 'react';
import type { StatsCardData } from '@/types';

interface StatsCardsProps {
  stats: StatsCardData[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats || stats.length === 0) return null;

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
      gap: '16px', 
      marginBottom: '32px' 
    }}>
      {stats.map((stat, i) => (
        <div key={i} className="card animate-scale-in" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          padding: '20px',
          animationDelay: `${i * 100}ms`
        }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: stat.color ? `${stat.color}15` : 'var(--accent-primary-soft)', 
            color: stat.color || 'var(--accent-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}>
            {stat.icon}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {stat.value}
            </div>
          </div>
          {stat.trend && (
            <div style={{ 
              marginLeft: 'auto', 
              fontSize: '0.85rem', 
              fontWeight: 600,
              color: stat.trend === 'up' ? 'var(--success)' : stat.trend === 'down' ? 'var(--danger)' : 'var(--text-tertiary)' 
            }}>
              {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '−'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
