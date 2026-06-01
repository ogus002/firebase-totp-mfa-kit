import * as OTPAuth from 'otpauth';

export const DEMO_ISSUER = 'firebase-totp-mfa (demo)';
export const DEMO_LABEL = 'demo@totp.antmon.kr';

function totpFor(secretBase32: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: DEMO_ISSUER,
    label: DEMO_LABEL,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export function createSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function buildOtpauthUrl(secretBase32: string): string {
  return totpFor(secretBase32).toString();
}

export function currentCode(secretBase32: string, timestamp?: number): string {
  return totpFor(secretBase32).generate({ timestamp });
}

export function verifyCode(
  secretBase32: string,
  code: string,
  options?: { window?: number; timestamp?: number },
): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const delta = totpFor(secretBase32).validate({
    token: code,
    window: options?.window ?? 1,
    timestamp: options?.timestamp,
  });
  return delta !== null;
}

// 모호한 문자(0/1/I/O) 제외한 alphabet
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomChunk(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length]).join('');
}

export function generateRecoveryCodes(count = 8): string[] {
  const codes = new Set<string>();
  while (codes.size < count) {
    codes.add(`${randomChunk(4)}-${randomChunk(4)}`);
  }
  return Array.from(codes);
}

export function normalizeRecovery(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidRecovery(
  codes: string[],
  used: string[],
  input: string,
): boolean {
  const n = normalizeRecovery(input);
  return codes.includes(n) && !used.includes(n);
}
