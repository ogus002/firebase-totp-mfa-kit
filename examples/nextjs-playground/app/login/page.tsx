'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { detectAuthMode } from '@/lib/auth-mode';
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  verifyDemoCode,
} from '@/lib/demo-totp';

export default function LoginPage() {
  const router = useRouter();
  const mode = detectAuthMode();
  const [stage, setStage] = useState<'creds' | 'mfa'>('creds');
  const [email, setEmail] = useState(mode === 'demo' ? DEMO_EMAIL : '');
  const [password, setPassword] = useState(mode === 'demo' ? DEMO_PASSWORD : '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    if (mode === 'demo') {
      // 항상 MFA stage 로 전진 (demo 사용자는 enroll 된 것으로 가정)
      // 만약 아직 enroll 안 했으면 /mfa-enroll 로 이동
      const enrolled = sessionStorage.getItem('demo:enrolled') === 'true';
      if (enrolled) {
        setStage('mfa');
      } else {
        router.push('/mfa-enroll');
      }
      setBusy(false);
      return;
    }
    // Real mode — registry useMfaSignIn 패턴 (Task 8 dogfood 검증)
    setError('Real mode: fill .env.local with Firebase config to enable.');
    setBusy(false);
  };

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    if (mode === 'demo') {
      if (verifyDemoCode(code)) {
        sessionStorage.setItem('demo:signed-in', 'true');
        router.push('/dashboard');
      } else {
        setError('Wrong code. Check your authenticator app and try again.');
      }
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  return (
    <main className="page">
      <h1>Sign in</h1>
      {stage === 'creds' && (
        <form onSubmit={handleCreds} className="card">
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={mode === 'demo'}
            autoComplete="email"
            required
          />
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            readOnly={mode === 'demo'}
            autoComplete="current-password"
            required
          />
          {mode === 'demo' && (
            <p className="muted" style={{ marginTop: '0.5rem' }}>
              Demo credentials are pre-filled and locked. Real input disabled to prevent leaks.
            </p>
          )}
          <button type="submit" className="btn" disabled={busy} style={{ marginTop: '1rem' }}>
            {busy ? 'Signing in…' : 'Continue'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
      {stage === 'mfa' && (
        <form onSubmit={handleMfa} className="card">
          <h2 style={{ marginTop: 0 }}>Two-factor authentication</h2>
          <p className="muted">Enter the 6-digit code from your authenticator app.</p>
          <label className="label" htmlFor="code">Authenticator code</label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            autoFocus
          />
          <button type="submit" className="btn" disabled={busy || code.length !== 6} style={{ marginTop: '1rem' }}>
            {busy ? 'Verifying…' : 'Verify'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </main>
  );
}
