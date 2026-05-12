'use client';
import { useState } from 'react';
import { DEMO_RECOVERY_CODES } from '@/lib/demo-totp';
import { useT } from '@/lib/i18n';

export default function RecoveryPage() {
  const t = useT();
  const [generated, setGenerated] = useState<string[] | null>(null);

  const handleDownload = () => {
    if (!generated) return;
    const body = [t.recovery.title, '', ...generated].join('\n');
    const blob = new Blob([body], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <main className="page">
      <h1>{t.recovery.title}</h1>
      <div className="card">
        <p className="muted">{t.recovery.intro}</p>
        {!generated && (
          <button className="btn" onClick={() => setGenerated(DEMO_RECOVERY_CODES)}>
            {t.recovery.generate}
          </button>
        )}
        {generated && (
          <>
            <p style={{ color: '#92400e', fontWeight: 500 }}>{t.recovery.shownOnce}</p>
            <ul style={{
              listStyle: 'none', padding: '1rem', margin: 0,
              background: 'rgba(0,0,0,0.04)', borderRadius: 6,
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem',
              fontFamily: 'ui-monospace, monospace',
            }}>
              {generated.map((c) => (<li key={c}><code>{c}</code></li>))}
            </ul>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn" onClick={handleDownload}>{t.recovery.download}</button>
              <button className="btn" style={{ background: 'transparent', color: 'var(--fg)', border: '1px solid var(--border)' }} onClick={() => window.print()}>
                {t.recovery.print}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
