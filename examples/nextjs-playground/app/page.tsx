import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="page">
      <h1>firebase-totp-mfa playground</h1>
      <p className="muted">
        TOTP MFA enrollment + sign-in + recovery flows, in Demo (no Firebase) or Real mode.
      </p>
      <div className="card">
        <h2>Try the flow</h2>
        <p>
          <Link href="/login">→ Sign in</Link>
        </p>
        <p className="muted">
          Demo credentials are pre-filled. Real mode activates when{' '}
          <code>.env.local</code> is configured.
        </p>
      </div>
      <div className="card">
        <h3>What this shows</h3>
        <ul>
          <li>Enrollment with QR code (real RFC 6238 — works with any authenticator app)</li>
          <li>Sign-in MFA prompt</li>
          <li>Recovery codes (10 one-time codes)</li>
          <li>Protected dashboard</li>
        </ul>
      </div>
    </main>
  );
}
