'use client';
import { detectAuthMode } from '@/lib/auth-mode';

export function DemoBanner(): JSX.Element | null {
  const mode = typeof window === 'undefined' ? null : detectAuthMode();
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
      <strong>Demo Mode</strong> — UI/UX preview. No real authentication.{' '}
      <a
        href="https://github.com/ogus002/firebase-totp-mfa-kit#real-mode"
        style={{ color: '#92400e', textDecoration: 'underline' }}
      >
        Connect Firebase in 5 min →
      </a>
    </div>
  );
}
