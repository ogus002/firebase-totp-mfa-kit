import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { DemoBanner } from '@/components/DemoBanner';
import { LangSwitcher } from '@/components/LangSwitcher';
import { I18nProvider, COOKIE_NAME, isValidLocale } from '@/lib/i18n';
import { DEFAULT_LOCALE } from '@/lib/i18n-messages';
import './globals.css';

export const metadata: Metadata = {
  title: 'firebase-totp-mfa playground',
  description: 'Demo + Real mode for the firebase-totp-mfa-kit',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the locale cookie on the server so the initial render matches what the client will hydrate to.
  const cookieLocale = cookies().get(COOKIE_NAME)?.value;
  const initialLocale = isValidLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <html lang={initialLocale}>
      <body>
        <I18nProvider initialLocale={initialLocale}>
          <LangSwitcher />
          <DemoBanner />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
