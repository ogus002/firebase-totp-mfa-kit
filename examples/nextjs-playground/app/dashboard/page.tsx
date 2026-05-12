'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { detectAuthMode } from '@/lib/auth-mode';
import { useT } from '@/lib/i18n';

export default function DashboardPage() {
  const router = useRouter();
  const mode = detectAuthMode();
  const t = useT();
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
      <h1>{t.dashboard.title}</h1>
      <div className="card">
        <p>{t.dashboard.signedIn}</p>
        <p className="muted">{t.dashboard.placeholder}</p>
        <p>
          <Link href="/recovery">{t.dashboard.manageRecovery}</Link>
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
          {t.dashboard.signOutDemo}
        </button>
      </div>
    </main>
  );
}
