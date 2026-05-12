'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { detectAuthMode, ISSUER } from '@/lib/auth-mode';
import {
  DEMO_EMAIL,
  DEMO_SECRET,
  generateDemoOtpauthUrl,
  verifyDemoCode,
} from '@/lib/demo-totp';

export default function MfaEnrollPage() {
  const router = useRouter();
  const mode = detectAuthMode();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (mode === 'demo') {
        const otpauthUrl = generateDemoOtpauthUrl(DEMO_EMAIL, ISSUER);
        const qr = await QRCode.toDataURL(otpauthUrl, { width: 240, margin: 1 });
        if (!cancelled) setQrUrl(qr);
        return;
      }
      setError('Real mode: implement TotpEnroll from registry (see Task 8 dogfood).');
    })();
    return () => { cancelled = true; };
  }, [mode]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    if (mode === 'demo') {
      if (verifyDemoCode(code)) {
        sessionStorage.setItem('demo:enrolled', 'true');
        sessionStorage.setItem('demo:signed-in', 'true');
        setDone(true);
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setError('Wrong code. Check your authenticator app and try again.');
      }
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  if (done) {
    return (
      <main className="page">
        <div className="card">
          <h1>✓ Two-factor authentication enabled</h1>
          <p className="muted">Redirecting…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>Set up two-factor authentication</h1>
      <div className="card">
        <p className="muted">
          Scan the QR code with Google Authenticator, 1Password, Authy, or any TOTP app.
        </p>
        {qrUrl && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <img src={qrUrl} alt="TOTP QR code" width={240} height={240} />
          </div>
        )}
        <details>
          <summary>Manual setup key</summary>
          <p className="muted">Use this if your authenticator app can&apos;t scan the QR code.</p>
          <code style={{ display: 'inline-block', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.04)', borderRadius: 4, userSelect: 'all' }}>
            {DEMO_SECRET}
          </code>
        </details>
        <form onSubmit={handleVerify} style={{ marginTop: '1rem' }}>
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
            {busy ? 'Verifying…' : 'Verify & Enable'}
          </button>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
      </div>
    </main>
  );
}
