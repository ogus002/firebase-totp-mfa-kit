# Plan A — AI 컨시에지 위젯 + 티어형 백엔드 (SP1+SP2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** totp.antmon.kr 에 FAB 챗 위젯을 붙여 — 티어0 정적 FAQ($0) + 티어1 Haiku 직접질문(가드 적용) 으로 Firebase MFA 문의를 응대한다. 견적 경로는 placeholder (실제 견적/Telegram/PayPal 은 Plan B).

**Architecture:** 정적 사이트 + **Cloudflare Pages Function** `/api/chat` (co-located). 순수 로직(`lib/concierge/`) + 가드 헬퍼(`functions/api/_shared/`) 는 vitest 로 단위테스트. 키는 CF Pages 런타임 env. Turnstile 로 첫 메시지 검증 → 세션 토큰(KV) → 이후 rate limit. Anthropic 은 raw fetch(Haiku).

**Tech Stack:** Next.js 16 Pages Router(정적 export) / React 19 / Tailwind / Cloudflare Pages Functions(Workers 런타임) / KV / Turnstile / vitest

**Source 설계서:** `docs/superpowers/specs/2026-06-02-conversion-concierge-design.md`

---

## File Structure

- Create: `website/lib/concierge/types.ts` — 공유 타입
- Create: `website/lib/concierge/faq.ts` (+ `.test.ts`) — 티어0 정적 FAQ
- Create: `website/lib/concierge/knowledge.ts` — 티어1 지식 digest (시스템 prefix)
- Create: `website/lib/concierge/prompts.ts` (+ `.test.ts`) — 시스템 프롬프트 빌더
- Create: `website/functions/api/_shared/turnstile.ts` (+ `.test.ts`)
- Create: `website/functions/api/_shared/kv.ts` (+ `.test.ts`) — rate limit + 세션 + budget
- Create: `website/functions/api/_shared/anthropic.ts` (+ `.test.ts`)
- Create: `website/functions/api/chat.ts` (+ `.test.ts`) — Pages Function 핸들러
- Create: `website/components/concierge/Mascot.tsx`
- Create: `website/components/concierge/Concierge.tsx` — FAB+다이얼로그 상태 오케스트레이션
- Create: `website/components/concierge/ChatDialog.tsx`
- Create: `website/components/concierge/ChatMessages.tsx` — 메시지 + Claude풍 로딩
- Create: `website/components/concierge/FaqChips.tsx`
- Create: `website/components/concierge/ChatInput.tsx`
- Create: `website/components/concierge/Turnstile.tsx`
- Modify: `website/components/Layout.tsx` — `<Concierge/>` 마운트
- Modify: `website/package.json` — `@cloudflare/workers-types` devDep
- Modify: `website/vitest.config.ts` — `functions/**/*.test.ts` include

---

## Task 1: deps + vitest include + 타입 + FAQ (TDD)

**Files:**
- Modify: `website/package.json`, `website/vitest.config.ts`
- Create: `website/lib/concierge/types.ts`, `website/lib/concierge/faq.ts`, `website/lib/concierge/faq.test.ts`

- [ ] **Step 1.1: 타입 빌드용 deps**

```bash
cd C:/Dev/firebase-totp-mfa-kit/website
npm install --ignore-scripts --save-dev @cloudflare/workers-types
```

- [ ] **Step 1.2: vitest include 확장**

`website/vitest.config.ts` 의 `include` 를 교체:
```ts
    include: ['lib/**/*.test.ts', 'functions/**/*.test.ts'],
```

- [ ] **Step 1.3: 공유 타입**

`website/lib/concierge/types.ts`:
```ts
export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface FaqItem {
  id: string;
  q: string;
  a: string;
}

export interface ChatApiResponse {
  reply: string;
  sessionId: string;
  degraded?: boolean;
}
```

- [ ] **Step 1.4: FAQ 실패 테스트**

`website/lib/concierge/faq.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { FAQ } from './faq';

describe('faq', () => {
  it('has at least 4 items with unique ids', () => {
    expect(FAQ.length).toBeGreaterThanOrEqual(4);
    expect(new Set(FAQ.map((f) => f.id)).size).toBe(FAQ.length);
  });

  it('every item has non-empty q and a', () => {
    FAQ.forEach((f) => {
      expect(f.q.trim().length).toBeGreaterThan(0);
      expect(f.a.trim().length).toBeGreaterThan(0);
    });
  });

  it('answers reference the CLI, never raw auth code', () => {
    FAQ.forEach((f) => {
      expect(f.a).not.toMatch(/import .*firebase\/auth/);
    });
  });
});
```

- [ ] **Step 1.5: 테스트 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `Cannot find module './faq'`

- [ ] **Step 1.6: FAQ 데이터 구현**

`website/lib/concierge/faq.ts`:
```ts
import type { FaqItem } from './types';

export const FAQ: FaqItem[] = [
  {
    id: 'setup',
    q: 'How do I add Firebase TOTP MFA to my Next.js app?',
    a: 'Run one command — it copies the source into your project and wires the route:\n\nnpx firebase-totp-mfa add next --area /admin --issuer "MyApp"\n\nThen enable Identity Platform: npx firebase-totp-mfa enable --project YOUR-PROJECT-ID. Full guide: /firebase-totp-mfa-setup',
  },
  {
    id: 'sms-vs-totp',
    q: 'TOTP vs SMS — which should I use?',
    a: 'TOTP (authenticator app codes) has no per-message cost and no SIM-swap risk. Firebase Identity Platform supports TOTP MFA on the free Spark plan up to 3,000 DAU. SMS MFA costs per message and is weaker. This kit wires TOTP.',
  },
  {
    id: 'recovery',
    q: 'What about recovery codes if a user loses their phone?',
    a: 'The kit ships recovery codes in Phase 1 (not an afterthought). Users get one-time backup codes at enrollment and can sign in with one if they lose their authenticator. Try the live flow at /demo.',
  },
  {
    id: 'cost',
    q: 'How much does this cost to run?',
    a: 'Firebase Identity Platform TOTP MFA is free on the Spark plan up to 3,000 daily active users. The kit itself is open source (MIT). You only pay Firebase if you exceed the free tier.',
  },
  {
    id: 'own-code',
    q: 'Do I own the code, or is it a runtime dependency?',
    a: 'You own it. shadcn-style — the CLI copies source files into your repo. No magical runtime package; you can read, debug, audit, and customize everything.',
  },
  {
    id: 'help',
    q: 'I need help integrating this into my app',
    a: 'Use "Request help / quote" below — describe your setup and we will follow up. Note: this assistant explains concepts and points to CLI commands; it never writes auth code for you (that is the whole point of the kit).',
  },
];
```

- [ ] **Step 1.7: 테스트 통과 확인**

Run: `cd website && npm test`
Expected: PASS

- [ ] **Step 1.8: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/package.json website/package-lock.json website/vitest.config.ts website/lib/concierge/types.ts website/lib/concierge/faq.ts website/lib/concierge/faq.test.ts
git commit -m "feat(concierge): types + tier-0 static FAQ data with tests"
```

---

## Task 2: 지식 digest + 시스템 프롬프트 (TDD)

**Files:**
- Create: `website/lib/concierge/knowledge.ts`, `website/lib/concierge/prompts.ts`, `website/lib/concierge/prompts.test.ts`

- [ ] **Step 2.1: 지식 digest**

`website/lib/concierge/knowledge.ts`:
```ts
// 컨시에지가 답할 때 시스템 prefix 로 들어가는 큐레이션 지식 (docs 발췌). 캐시 대상.
export const KNOWLEDGE = `firebase-totp-mfa is a shadcn-style CLI that adds Firebase Identity Platform TOTP 2FA to React/Next.js apps.

Key facts:
- Install: \`npx firebase-totp-mfa add next --area /admin --issuer "MyApp"\` (also: vite, expo, custom). Copies source into the user's repo (they own the code).
- Enable Identity Platform: \`npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run\` then without --dry-run. Sets adjacentIntervals=5.
- Verify: \`npx firebase-totp-mfa verify\` prints manual test scenarios.
- TOTP (authenticator app) not SMS: no per-message cost, free on Firebase Spark up to 3,000 DAU.
- Recovery codes ship in Phase 1. Server-side MFA enforcement snippets included.
- Live demo of the enroll -> login challenge -> recovery flow: /demo
- Setup guide page: /firebase-totp-mfa-setup
- Common errors: 403 on enable = gcloud account missing Project Owner; "Identity Platform not enabled" = upgrade in Firebase console first; wrong project = gcloud config set project.
- Paid help: a $19 async security check (1-page report + auth flow review + checklist) and hourly consulting for integration. Routed to a human, post-pay (no prepayment).`;
```

- [ ] **Step 2.2: 프롬프트 실패 테스트**

`website/lib/concierge/prompts.test.ts`:
```ts
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
```

- [ ] **Step 2.3: 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `Cannot find module './prompts'`

- [ ] **Step 2.4: 프롬프트 빌더 구현**

`website/lib/concierge/prompts.ts`:
```ts
import { KNOWLEDGE } from './knowledge';

export function buildConciergeSystemPrompt(): string {
  return `You are the concierge for the "firebase-totp-mfa" open-source kit, embedded on its marketing site. You help developers understand Firebase TOTP MFA and this kit, and you nudge serious integration needs toward the paid help path.

RULES (hard):
- NEVER write, generate, or paste auth code, Firebase config, or security-sensitive code for the user. Explain concepts and point to the exact CLI command or docs page instead. Writing auth code for users is exactly what this kit exists to avoid.
- Stay strictly on-topic: Firebase TOTP/MFA, this kit, and closely related auth concepts. Politely refuse off-topic requests (general coding, unrelated questions, "write me X") — you are not a general assistant. One short refusal sentence, then redirect to MFA.
- If the user needs hands-on integration help or a security review, tell them to use "Request help / quote" and that a human follows up (post-pay, no prepayment). Do not invent prices.
- Be terse, concrete, friendly. Reference CLI commands and the /demo and /firebase-totp-mfa-setup pages by name.

KNOWLEDGE:
${KNOWLEDGE}`;
}
```

- [ ] **Step 2.5: 통과 확인 + commit**

Run: `cd website && npm test` → PASS
```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/lib/concierge/knowledge.ts website/lib/concierge/prompts.ts website/lib/concierge/prompts.test.ts
git commit -m "feat(concierge): knowledge digest + scoped system prompt (no auth-code, on-topic)"
```

---

## Task 3: Turnstile 검증 헬퍼 (TDD)

**Files:**
- Create: `website/functions/api/_shared/turnstile.ts`, `website/functions/api/_shared/turnstile.test.ts`

- [ ] **Step 3.1: 실패 테스트**

`website/functions/api/_shared/turnstile.test.ts`:
```ts
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
```

- [ ] **Step 3.2: 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `Cannot find module './turnstile'`

- [ ] **Step 3.3: 구현**

`website/functions/api/_shared/turnstile.ts`:
```ts
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(
  token: string,
  secret: string,
  ip?: string,
): Promise<boolean> {
  if (!token || !secret) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  try {
    const res = await fetch(SITEVERIFY, { method: 'POST', body: form });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 3.4: 통과 확인 + commit**

Run: `cd website && npm test` → PASS
```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/functions/api/_shared/turnstile.ts website/functions/api/_shared/turnstile.test.ts
git commit -m "feat(concierge): turnstile verification helper"
```

---

## Task 4: KV 세션 + rate limit + budget (TDD)

**Files:**
- Create: `website/functions/api/_shared/kv.ts`, `website/functions/api/_shared/kv.test.ts`

- [ ] **Step 4.1: 실패 테스트**

`website/functions/api/_shared/kv.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockKv,
  createSession,
  isValidSession,
  checkAndIncrementRate,
  addDailyTokens,
  isDailyBudgetExceeded,
} from './kv';

let kv: ReturnType<typeof createMockKv>;
beforeEach(() => {
  kv = createMockKv();
});

describe('session', () => {
  it('creates and validates a session id', async () => {
    const id = await createSession(kv);
    expect(id).toMatch(/^[a-z0-9]{16,}$/);
    expect(await isValidSession(kv, id)).toBe(true);
  });
  it('rejects unknown session', async () => {
    expect(await isValidSession(kv, 'nope')).toBe(false);
  });
});

describe('rate limit', () => {
  it('allows up to the limit then blocks', async () => {
    for (let i = 0; i < 3; i++) {
      expect((await checkAndIncrementRate(kv, 'ip:1', 3, 3600)).ok).toBe(true);
    }
    expect((await checkAndIncrementRate(kv, 'ip:1', 3, 3600)).ok).toBe(false);
  });
});

describe('budget', () => {
  it('flags exceeded after cap', async () => {
    expect(await isDailyBudgetExceeded(kv, 1000)).toBe(false);
    await addDailyTokens(kv, 600);
    await addDailyTokens(kv, 600);
    expect(await isDailyBudgetExceeded(kv, 1000)).toBe(true);
  });
});
```

- [ ] **Step 4.2: 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `Cannot find module './kv'`

- [ ] **Step 4.3: 구현**

`website/functions/api/_shared/kv.ts`:
```ts
// 최소 KV 인터페이스 (CF KVNamespace 의 부분집합)
export interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

// 테스트용 in-memory mock
export function createMockKv(): KvLike {
  const m = new Map<string, string>();
  return {
    async get(k) {
      return m.has(k) ? (m.get(k) as string) : null;
    },
    async put(k, v) {
      m.set(k, v);
    },
  };
}

function randomId(): string {
  const b = new Uint8Array(12);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(36).padStart(2, '0')).join('').slice(0, 18);
}

const SESSION_TTL = 1800; // 30분

export async function createSession(kv: KvLike): Promise<string> {
  const id = randomId();
  await kv.put(`sess:${id}`, '1', { expirationTtl: SESSION_TTL });
  return id;
}

export async function isValidSession(kv: KvLike, id: string): Promise<boolean> {
  if (!id) return false;
  return (await kv.get(`sess:${id}`)) !== null;
}

export async function checkAndIncrementRate(
  kv: KvLike,
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ ok: boolean; count: number }> {
  const k = `rate:${key}`;
  const cur = Number((await kv.get(k)) ?? '0');
  if (cur >= limit) return { ok: false, count: cur };
  await kv.put(k, String(cur + 1), { expirationTtl: windowSec });
  return { ok: true, count: cur + 1 };
}

function todayKey(): string {
  // UTC 날짜 기준 일일 budget
  return `budget:${new Date().toISOString().slice(0, 10)}`;
}

export async function addDailyTokens(kv: KvLike, tokens: number): Promise<void> {
  const k = todayKey();
  const cur = Number((await kv.get(k)) ?? '0');
  await kv.put(k, String(cur + tokens), { expirationTtl: 172800 });
}

export async function isDailyBudgetExceeded(kv: KvLike, capTokens: number): Promise<boolean> {
  const cur = Number((await kv.get(todayKey())) ?? '0');
  return cur >= capTokens;
}
```

> **Note:** 테스트는 `new Date()` 를 직접 쓰지 않고 budget 키만 검증하므로 결정적. (vitest node 환경에 `crypto.getRandomValues` 존재.)

- [ ] **Step 4.4: 통과 확인 + commit**

Run: `cd website && npm test` → PASS
```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/functions/api/_shared/kv.ts website/functions/api/_shared/kv.test.ts
git commit -m "feat(concierge): KV session + rate limit + daily budget helpers"
```

---

## Task 5: Anthropic raw-fetch 호출 (TDD)

**Files:**
- Create: `website/functions/api/_shared/anthropic.ts`, `website/functions/api/_shared/anthropic.test.ts`

- [ ] **Step 5.1: 실패 테스트**

`website/functions/api/_shared/anthropic.test.ts`:
```ts
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
```

- [ ] **Step 5.2: 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `Cannot find module './anthropic'`

- [ ] **Step 5.3: 구현**

`website/functions/api/_shared/anthropic.ts`:
```ts
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

export async function callAnthropic(opts: CallAnthropicOpts): Promise<AnthropicResult> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: [{ type: 'text', text: opts.system, cache_control: { type: 'ephemeral' } }],
      messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) {
    throw new Error(`anthropic ${res.status}`);
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
}
```

- [ ] **Step 5.4: 통과 확인 + commit**

Run: `cd website && npm test` → PASS
```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/functions/api/_shared/anthropic.ts website/functions/api/_shared/anthropic.test.ts
git commit -m "feat(concierge): anthropic raw-fetch wrapper (haiku, cached system)"
```

---

## Task 6: /api/chat Pages Function 핸들러 (TDD)

**Files:**
- Create: `website/functions/api/chat.ts`, `website/functions/api/chat.test.ts`

- [ ] **Step 6.1: 실패 테스트**

`website/functions/api/chat.test.ts`:
```ts
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
```

- [ ] **Step 6.2: 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `Cannot find module './chat'`

- [ ] **Step 6.3: 구현**

`website/functions/api/chat.ts`:
```ts
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
          "The assistant is busy right now. Browse the FAQ, or use “Request help / quote” and we’ll follow up.",
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
```

- [ ] **Step 6.4: 통과 확인 + commit**

Run: `cd website && npm test` → PASS (전체)
```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/functions/api/chat.ts website/functions/api/chat.test.ts
git commit -m "feat(concierge): /api/chat handler (turnstile/session/rate/budget + haiku)"
```

---

## Task 7: 마스코트 + Concierge 컨테이너 (FAB 상태)

**Files:**
- Create: `website/components/concierge/Mascot.tsx`, `website/components/concierge/Concierge.tsx`

- [ ] **Step 7.1: 마스코트 (placeholder SVG)**

`website/components/concierge/Mascot.tsx`:
```tsx
// placeholder 마스코트 — MFA 테마(방패+말풍선). 추후 실제 마스코트로 교체.
export default function Mascot({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l7 3v6c0 4.4-3 8.4-7 9-4-0.6-7-4.6-7-9V5l7-3z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M12 2l7 3v6c0 4.4-3 8.4-7 9-4-0.6-7-4.6-7-9V5l7-3z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M9 11.5h6M9 8.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
```

- [ ] **Step 7.2: Concierge 컨테이너 (FAB + 다이얼로그 토글)**

`website/components/concierge/Concierge.tsx`:
```tsx
import { useState } from 'react';
import Mascot from './Mascot';
import ChatDialog from './ChatDialog';

export default function Concierge() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-slate-900 text-white shadow-lg px-4 py-3 hover:bg-slate-700"
      >
        <Mascot />
        <span className="text-sm font-medium hidden sm:inline">Ask about MFA</span>
      </button>
      {open && <ChatDialog onClose={() => setOpen(false)} />}
    </>
  );
}
```

- [ ] **Step 7.3: 빌드 확인 (아직 ChatDialog 없음 → 다음 task 후 빌드)**

이 task 는 ChatDialog 의존이라 commit 만 하고 빌드는 Task 8 후.
```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/components/concierge/Mascot.tsx website/components/concierge/Concierge.tsx
git commit -m "feat(concierge): mascot + FAB container"
```

---

## Task 8: ChatDialog + ChatMessages (Claude풍 로딩)

**Files:**
- Create: `website/components/concierge/ChatMessages.tsx`, `website/components/concierge/ChatDialog.tsx`

- [ ] **Step 8.1: ChatMessages (메시지 목록 + 로딩 애니메이션)**

`website/components/concierge/ChatMessages.tsx`:
```tsx
import type { ChatMessage } from '../../lib/concierge/types';

export default function ChatMessages({
  messages,
  loading,
}: {
  messages: ChatMessage[];
  loading: boolean;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.map((m, i) => (
        <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
          <div
            className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
              m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
            }`}
          >
            {m.content}
          </div>
        </div>
      ))}
      {loading && (
        <div className="text-left" aria-live="polite">
          <div className="inline-flex gap-1 rounded-2xl bg-slate-100 px-3 py-2.5">
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8.2: ChatDialog (shell + 상태머신)**

`website/components/concierge/ChatDialog.tsx`:
```tsx
import { useState } from 'react';
import type { ChatMessage } from '../../lib/concierge/types';
import { FAQ } from '../../lib/concierge/faq';
import ChatMessages from './ChatMessages';
import FaqChips from './FaqChips';
import ChatInput from './ChatInput';
import Turnstile from './Turnstile';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

// FAQ 답변을 Claude풍으로 지연+타이핑 노출
function typeOut(full: string, onChunk: (s: string) => void, done: () => void) {
  let i = 0;
  const step = () => {
    i += Math.max(2, Math.round(full.length / 40));
    onChunk(full.slice(0, i));
    if (i < full.length) setTimeout(step, 20);
    else done();
  };
  setTimeout(step, 400);
}

export default function ChatDialog({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [tsToken, setTsToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pushAssistant = (content: string) =>
    setMessages((m) => [...m, { role: 'assistant', content }]);

  // 티어0: FAQ 정적 답변 (로딩 + 타이핑)
  const onFaq = (id: string) => {
    const item = FAQ.find((f) => f.id === id);
    if (!item) return;
    setError(null);
    setMessages((m) => [...m, { role: 'user', content: item.q }]);
    setLoading(true);
    let buf = '';
    setMessages((m) => [...m, { role: 'assistant', content: '' }]);
    typeOut(
      item.a,
      (s) => {
        buf = s;
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: 'assistant', content: buf };
          return copy;
        });
      },
      () => setLoading(false),
    );
  };

  // 티어1: 직접 질문 → /api/chat (Haiku)
  const onSend = async (text: string) => {
    setError(null);
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          sessionId ? { messages: next, sessionId } : { messages: next, turnstileToken: tsToken },
        ),
      });
      const data = (await res.json()) as { reply?: string; sessionId?: string; error?: string };
      if (!res.ok) {
        setError(
          res.status === 429
            ? 'Too many messages — please slow down.'
            : res.status === 403
              ? 'Verification failed — reload and try again.'
              : 'Something went wrong. Try the FAQ or request help below.',
        );
      } else {
        if (data.sessionId) setSessionId(data.sessionId);
        pushAssistant(data.reply ?? '');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const needsTurnstile = !sessionId && !tsToken;

  return (
    <div className="fixed bottom-20 right-5 z-40 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col rounded-xl border bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold text-sm">Ask about Firebase MFA</span>
        <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-900">
          ×
        </button>
      </div>

      {messages.length === 0 && <FaqChips onPick={onFaq} />}
      <ChatMessages messages={messages} loading={loading} />

      {error && (
        <p className="px-4 pb-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {needsTurnstile && TURNSTILE_SITE_KEY && (
        <div className="px-4 pb-2">
          <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={setTsToken} />
        </div>
      )}

      <ChatInput
        onSend={onSend}
        disabled={loading || (needsTurnstile && !!TURNSTILE_SITE_KEY)}
      />
    </div>
  );
}
```

- [ ] **Step 8.3: commit (빌드는 Task 9 후 — FaqChips/ChatInput/Turnstile 의존)**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/components/concierge/ChatMessages.tsx website/components/concierge/ChatDialog.tsx
git commit -m "feat(concierge): chat dialog shell + messages + claude-style loading"
```

---

## Task 9: FaqChips + ChatInput + Turnstile

**Files:**
- Create: `website/components/concierge/FaqChips.tsx`, `website/components/concierge/ChatInput.tsx`, `website/components/concierge/Turnstile.tsx`

- [ ] **Step 9.1: FaqChips**

`website/components/concierge/FaqChips.tsx`:
```tsx
import { FAQ } from '../../lib/concierge/faq';

export default function FaqChips({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div className="border-b px-4 py-3">
      <p className="mb-2 text-xs text-slate-500">Common questions</p>
      <div className="flex flex-col gap-1.5">
        {FAQ.map((f) => (
          <button
            key={f.id}
            onClick={() => onPick(f.id)}
            className="rounded-lg border px-3 py-1.5 text-left text-sm hover:border-slate-900"
          >
            {f.q}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 9.2: ChatInput**

`website/components/concierge/ChatInput.tsx`:
```tsx
import { useState } from 'react';

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState('');
  const submit = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText('');
  };
  return (
    <div className="flex items-center gap-2 border-t px-3 py-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        placeholder="Ask your own question…"
        className="flex-1 rounded-lg border px-3 py-2 text-sm"
      />
      <button
        onClick={submit}
        disabled={disabled || text.trim().length === 0}
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-40"
      >
        Send
      </button>
    </div>
  );
}
```

- [ ] **Step 9.3: Turnstile (스크립트 로드 + 위젯)**

`website/components/concierge/Turnstile.tsx`:
```tsx
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: { sitekey: string; callback: (token: string) => void },
      ) => string;
    };
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

export default function Turnstile({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    const render = () => {
      if (rendered.current || !ref.current || !window.turnstile) return;
      rendered.current = true;
      window.turnstile.render(ref.current, { sitekey: siteKey, callback: onToken });
    };
    if (window.turnstile) {
      render();
    } else if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      const t = setInterval(() => {
        if (window.turnstile) {
          clearInterval(t);
          render();
        }
      }, 200);
      return () => clearInterval(t);
    }
  }, [siteKey, onToken]);

  return <div ref={ref} className="cf-turnstile" />;
}
```

- [ ] **Step 9.4: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/components/concierge/FaqChips.tsx website/components/concierge/ChatInput.tsx website/components/concierge/Turnstile.tsx
git commit -m "feat(concierge): faq chips + chat input + turnstile widget"
```

---

## Task 10: Layout 마운트 + 빌드 + CF 셋업 + 배포

**Files:**
- Modify: `website/components/Layout.tsx`

- [ ] **Step 10.1: Concierge 를 Layout 에 마운트**

`website/components/Layout.tsx` 의 `import` 부에 추가:
```tsx
import Concierge from './concierge/Concierge';
```
그리고 `<footer>...</footer>` 닫힌 직후, `</div>` 앞에 추가:
```tsx
        <Concierge />
```

- [ ] **Step 10.2: 전체 테스트 + 빌드**

```bash
cd C:/Dev/firebase-totp-mfa-kit/website
npm test
npm run build
```
Expected: 테스트 전부 PASS, 빌드 `Compiled successfully`, Routes 에 기존 페이지 유지. (functions/ 는 정적 export 에 포함 안 되지만 CF 가 배포 시 인식)

- [ ] **Step 10.3: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/components/Layout.tsx
git commit -m "feat(concierge): mount FAB concierge widget site-wide"
```

- [ ] **Step 10.4: CF 콘솔 셋업 (운영자 수동)**

1. **Turnstile**: CF 대시보드 → Turnstile → Add site (`totp.antmon.kr`) → **Site key**(공개) + **Secret key** 획득
2. **KV**: Workers & Pages → KV → Create namespace `CONCIERGE_KV`
3. **Pages 프로젝트 바인딩**: `firebase-totp-mfa-kit` → Settings → Functions → **KV namespace bindings**: 변수명 `CONCIERGE_KV` → 위 namespace
4. **Pages 환경변수 (Production, 암호화 secret)**: `ANTHROPIC_API_KEY`, `TURNSTILE_SECRET_KEY`, `DAILY_TOKEN_CAP`(예 `300000`)
5. **Pages 환경변수 (공개)**: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = 위 site key
6. Deployments → Retry/redeploy (env 적용)

- [ ] **Step 10.5: push → 배포 trigger**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git push origin main
```

- [ ] **Step 10.6: 배포 검증 (수동 QA)**

`https://totp.antmon.kr` → FAB 클릭 → 다이얼로그 → FAQ 칩 클릭(로딩+타이핑 답변) → 직접 질문 입력(Turnstile → Haiku 답변) → 주제 외 질문은 거부되는지 확인. `/api/chat` 200 + 가드 동작.

---

## Self-Review

**1. Spec coverage:**
- ✅ FAB 마스코트 위젯 (Task 7) / Anthropic 스타일 다이얼로그 (Task 8)
- ✅ 티어0 FAQ $0 + Claude풍 로딩 (Task 1, 8) / 티어1 Haiku (Task 6, 8)
- ✅ 가드: Turnstile(3,6,9) / rate limit·세션·budget kill-switch(4,6) / 주제한정·no-auth-code 프롬프트(2)
- ✅ raw fetch Haiku + prompt caching (5)
- ✅ 런타임 secret = CF env, KV 바인딩 (10.4)
- ✅ 테스트: faq/prompts/turnstile/kv/anthropic/chat (1-6)
- ⏸ 견적/triage/Telegram/PayPal = **Plan B** (의도적 범위 외 — FAQ 의 'help' 항목이 placeholder 안내)

**2. Placeholder scan:** TBD/TODO 없음. 마스코트는 의도적 placeholder(교체 명시). 모든 step 실제 코드/명령.

**3. Type 일관성:** `ChatMessage`/`FaqItem`/`ChatApiResponse`(types.ts) 일관. `KvLike`·`ChatEnv`·`handleChat`·`callAnthropic`·`verifyTurnstile`·`buildConciergeSystemPrompt` 시그니처가 정의처(3,4,5,2)와 사용처(6) 일치.

issue 없음.

---

## 관련 메모리·문서
- [[project-demo-playground]] — 같은 website/ 패턴, vitest
- [[project-phase2b-deploy-choice]] — CF Pages / totp.antmon.kr / 런타임 env
- 설계서: `docs/superpowers/specs/2026-06-02-conversion-concierge-design.md`
- 후속: Plan B (SP3 견적 triage + Telegram + PayPal Invoicing)
