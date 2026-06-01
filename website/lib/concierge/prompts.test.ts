import { describe, it, expect } from 'vitest';
import { buildConciergeSystemPrompt } from './prompts';

describe('buildConciergeSystemPrompt', () => {
  const sys = buildConciergeSystemPrompt();

  it('embeds the knowledge digest', () => {
    expect(sys).toContain('firebase-totp-mfa');
    expect(sys).toContain('/demo');
  });

  it('forbids generating auth code (trust hazard)', () => {
    expect(sys.toLowerCase()).toContain('never write');
    expect(sys.toLowerCase()).toContain('auth code');
  });

  it('scopes to the kit/MFA topic (refuse off-topic)', () => {
    expect(sys.toLowerCase()).toContain('refuse');
    expect(sys.toLowerCase()).toContain('off-topic');
  });

  it('routes integration help to the quote/human path', () => {
    expect(sys.toLowerCase()).toContain('request help');
  });
});
