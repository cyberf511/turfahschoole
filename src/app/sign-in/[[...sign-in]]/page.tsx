'use client';

import { SignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from '@/components/ThemeProvider';

export default function SignInPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <div className="auth-card__logo">ثانوية طرفة بنت عبدالعزيز</div>
          <p className="auth-card__subtitle">سجّل دخولك للمتابعة</p>
        </div>
        <SignIn
          appearance={{
            baseTheme: isDark ? dark : undefined,
            variables: {
              colorBackground: isDark ? '#0f1629' : '#ffffff',
              colorInputBackground: isDark ? '#1a2340' : '#f1f5f9',
              colorText: isDark ? '#f1f5f9' : '#0f172a',
              colorTextSecondary: isDark ? '#94a3b8' : '#475569',
              colorPrimary: '#059669',
              colorInputText: isDark ? '#f1f5f9' : '#0f172a',
            },
            elements: {
              rootBox: { width: '100%' },
              card: {
                border: `1px solid ${isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.08)'}`,
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
              },
              headerTitle: { color: 'var(--text-primary)' },
              headerSubtitle: { color: 'var(--text-secondary)' },
              socialButtonsBlockButton: {
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
              },
              socialButtonsBlockButtonText: { color: 'var(--text-primary)' },
              formFieldLabel: { color: 'var(--text-primary)' },
              formFieldInput: {
                borderRadius: 'var(--radius-md)',
              },
              formButtonPrimary: {
                background: 'var(--accent-primary)',
                borderRadius: 'var(--radius-md)',
              },
              footerActionLink: { color: 'var(--accent-primary)' },
              dividerLine: { background: 'var(--border)' },
              dividerText: { color: 'var(--text-tertiary)' },
            },
          }}
        />
      </div>
    </div>
  );
}
