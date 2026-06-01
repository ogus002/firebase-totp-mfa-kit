import { describe, it, expect, vi, afterEach } from 'vitest';
import { verifyTurnstile } from './turnstile';

afterEach(() => vi.restoreAllMocks());

describe('verifyTurnstile', () => {
  it('returns true when siteverify says success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    expect(await verifyTurnstile('tok', 'secret', '1.2.3.4')).toBe(true);
  });

  it('returns false when siteverify says failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false }), { status: 200 }),
    );
    expect(await verifyTurnstile('tok', 'secret')).toBe(false);
  });

  it('returns false on empty token without calling fetch', async () => {
    const f = vi.spyOn(globalThis, 'fetch');
    expect(await verifyTurnstile('', 'secret')).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});
