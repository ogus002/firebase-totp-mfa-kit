'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { detectAuthMode } from '@/lib/auth-mode';

export default function DashboardPage() {
  const router = useRouter();
  const mode = detectAuthMode();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (mode === 'demo') {
      const signed = typeof window !== 'undefined' && sessionStorage.getItem('demo:signed-in') === 'true';
      if (!signed) router.replace('/login');
      else setOk(true);
    } else {
      setOk(true);
    }
  }, [mode, router]);

  if (!ok) return null;
  return (
    <main className="page">
      <h1>Dashboard</h1>
      <div className="card">
        <p>✓ You are signed in with two-factor authentication.</p>
        <p className="muted">
          This is a placeholder. Replace with your real protected content.
        </p>
        <p>
          <Link href="/recovery">Manage recovery codes →</Link>
        </p>
        <button
          className="btn"
          style={{ marginTop: '1rem' }}
          onClick={() => {
            sessionStorage.removeItem('demo:signed-in');
            sessionStorage.removeItem('demo:enrolled');
            router.push('/');
          }}
        >
          Sign out (Demo)
        </button>
      </div>
    </main>
  );
}
