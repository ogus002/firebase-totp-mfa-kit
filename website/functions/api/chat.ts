import type { ChatMessage } from '../../lib/concierge/types';
import { buildConciergeSystemPrompt } from '../../lib/concierge/prompts';
import { verifyTurnstile } from './_shared/turnstile';
import { callAnthropic } from './_shared/anthropic';
import {
  type KvLike,
  createSession,
  isValidSession,
  checkAndIncrementRate,
  addDailyTokens,
  isDailyBudgetExceeded,
} from './_shared/kv';

export interface ChatEnv {
  ANTHROPIC_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  CONCIERGE_KV: KvLike;
  DAILY_TOKEN_CAP?: string;
}

interface ChatBody {
  messages: ChatMessage[];
  turnstileToken?: string;
  sessionId?: string;
}

const MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 600;
const RATE_LIMIT = 20; // per IP per hour
const MSG_CAP = 12; // 대화 길이 상한

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function handleChat(body: ChatBody, env: ChatEnv, ip: string): Promise<Response> {
  const kv = env.CONCIERGE_KV;
  const messages = Array.isArray(body.messages) ? body.messages.slice(-MSG_CAP) : [];
  if (messages.length === 0) return json({ error: 'no messages' }, 400);

  // 세션: 첫 메시지는 turnstile, 이후는 sessionId
  let sessionId = body.sessionId ?? '';
  if (sessionId) {
    if (!(await isValidSession(kv, sessionId))) {
      return json({ error: 'session expired' }, 401);
    }
  } else if (body.turnstileToken) {
    const ok = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
    if (!ok) return json({ error: 'turnstile failed' }, 403);
    sessionId = await createSession(kv);
  } else {
    return json({ error: 'verification required' }, 400);
  }

  // rate limit (per IP)
  const rl = await checkAndIncrementRate(kv, `ip:${ip}`, RATE_LIMIT, 3600);
  if (!rl.ok) return json({ error: 'rate limited', sessionId }, 429);

  // budget kill-switch
  const cap = Number(env.DAILY_TOKEN_CAP ?? '500000');
  if (await isDailyBudgetExceeded(kv, cap)) {
    return json(
      {
        reply:
          "The assistant is busy right now. Browse the FAQ, or use \"Request help / quote\" and we'll follow up.",
        sessionId,
        degraded: true,
      },
      200,
    );
  }

  // Anthropic 호출
  const out = await callAnthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    model: MODEL,
    system: buildConciergeSystemPrompt(),
    messages,
    maxTokens: MAX_TOKENS,
  });
  await addDailyTokens(kv, out.usage.input + out.usage.output);

  return json({ reply: out.text, sessionId });
}

// Cloudflare Pages Function entrypoint
export const onRequestPost = async (context: {
  request: Request;
  env: ChatEnv;
}): Promise<Response> => {
  let body: ChatBody;
  try {
    body = (await context.request.json()) as ChatBody;
  } catch {
    return json({ error: 'bad json' }, 400);
  }
  const ip = context.request.headers.get('CF-Connecting-IP') ?? 'unknown';
  try {
    return await handleChat(body, context.env, ip);
  } catch {
    return json({ error: 'upstream error' }, 502);
  }
};
