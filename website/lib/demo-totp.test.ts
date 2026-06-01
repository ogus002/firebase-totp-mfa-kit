import { describe, it, expect } from 'vitest';
import { createSecret, buildOtpauthUrl, currentCode, verifyCode } from './demo-totp';

describe('demo-totp core', () => {
  const secret = 'JBSWY3DPEHPK3PXP'; // 고정 Base32 — 결정적 테스트용
  const ts = 1700000000000;

  it('createSecret returns a Base32 string', () => {
    const s = createSecret();
    expect(s).toMatch(/^[A-Z2-7]+$/);
    expect(s.length).toBeGreaterThanOrEqual(16);
  });

  it('buildOtpauthUrl returns an otpauth:// URI', () => {
    const url = buildOtpauthUrl(secret);
    expect(url.startsWith('otpauth://totp/')).toBe(true);
    expect(url).toContain('secret=' + secret);
  });

  it('verifies the current code at a fixed timestamp', () => {
    const code = currentCode(secret, ts);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyCode(secret, code, { timestamp: ts })).toBe(true);
  });

  it('tolerates +/-1 step drift', () => {
    const prev = currentCode(secret, ts - 30000);
    expect(verifyCode(secret, prev, { timestamp: ts, window: 1 })).toBe(true);
  });

  it('rejects a code from far outside the window', () => {
    const far = currentCode(secret, ts + 10 * 60 * 1000);
    expect(verifyCode(secret, far, { timestamp: ts, window: 1 })).toBe(false);
  });

  it('rejects non-6-digit input', () => {
    expect(verifyCode(secret, '12', { timestamp: ts })).toBe(false);
    expect(verifyCode(secret, 'abcdef', { timestamp: ts })).toBe(false);
  });
});
