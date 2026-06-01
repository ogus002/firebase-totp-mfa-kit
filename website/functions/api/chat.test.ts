import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleChat, type ChatEnv } from './chat';
import { createMockKv } from './_shared/kv';

afterEach(() => vi.restoreAllMocks());

function env(): ChatEnv {
  return {
    ANTHROPIC_API_KEY: 'k',
    TURNSTILE_SECRET_KEY: 'ts',
    CONCIERGE_KV: createMockKv(),
    DAILY_TOKEN_CAP: '100000',
  };
}

function mockTurnstileOk() {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    if (String(url).includes('siteverify')) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    return new Response(
      JSON.stringify({ content: [{ type: 'text', text: 'answer' }], usage: { input_tokens: 5, output_tokens: 3 } }),
      { status: 200 },
    );
  });
}

describe('handleChat', () => {
  it('first message: verifies turnstile, returns reply + sessionId', async () => {
    mockTurnstileOk();
    const e = env();
    const res = await handleChat(
      { messages: [{ role: 'user', content: 'hi' }], turnstileToken: 'tok' },
      e,
      '1.2.3.4',
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reply).toBe('answer');
    expect(body.sessionId).toBeTruthy();
  });

  it('rejects bad turnstile with 403', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false }), { status: 200 }),
    );
    const res = await handleChat(
      { messages: [{ role: 'user', content: 'hi' }], turnstileToken: 'bad' },
      env(),
      '1.2.3.4',
    );
    expect(res.status).toBe(403);
  });

  it('rejects missing token and sessionId with 400', async () => {
    const res = await handleChat({ messages: [{ role: 'user', content: 'hi' }] }, env(), '1.2.3.4');
    expect(res.status).toBe(400);
  });

  it('returns 401 for an unknown/expired session', async () => {
    const res = await handleChat(
      { messages: [{ role: 'user', content: 'hi' }], sessionId: 'nope' },
      env(),
      '1.2.3.4',
    );
    expect(res.status).toBe(401);
  });

  it('returns 429 when the per-IP rate limit is exceeded', async () => {
    const e = env();
    await e.CONCIERGE_KV.put('sess:s1', '1');
    await e.CONCIERGE_KV.put('rate:ip:1.2.3.4', '20');
    const res = await handleChat(
      { messages: [{ role: 'user', content: 'hi' }], sessionId: 's1' },
      e,
      '1.2.3.4',
    );
    expect(res.status).toBe(429);
  });

  it('rejects an oversized message with 400', async () => {
    const res = await handleChat(
      { messages: [{ role: 'user', content: 'x'.repeat(2001) }], turnstileToken: 'tok' },
      env(),
      '1.2.3.4',
    );
    expect(res.status).toBe(400);
  });

  it('degrades gracefully when budget exceeded', async () => {
    mockTurnstileOk();
    const e = env();
    e.DAILY_TOKEN_CAP = '1'; // 즉시 초과
    await e.CONCIERGE_KV.put(`budget:${new Date().toISOString().slice(0, 10)}`, '5');
    const res = await handleChat(
      { messages: [{ role: 'user', content: 'hi' }], turnstileToken: 'tok' },
      e,
      '1.2.3.4',
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.degraded).toBe(true);
  });
});
