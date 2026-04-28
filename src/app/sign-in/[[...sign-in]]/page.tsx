import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <div className="auth-card__logo">ثانوية طرفة بنت عبدالعزيز</div>
          <p className="auth-card__subtitle">سجّل دخولك للمتابعة</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: { width: '100%' },
              card: {
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
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
              formFieldInput: {
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
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
