'use client';
import { useState } from 'react';
import { DEMO_RECOVERY_CODES } from '@/lib/demo-totp';

export default function RecoveryPage() {
  const [generated, setGenerated] = useState<string[] | null>(null);

  const handleDownload = () => {
    if (!generated) return;
    const body = ['Recovery codes — keep them safe.', '', ...generated].join('\n');
    const blob = new Blob([body], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <main className="page">
      <h1>Recovery codes</h1>
      <div className="card">
        <p className="muted">
          Each code can be used once if you lose access to your authenticator app. Store them
          somewhere safe.
        </p>
        {!generated && (
          <button className="btn" onClick={() => setGenerated(DEMO_RECOVERY_CODES)}>
            Generate 10 recovery codes
          </button>
        )}
        {generated && (
          <>
            <p style={{ color: '#92400e', fontWeight: 500 }}>These codes will only be shown once.</p>
            <ul style={{
              listStyle: 'none', padding: '1rem', margin: 0,
              background: 'rgba(0,0,0,0.04)', borderRadius: 6,
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem',
              fontFamily: 'ui-monospace, monospace',
            }}>
              {generated.map((c) => (<li key={c}><code>{c}</code></li>))}
            </ul>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn" onClick={handleDownload}>Download .txt</button>
              <button className="btn" style={{ background: 'transparent', color: 'var(--fg)', border: '1px solid var(--border)' }} onClick={() => window.print()}>
                Print
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
