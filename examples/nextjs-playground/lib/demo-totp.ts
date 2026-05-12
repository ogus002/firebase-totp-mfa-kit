// Demo mode TOTP utilities — RFC 6238 compliant (real Authenticator app works).
// Uses otplib in browser (works via crypto-js subpath).
import { authenticator } from 'otplib';

// Fixed RFC 4226 example secret (well-known, safe for demos).
export const DEMO_SECRET = 'JBSWY3DPEHPK3PXP';
export const DEMO_EMAIL = 'demo@example.com';
export const DEMO_PASSWORD = 'Demo!1234';

// 6-digit, 30s, RFC 6238 default
authenticator.options = { digits: 6, step: 30, window: 1 };

export function generateDemoOtpauthUrl(label: string, issuer: string): string {
  return authenticator.keyuri(label, issuer, DEMO_SECRET);
}

export function verifyDemoCode(code: string): boolean {
  return authenticator.check(code, DEMO_SECRET);
}

// Fixed demo recovery codes — known set so users can experience the recovery flow
// without any backend.
export const DEMO_RECOVERY_CODES = [
  'A3FK-2N9X-7BPQ',
  'M8LT-4K2R-9YWE',
  'Z2QC-8P5N-3HJV',
  '7TXM-LBN5-K9PR',
  'Q4VR-9C2X-8MTL',
  'N6KP-3Z7L-2WBF',
  'X5JM-T8QN-6LCR',
  'B9HF-5K2P-7TVN',
  'L2RT-4N8X-3QMP',
  'C7VK-9B3R-2NFX',
];
