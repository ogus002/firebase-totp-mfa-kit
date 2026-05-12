'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { detectAuthMode } from '@/lib/auth-mode';
import { useT } from '@/lib/i18n';
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  verifyDemoCode,
} from '@/lib/demo-totp';

export default function LoginPage() {
  const router = useRouter();
  const mode = detectAuthMode();
  const t = useT();
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
      const enrolled = sessionStorage.getItem('demo:enrolled') === 'true';
      if (enrolled) {
        setStage('mfa');
      } else {
        router.push('/mfa-enroll');
      }
      setBusy(false);
      return;
    }
    setError(t.login.realModeStub);
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
        setError(t.login.wrongCode);
      }
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  return (
    <main className="page">
      <h1>{t.login.title}</h1>
      {stage === 'creds' && (
        <form onSubmit={handleCreds} className="card">
          <label className="label" htmlFor="email">{t.login.email}</label>
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
          <label className="label" htmlFor="password">{t.login.password}</label>
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
              {t.login.demoLockNote}
            </p>
          )}
          <button type="submit" className="btn" disabled={busy} style={{ marginTop: '1rem' }}>
            {busy ? t.login.signingIn : t.login.continue}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
      {stage === 'mfa' && (
        <form onSubmit={handleMfa} className="card">
          <h2 style={{ marginTop: 0 }}>{t.login.mfaTitle}</h2>
          <p className="muted">{t.login.mfaPrompt}</p>
          <label className="label" htmlFor="code">{t.login.authenticatorCode}</label>
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
            {busy ? t.login.verifying : t.login.verify}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </main>
  );
}
