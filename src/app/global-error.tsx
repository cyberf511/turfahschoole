'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        background: '#060a14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Cairo, system-ui, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px 24px',
          maxWidth: '500px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.15)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '32px'
          }}>
            ⚠
          </div>
          <h2 style={{ color: '#ef4444', marginBottom: '12px', fontSize: '1.5rem', fontWeight: 700 }}>
            حدث خطأ في النظام
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '8px', lineHeight: 1.6 }}>
            عذراً، حدث خطأ غير متوقع. يرجى تحديث الصفحة أو المحاولة لاحقاً.
          </p>
          <code style={{
            display: 'block',
            background: 'rgba(255,255,255,0.05)',
            padding: '8px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '0.8rem',
            color: '#64748b',
            direction: 'ltr',
            textAlign: 'left'
          }}>
            {error.message || 'Unknown error'}
          </code>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            تحديث الصفحة
          </button>
        </div>
      </body>
    </html>
  );
}
