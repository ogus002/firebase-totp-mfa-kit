'use client';
import { detectAuthMode } from '@/lib/auth-mode';
import { useT } from '@/lib/i18n';

export function DemoBanner(): JSX.Element | null {
  // detectAuthMode() reads NEXT_PUBLIC_* env vars — inlined at build time, identical on server and client.
  // No window check; that previously created a hydration mismatch (server null vs client rendered banner).
  const mode = detectAuthMode();
  const t = useT();
  if (mode !== 'demo') return null;
  return (
    <div
      role="status"
      style={{
        background: '#fef3c7',
        color: '#92400e',
        padding: '0.625rem 1rem',
        textAlign: 'center',
        fontSize: '0.9rem',
        borderBottom: '1px solid #fde68a',
      }}
    >
      <strong>{t.demoBanner.label}</strong>
      {t.demoBanner.note}
      <a
        href="https://github.com/ogus002/firebase-totp-mfa-kit#real-mode"
        style={{ color: '#92400e', textDecoration: 'underline' }}
      >
        {t.demoBanner.cta}
      </a>
    </div>
  );
}
