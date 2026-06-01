import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import Concierge from './concierge/Concierge';

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

const CF_ANALYTICS_TOKEN = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;
const SITE_URL = 'https://totp.antmon.kr';

export default function Layout({ title, description, children }: Props) {
  const router = useRouter();
  const path = router.asPath.split('?')[0].split('#')[0];
  const canonicalPath = path.endsWith('/') ? path : `${path}/`;
  const canonical = `${SITE_URL}${canonicalPath}`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        {CF_ANALYTICS_TOKEN && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${CF_ANALYTICS_TOKEN}"}`}
          />
        )}
      </Head>
      <div className="min-h-screen bg-white text-slate-900">
        <header className="border-b">
          <nav className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="font-semibold">
              firebase-totp-mfa
            </Link>
            <div className="flex items-center gap-5 text-sm">
              <Link
                href="/demo"
                className="text-slate-600 hover:text-slate-900"
              >
                Demo
              </Link>
              <Link
                href="/firebase-totp-mfa-setup"
                className="text-slate-600 hover:text-slate-900"
              >
                Setup Guide
              </Link>
              <a
                href="https://github.com/ogus002/firebase-totp-mfa-kit"
                className="text-slate-600 hover:text-slate-900"
                rel="noreferrer"
              >
                GitHub
              </a>
            </div>
          </nav>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-12">{children}</main>
        <footer className="border-t mt-16">
          <div className="max-w-4xl mx-auto px-6 py-6 text-sm text-slate-500">
            MIT &mdash; ogus002 &mdash;{' '}
            <a
              href="https://www.npmjs.com/package/firebase-totp-mfa"
              className="hover:text-slate-900"
              rel="noreferrer"
            >
              npm
            </a>
          </div>
        </footer>
        <Concierge />
      </div>
    </>
  );
}
