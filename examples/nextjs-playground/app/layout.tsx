import type { Metadata } from 'next';
import { DemoBanner } from '@/components/DemoBanner';
import './globals.css';

export const metadata: Metadata = {
  title: 'firebase-totp-mfa playground',
  description: 'Demo + Real mode for the firebase-totp-mfa-kit',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
