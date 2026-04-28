import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow animation to finish
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'error' ? 'var(--danger)' : type === 'info' ? 'var(--accent-primary)' : 'var(--success)';
  const icon = type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '✅';

  return (
    <div className={`animate-slide-up ${!isVisible ? 'animate-fade-out' : ''}`} style={{
      position: 'fixed',
      bottom: '32px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: bgColor,
      color: '#fff',
      padding: '14px 24px',
      borderRadius: '12px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      fontWeight: 600,
      fontSize: '0.95rem',
      backdropFilter: 'blur(10px)',
      transition: 'opacity 0.3s ease'
    }}>
      <span>{icon}</span>
      {message}
    </div>
  );
}
