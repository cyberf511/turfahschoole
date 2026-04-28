import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  icon?: React.ReactNode;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  onConfirm, 
  confirmText = 'تأكيد', 
  cancelText = 'إلغاء',
  isDanger = false,
  icon
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="animate-fade-in" style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="card animate-scale-in" style={{ 
        maxWidth: '400px', 
        width: '100%', 
        padding: '32px', 
        textAlign: 'center', 
        border: '1px solid var(--border-color)', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)' 
      }}>
        {icon && (
          <div style={{ 
            width: '56px', height: '56px', borderRadius: '50%', 
            background: isDanger ? 'var(--danger-soft)' : 'var(--accent-primary-soft)', 
            color: isDanger ? 'var(--danger)' : 'var(--accent-primary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 20px' 
          }}>
            {icon}
          </div>
        )}
        <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'var(--text-primary)' }}>{title}</h3>
        {description && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            {description}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            className="btn btn--secondary" 
            onClick={onClose}
            style={{ flex: 1 }}
          >
            {cancelText}
          </button>
          <button 
            className={`btn ${isDanger ? '' : 'btn--primary'}`} 
            onClick={onConfirm}
            style={isDanger ? { flex: 1, background: 'var(--danger)', borderColor: 'var(--danger)', color: '#fff' } : { flex: 1 }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
