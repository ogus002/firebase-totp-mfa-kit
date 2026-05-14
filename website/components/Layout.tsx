import Head from 'next/head';
import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function Layout({ title, description, children }: Props) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-white text-slate-900">
        <header className="border-b">
          <nav className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="font-semibold">
              firebase-totp-mfa
            </Link>
            <a
              href="https://github.com/ogus02/firebase-totp-mfa-kit"
              className="text-sm text-slate-600 hover:text-slate-900"
              rel="noreferrer"
            >
              GitHub
            </a>
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
      </div>
    </>
  );
}
