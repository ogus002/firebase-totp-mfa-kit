import type { ChatMessage } from '../../../lib/concierge/types';

export interface CallAnthropicOpts {
  apiKey: string;
  model: string;
  system: string;
  messages: ChatMessage[];
  maxTokens: number;
}

export interface AnthropicResult {
  text: string;
  usage: { input: number; output: number };
}

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const TIMEOUT_MS = 15000; // abort a hung request before Cloudflare kills the function (edge 502)
const MAX_ATTEMPTS = 2; // 1 retry on transient failures

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const isTransient = (status: number) => status === 429 || status >= 500; // incl. 529 overloaded

export async function callAnthropic(opts: CallAnthropicOpts): Promise<AnthropicResult> {
  const body = JSON.stringify({
    model: opts.model,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
  });

  let lastError: Error = new Error('anthropic failed');

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': opts.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body,
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = new Error(`anthropic ${res.status}`);
        if (attempt < MAX_ATTEMPTS && isTransient(res.status)) {
          lastError = err;
          await sleep(300 * attempt);
          continue;
        }
        throw err;
      }

      const data = (await res.json()) as {
        content?: { type: string; text?: string }[];
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      const text = (data.content ?? [])
        .filter((b) => b.type === 'text' && b.text)
        .map((b) => b.text as string)
        .join('\n');
      return {
        text,
        usage: {
          input: data.usage?.input_tokens ?? 0,
          output: data.usage?.output_tokens ?? 0,
        },
      };
    } catch (e) {
      // AbortError = our timeout; TypeError = network failure — both transient
      const err = e as Error;
      const normalized = err.name === 'AbortError' ? new Error('anthropic timeout') : err;
      if (attempt < MAX_ATTEMPTS && (err.name === 'AbortError' || err.name === 'TypeError')) {
        lastError = normalized;
        await sleep(300 * attempt);
        continue;
      }
      throw normalized;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}
