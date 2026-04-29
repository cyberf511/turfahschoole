'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error('Dashboard Caught Error:', error);
  }, [error]);

  return (
    <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px' }}>
      <div className="card animate-scale-in" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          background: 'var(--danger-soft)', 
          color: 'var(--danger)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 24px' 
        }}>
          <AlertCircle size={32} />
        </div>
        
        <h2 className="section-title" style={{ color: 'var(--danger)', marginBottom: '12px' }}>عذراً، حدث خطأ غير متوقع</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
          لقد واجهنا مشكلة أثناء تحميل هذه الصفحة. قد يكون ذلك بسبب تحديثات في النظام أو انقطاع في الاتصال.
        </p>

        {/* Error Details for Debugging */}
        <div style={{ 
          background: 'var(--bg-secondary)', 
          padding: '16px', 
          borderRadius: 'var(--radius-sm)', 
          border: '1px solid var(--border)',
          marginBottom: '32px',
          textAlign: 'left',
          direction: 'ltr',
          fontSize: '0.85rem',
          color: 'var(--text-tertiary)',
          overflowX: 'auto'
        }}>
          <code>{error.message || 'Unknown Runtime Error'}</code>
        </div>

        <div className="flex-center" style={{ gap: '16px' }}>
          <button 
            className="btn btn--primary" 
            onClick={() => reset()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCcw size={18} /> حاول مرة أخرى
          </button>
          
          <Link href="/" className="btn btn--secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Home size={18} /> العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
