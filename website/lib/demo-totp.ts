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
