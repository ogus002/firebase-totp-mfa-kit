'use client';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

export default function HomePage() {
  const t = useT();
  return (
    <main className="page">
      <h1>{t.home.title}</h1>
      <p className="muted">{t.home.subtitle}</p>
      <div className="card">
        <h2>{t.home.tryFlowHeading}</h2>
        <p>
          <Link href="/login">{t.home.signInLink}</Link>
        </p>
        <p className="muted">{t.home.demoCreds}</p>
      </div>
      <div className="card">
        <h3>{t.home.whatThisShows}</h3>
        <ul>
          <li>{t.home.feat_enroll}</li>
          <li>{t.home.feat_signin}</li>
          <li>{t.home.feat_recovery}</li>
          <li>{t.home.feat_dashboard}</li>
        </ul>
      </div>
    </main>
  );
}
