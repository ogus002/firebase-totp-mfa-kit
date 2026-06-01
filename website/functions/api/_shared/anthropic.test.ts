import { describe, it, expect, vi, afterEach } from 'vitest';
import { callAnthropic } from './anthropic';

afterEach(() => vi.restoreAllMocks());

describe('callAnthropic', () => {
  it('posts to the messages endpoint with key+system and parses text+usage', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: 'hi there' }],
          usage: { input_tokens: 10, output_tokens: 4 },
        }),
        { status: 200 },
      ),
    );
    const out = await callAnthropic({
      apiKey: 'k',
      model: 'claude-haiku-4-5',
      system: 'SYS',
      messages: [{ role: 'user', content: 'hello' }],
      maxTokens: 600,
    });
    expect(out.text).toBe('hi there');
    expect(out.usage.input + out.usage.output).toBe(14);
    const [url, init] = spy.mock.calls[0];
    expect(String(url)).toContain('api.anthropic.com/v1/messages');
    expect((init as RequestInit).method).toBe('POST');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe('claude-haiku-4-5');
    expect(body.system).toBe('SYS');
    expect(body.max_tokens).toBe(600);
  });

  it('throws on non-200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('err', { status: 500 }));
    await expect(
      callAnthropic({ apiKey: 'k', model: 'm', system: 's', messages: [], maxTokens: 10 }),
    ).rejects.toThrow();
  });
});
