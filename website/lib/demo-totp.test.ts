import { describe, it, expect } from 'vitest';
import { createSecret, buildOtpauthUrl, currentCode, verifyCode } from './demo-totp';
import {
  generateRecoveryCodes,
  isValidRecovery,
} from './demo-totp';

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

describe('demo-totp recovery', () => {
  it('generates N unique formatted codes', () => {
    const codes = generateRecoveryCodes(8);
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    codes.forEach((c) => expect(c).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/));
  });

  it('accepts a valid unused code (case-insensitive, trimmed)', () => {
    const codes = ['ABCD-2345', 'WXYZ-6789'];
    expect(isValidRecovery(codes, [], '  abcd-2345 ')).toBe(true);
  });

  it('rejects an already-used code', () => {
    const codes = ['ABCD-2345'];
    expect(isValidRecovery(codes, ['ABCD-2345'], 'ABCD-2345')).toBe(false);
  });

  it('rejects an unknown code', () => {
    expect(isValidRecovery(['ABCD-2345'], [], 'ZZZZ-0000')).toBe(false);
  });
});
