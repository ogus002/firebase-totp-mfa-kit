# Plan B — 견적 triage + Telegram 운영자 봇 + PayPal Invoicing (SP3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plan A 컨시에지의 "견적/도움 요청" 을 실제 funnel 로 연결한다 — 방문자 견적 제출 → Claude(Sonnet) 한글 triage → 운영자 Telegram 푸시 → 운영자가 모바일에서 한글 지시 → 고객에게 답변 메일(Resend) + 후결제 인보이스(PayPal Invoicing) 자동 발송.

**Architecture:** Plan A 위에 CF Pages Function 2개 추가 — `/api/quote`(triage+Telegram) 와 `/api/telegram`(운영자 webhook → draft+invoice+email). `_shared` 에 lead(KV)/telegram/resend/paypal 헬퍼. Plan A 의 `callAnthropic`(Sonnet 사용)·`verifyTurnstile`·KV rate limit 재사용. 키는 CF Pages 런타임 env. 운영자 어시스트는 human-in-the-loop.

**Tech Stack:** Cloudflare Pages Functions(Workers 런타임) / KV / Anthropic(Sonnet 4.6) / Telegram Bot API / Resend / PayPal Invoicing API(OAuth client_credentials) / React / vitest

**Source 설계서:** `docs/superpowers/specs/2026-06-02-conversion-concierge-design.md`
**선행:** Plan A (`docs/superpowers/plans/2026-06-02-concierge-plan-a-widget.md`) 완료 — `lib/concierge/*`, `functions/api/_shared/{kv,turnstile,anthropic}.ts`, `functions/api/chat.ts`, `components/concierge/*` 존재.

---

## File Structure

- Modify: `website/lib/concierge/types.ts` — `Lead`, `QuoteInput` 추가
- Modify: `website/lib/concierge/prompts.ts` — `buildTriagePrompt`, `buildDraftPrompt` 추가
- Create: `website/functions/api/_shared/lead.ts` (+ test) — KV lead 저장/조회/갱신
- Create: `website/functions/api/_shared/telegram.ts` (+ test) — sendMessage + 운영자 판별
- Create: `website/functions/api/_shared/resend.ts` (+ test) — 이메일 발송
- Create: `website/functions/api/_shared/paypal.ts` (+ test) — OAuth + invoice 생성/발송
- Create: `website/functions/api/quote.ts` (+ test) — 견적 핸들러
- Create: `website/functions/api/telegram.ts` (+ test) — 운영자 webhook 핸들러
- Create: `website/components/concierge/QuoteForm.tsx`
- Modify: `website/components/concierge/ChatDialog.tsx` — QuoteForm 연결

---

## Task 1: 타입 + triage/draft 프롬프트 (TDD)

**Files:**
- Modify: `website/lib/concierge/types.ts`
- Modify: `website/lib/concierge/prompts.ts`, `website/lib/concierge/prompts.test.ts`

- [ ] **Step 1.1: 타입 추가**

`website/lib/concierge/types.ts` 끝에 추가:
```ts
export interface QuoteInput {
  email: string;
  context: string;
  conversation?: ChatMessage[];
}

export type LeadStatus = 'new' | 'sent' | 'error';

export interface Lead {
  id: string;
  email: string;
  context: string;
  conversation: ChatMessage[];
  triage: string;
  status: LeadStatus;
  invoiceId?: string;
}
```

- [ ] **Step 1.2: 프롬프트 실패 테스트 추가**

`website/lib/concierge/prompts.test.ts` 끝에 추가:
```ts
import { buildTriagePrompt, buildDraftPrompt } from './prompts';

describe('buildTriagePrompt', () => {
  const sys = buildTriagePrompt();
  it('asks for Korean output for the operator', () => {
    expect(sys).toContain('한글');
  });
  it('asks to recommend $19 check vs consulting', () => {
    expect(sys).toContain('$19');
    expect(sys.toLowerCase()).toContain('consulting');
  });
  it('forbids writing auth code', () => {
    expect(sys.toLowerCase()).toContain('auth code');
  });
});

describe('buildDraftPrompt', () => {
  const sys = buildDraftPrompt();
  it('drafts a customer reply from the operator instruction', () => {
    expect(sys.toLowerCase()).toContain('operator');
    expect(sys.toLowerCase()).toContain('customer');
  });
  it('forbids inventing prices not given by the operator', () => {
    expect(sys.toLowerCase()).toContain('do not invent');
  });
});
```

- [ ] **Step 1.3: 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `buildTriagePrompt is not a function`

- [ ] **Step 1.4: 프롬프트 구현**

`website/lib/concierge/prompts.ts` 끝에 추가:
```ts
export function buildTriagePrompt(): string {
  return `You triage an inbound inquiry for the firebase-totp-mfa kit's paid help funnel. The OUTPUT is for the operator (a Korean solo developer) to read on their phone — write it in 한글 (Korean), concise, scannable.

Produce exactly these sections:
■ 고객 요구 요약: (1-3 sentences)
■ 적합 서비스: recommend "$19 async 보안 점검" OR "Consulting" (with one-line reason). The $19 check is a lead-gen entry; real revenue is consulting.
■ 제안 견적·범위: a rough scope and a suggested amount range (USD). This is a suggestion for the operator, not a commitment.
■ 처리 방법 리뷰: key auth-flow checkpoints, risks, and a short checklist the operator should cover.

Rules: never write auth code. Be honest about uncertainty. Do not promise anything to the customer (this is internal).`;
}

export function buildDraftPrompt(): string {
  return `You draft a customer-facing reply email on behalf of the operator, based on the operator's instruction and the lead context. 

Rules:
- Follow the operator's instruction exactly. Do NOT invent prices, scope, or commitments the operator did not state.
- Match the customer's language (reply in English unless the lead is clearly Korean).
- Be warm, concise, professional. Mention next steps. If an invoice is being sent, reference that an invoice will arrive separately (post-pay, after agreement).
- Never write auth code. Output ONLY the email body (no subject line, no preamble).`;
}
```

- [ ] **Step 1.5: 통과 + commit**

Run: `cd website && npm test` → PASS
```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/lib/concierge/types.ts website/lib/concierge/prompts.ts website/lib/concierge/prompts.test.ts
git commit -m "feat(concierge-b): lead types + triage/draft prompts"
```

---

## Task 2: lead KV 저장 헬퍼 (TDD)

**Files:**
- Create: `website/functions/api/_shared/lead.ts`, `website/functions/api/_shared/lead.test.ts`

- [ ] **Step 2.1: 실패 테스트**

`website/functions/api/_shared/lead.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockKv } from './kv';
import { newLeadId, saveLead, getLead, updateLead } from './lead';
import type { Lead } from '../../../lib/concierge/types';

let kv: ReturnType<typeof createMockKv>;
beforeEach(() => {
  kv = createMockKv();
});

function sample(id: string): Lead {
  return { id, email: 'a@b.com', context: 'help', conversation: [], triage: 't', status: 'new' };
}

describe('lead store', () => {
  it('newLeadId is short and unique-ish', () => {
    expect(newLeadId()).toMatch(/^[A-Z0-9]{6}$/);
    expect(newLeadId()).not.toBe(newLeadId());
  });
  it('saves and gets a lead', async () => {
    await saveLead(kv, sample('ABC123'));
    const l = await getLead(kv, 'ABC123');
    expect(l?.email).toBe('a@b.com');
  });
  it('returns null for unknown lead', async () => {
    expect(await getLead(kv, 'NONE00')).toBeNull();
  });
  it('updates status + invoiceId', async () => {
    await saveLead(kv, sample('ABC123'));
    const u = await updateLead(kv, 'ABC123', { status: 'sent', invoiceId: 'INV-1' });
    expect(u?.status).toBe('sent');
    expect(u?.invoiceId).toBe('INV-1');
  });
  it('update returns null for unknown', async () => {
    expect(await updateLead(kv, 'NONE00', { status: 'sent' })).toBeNull();
  });
});
```

- [ ] **Step 2.2: 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `Cannot find module './lead'`

- [ ] **Step 2.3: 구현**

`website/functions/api/_shared/lead.ts`:
```ts
import type { KvLike } from './kv';
import type { Lead } from '../../../lib/concierge/types';

const LEAD_TTL = 7 * 86400; // 7일
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function newLeadId(): string {
  const b = new Uint8Array(6);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join('');
}

export async function saveLead(kv: KvLike, lead: Lead): Promise<void> {
  await kv.put(`lead:${lead.id}`, JSON.stringify(lead), { expirationTtl: LEAD_TTL });
}

export async function getLead(kv: KvLike, id: string): Promise<Lead | null> {
  const s = await kv.get(`lead:${id}`);
  return s ? (JSON.parse(s) as Lead) : null;
}

export async function updateLead(
  kv: KvLike,
  id: string,
  patch: Partial<Lead>,
): Promise<Lead | null> {
  const cur = await getLead(kv, id);
  if (!cur) return null;
  const next = { ...cur, ...patch };
  await kv.put(`lead:${id}`, JSON.stringify(next), { expirationTtl: LEAD_TTL });
  return next;
}
```

> **Note:** `ALPHABET` 길이 32(2의 거듭제곱)라 `% 32` modulo bias 없음.

- [ ] **Step 2.4: 통과 + commit**

Run: `cd website && npm test` → PASS
```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/functions/api/_shared/lead.ts website/functions/api/_shared/lead.test.ts
git commit -m "feat(concierge-b): KV lead store helper"
```

---

## Task 3: Telegram 헬퍼 (TDD)

**Files:**
- Create: `website/functions/api/_shared/telegram.ts`, `website/functions/api/_shared/telegram.test.ts`

- [ ] **Step 3.1: 실패 테스트**

`website/functions/api/_shared/telegram.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendTelegram, isOperatorChat } from './telegram';

afterEach(() => vi.restoreAllMocks());

describe('telegram', () => {
  it('posts sendMessage to the bot API', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await sendTelegram('BOT', '999', 'hello');
    const [url, init] = spy.mock.calls[0];
    expect(String(url)).toBe('https://api.telegram.org/botBOT/sendMessage');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.chat_id).toBe('999');
    expect(body.text).toBe('hello');
  });

  it('throws on non-200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('x', { status: 400 }));
    await expect(sendTelegram('BOT', '1', 'x')).rejects.toThrow();
  });

  it('isOperatorChat matches the configured chat id', () => {
    expect(isOperatorChat({ message: { chat: { id: 999 } } }, '999')).toBe(true);
    expect(isOperatorChat({ message: { chat: { id: 5 } } }, '999')).toBe(false);
    expect(isOperatorChat({}, '999')).toBe(false);
  });
});
```

- [ ] **Step 3.2: 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `Cannot find module './telegram'`

- [ ] **Step 3.3: 구현**

`website/functions/api/_shared/telegram.ts`:
```ts
export async function sendTelegram(botToken: string, chatId: string, text: string): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  if (!res.ok) throw new Error(`telegram ${res.status}`);
}

export interface TelegramUpdate {
  message?: { chat?: { id?: number }; text?: string };
}

export function isOperatorChat(update: TelegramUpdate, operatorChatId: string): boolean {
  const id = update?.message?.chat?.id;
  return id !== undefined && String(id) === String(operatorChatId);
}
```

- [ ] **Step 3.4: 통과 + commit**

Run: `cd website && npm test` → PASS
```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/functions/api/_shared/telegram.ts website/functions/api/_shared/telegram.test.ts
git commit -m "feat(concierge-b): telegram sendMessage + operator-chat guard"
```

---

## Task 4: Resend 이메일 헬퍼 (TDD)

**Files:**
- Create: `website/functions/api/_shared/resend.ts`, `website/functions/api/_shared/resend.test.ts`

- [ ] **Step 4.1: 실패 테스트**

`website/functions/api/_shared/resend.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendEmail } from './resend';

afterEach(() => vi.restoreAllMocks());

describe('sendEmail', () => {
  it('posts to resend with auth + payload', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'e1' }), { status: 200 }),
    );
    await sendEmail('KEY', { from: 'a@b.com', to: 'c@d.com', subject: 'Hi', text: 'body' });
    const [url, init] = spy.mock.calls[0];
    expect(String(url)).toBe('https://api.resend.com/emails');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer KEY');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.to).toBe('c@d.com');
    expect(body.subject).toBe('Hi');
  });

  it('throws on non-2xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('x', { status: 422 }));
    await expect(
      sendEmail('KEY', { from: 'a@b.com', to: 'c@d.com', subject: 's', text: 't' }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 4.2: 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `Cannot find module './resend'`

- [ ] **Step 4.3: 구현**

`website/functions/api/_shared/resend.ts`:
```ts
export interface EmailOpts {
  from: string;
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(apiKey: string, opts: EmailOpts): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}`);
}
```

- [ ] **Step 4.4: 통과 + commit**

Run: `cd website && npm test` → PASS
```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/functions/api/_shared/resend.ts website/functions/api/_shared/resend.test.ts
git commit -m "feat(concierge-b): resend email helper"
```

---

## Task 5: PayPal Invoicing 헬퍼 (TDD)

**Files:**
- Create: `website/functions/api/_shared/paypal.ts`, `website/functions/api/_shared/paypal.test.ts`

> **참고:** PayPal Invoicing v2 (`/v2/invoicing/invoices` 생성 → `/{id}/send`). OAuth client_credentials. 필드명은 [developer.paypal.com/docs/invoicing](https://developer.paypal.com/docs/invoicing/) 기준 — 구현 중 최신 docs 로 한번 확인.

- [ ] **Step 5.1: 실패 테스트**

`website/functions/api/_shared/paypal.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { getPaypalToken, createAndSendInvoice } from './paypal';

afterEach(() => vi.restoreAllMocks());

describe('getPaypalToken', () => {
  it('exchanges client creds for a token (sandbox base)', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'AT' }), { status: 200 }),
    );
    const t = await getPaypalToken('CID', 'SEC', 'sandbox');
    expect(t).toBe('AT');
    const [url, init] = spy.mock.calls[0];
    expect(String(url)).toContain('api-m.sandbox.paypal.com/v1/oauth2/token');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.authorization).toMatch(/^Basic /);
  });
});

describe('createAndSendInvoice', () => {
  it('creates a draft then sends it, returns invoice id', async () => {
    const calls: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const u = String(url);
      calls.push(u);
      if (u.endsWith('/v2/invoicing/invoices')) {
        return new Response(
          JSON.stringify({ href: 'https://api-m.sandbox.paypal.com/v2/invoicing/invoices/INV2-ABCD' }),
          { status: 201 },
        );
      }
      return new Response('{}', { status: 200 }); // send
    });
    const id = await createAndSendInvoice('AT', 'sandbox', {
      email: 'c@d.com',
      amount: 300,
      currency: 'USD',
      description: 'Consulting 2h',
    });
    expect(id).toBe('INV2-ABCD');
    expect(calls.some((c) => c.endsWith('/INV2-ABCD/send'))).toBe(true);
  });

  it('throws if create fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('err', { status: 400 }));
    await expect(
      createAndSendInvoice('AT', 'sandbox', { email: 'c@d.com', amount: 1, currency: 'USD', description: 'x' }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 5.2: 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `Cannot find module './paypal'`

- [ ] **Step 5.3: 구현**

`website/functions/api/_shared/paypal.ts`:
```ts
function base(env: string): string {
  return env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

export async function getPaypalToken(
  clientId: string,
  secret: string,
  env: string,
): Promise<string> {
  const res = await fetch(`${base(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: 'Basic ' + btoa(`${clientId}:${secret}`),
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`paypal token ${res.status}`);
  const d = (await res.json()) as { access_token?: string };
  if (!d.access_token) throw new Error('paypal token missing');
  return d.access_token;
}

export interface InvoiceOpts {
  email: string;
  amount: number;
  currency: string;
  description: string;
}

export async function createAndSendInvoice(
  token: string,
  env: string,
  opts: InvoiceOpts,
): Promise<string> {
  const b = base(env);
  const createRes = await fetch(`${b}/v2/invoicing/invoices`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      detail: { currency_code: opts.currency, note: opts.description },
      primary_recipients: [{ billing_info: { email_address: opts.email } }],
      items: [
        {
          name: opts.description.slice(0, 120) || 'Consulting',
          quantity: '1',
          unit_amount: { currency_code: opts.currency, value: opts.amount.toFixed(2) },
        },
      ],
    }),
  });
  if (!createRes.ok) throw new Error(`paypal create ${createRes.status}`);
  const created = (await createRes.json()) as { href?: string; id?: string };
  const id = created.id ?? (created.href ? created.href.split('/').pop() : undefined);
  if (!id) throw new Error('paypal invoice id missing');

  const sendRes = await fetch(`${b}/v2/invoicing/invoices/${id}/send`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ send_to_recipient: true }),
  });
  if (!sendRes.ok) throw new Error(`paypal send ${sendRes.status}`);
  return id;
}
```

> **Note:** `btoa` 는 Workers 런타임 + Node 16+ vitest 에 존재.

- [ ] **Step 5.4: 통과 + commit**

Run: `cd website && npm test` → PASS
```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/functions/api/_shared/paypal.ts website/functions/api/_shared/paypal.test.ts
git commit -m "feat(concierge-b): paypal invoicing helper (oauth + create/send)"
```

---

## Task 6: /api/quote 핸들러 (TDD)

**Files:**
- Create: `website/functions/api/quote.ts`, `website/functions/api/quote.test.ts`

- [ ] **Step 6.1: 실패 테스트**

`website/functions/api/quote.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleQuote, type QuoteEnv } from './quote';
import { createMockKv } from './_shared/kv';
import { getLead } from './_shared/lead';

afterEach(() => vi.restoreAllMocks());

function env(): QuoteEnv {
  return {
    ANTHROPIC_API_KEY: 'k',
    TURNSTILE_SECRET_KEY: 'ts',
    TELEGRAM_BOT_TOKEN: 'BOT',
    TELEGRAM_OPERATOR_CHAT_ID: '999',
    CONCIERGE_KV: createMockKv(),
  };
}

function mockOk() {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const u = String(url);
    if (u.includes('siteverify')) return new Response(JSON.stringify({ success: true }), { status: 200 });
    if (u.includes('api.anthropic.com'))
      return new Response(
        JSON.stringify({ content: [{ type: 'text', text: '■ 고객 요구 요약: ...' }], usage: { input_tokens: 9, output_tokens: 7 } }),
        { status: 200 },
      );
    return new Response('{}', { status: 200 }); // telegram
  });
}

describe('handleQuote', () => {
  it('triages, stores a lead, pushes telegram, returns ok', async () => {
    mockOk();
    const e = env();
    const res = await handleQuote(
      { email: 'c@d.com', context: 'help me integrate', turnstileToken: 'tok' },
      e,
      '1.2.3.4',
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.leadId).toMatch(/^[A-Z0-9]{6}$/);
    const lead = await getLead(e.CONCIERGE_KV, body.leadId);
    expect(lead?.email).toBe('c@d.com');
    expect(lead?.triage).toContain('고객 요구 요약');
  });

  it('rejects bad turnstile with 403', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 200 }));
    const res = await handleQuote(
      { email: 'c@d.com', context: 'x', turnstileToken: 'bad' },
      env(),
      '1.2.3.4',
    );
    expect(res.status).toBe(403);
  });

  it('rejects invalid email with 400', async () => {
    const res = await handleQuote({ email: 'nope', context: 'x', turnstileToken: 'tok' }, env(), '1.2.3.4');
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 6.2: 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `Cannot find module './quote'`

- [ ] **Step 6.3: 구현**

`website/functions/api/quote.ts`:
```ts
import type { ChatMessage, Lead } from '../../lib/concierge/types';
import { buildTriagePrompt } from '../../lib/concierge/prompts';
import { verifyTurnstile } from './_shared/turnstile';
import { callAnthropic } from './_shared/anthropic';
import { type KvLike, checkAndIncrementRate } from './_shared/kv';
import { newLeadId, saveLead } from './_shared/lead';
import { sendTelegram } from './_shared/telegram';

export interface QuoteEnv {
  ANTHROPIC_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_OPERATOR_CHAT_ID: string;
  CONCIERGE_KV: KvLike;
}

interface QuoteBody {
  email: string;
  context: string;
  conversation?: ChatMessage[];
  turnstileToken?: string;
}

const TRIAGE_MODEL = 'claude-sonnet-4-6';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}

export async function handleQuote(body: QuoteBody, env: QuoteEnv, ip: string): Promise<Response> {
  if (!ip || ip === 'unknown') return json({ error: 'missing client ip' }, 400);
  const email = (body.email ?? '').trim();
  const context = (body.context ?? '').trim();
  if (!EMAIL_RE.test(email) || context.length < 5 || context.length > 4000) {
    return json({ error: 'invalid input' }, 400);
  }
  if (!body.turnstileToken) return json({ error: 'verification required' }, 400);
  if (!(await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, ip))) {
    return json({ error: 'turnstile failed' }, 403);
  }

  const rl = await checkAndIncrementRate(env.CONCIERGE_KV, `quote:${ip}`, 3, 3600);
  if (!rl.ok) return json({ error: 'rate limited' }, 429);

  const conversation = Array.isArray(body.conversation) ? body.conversation.slice(-12) : [];
  const userBlock = `Inquiry email: ${email}\n\nContext from the visitor:\n${context}\n\nPrior chat (if any):\n${conversation
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')}`;

  const triage = await callAnthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    model: TRIAGE_MODEL,
    system: buildTriagePrompt(),
    messages: [{ role: 'user', content: userBlock }],
    maxTokens: 1200,
  });

  const lead: Lead = {
    id: newLeadId(),
    email,
    context,
    conversation,
    triage: triage.text,
    status: 'new',
  };
  await saveLead(env.CONCIERGE_KV, lead);

  const tg = `🆕 견적 요청 #${lead.id}\n고객: ${email}\n\n${triage.text}\n\n— 답장 형식:\n${lead.id} | 금액(예: 300 USD, 무료면 0) | 한글 지시`;
  try {
    await sendTelegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_OPERATOR_CHAT_ID, tg);
  } catch {
    // Telegram 실패해도 lead 는 저장됨 — 조용히 무시 (운영자가 KV/로그로 복구)
  }

  return json({ ok: true, leadId: lead.id });
}

export const onRequestPost = async (context: {
  request: Request;
  env: QuoteEnv;
}): Promise<Response> => {
  let body: QuoteBody;
  try {
    body = (await context.request.json()) as QuoteBody;
  } catch {
    return json({ error: 'bad json' }, 400);
  }
  const ip = context.request.headers.get('CF-Connecting-IP') ?? 'unknown';
  try {
    return await handleQuote(body, context.env, ip);
  } catch {
    return json({ error: 'upstream error' }, 502);
  }
};
```

- [ ] **Step 6.4: 통과 + commit**

Run: `cd website && npm test` → PASS
```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/functions/api/quote.ts website/functions/api/quote.test.ts
git commit -m "feat(concierge-b): /api/quote handler (turnstile + sonnet triage + telegram)"
```

---

## Task 7: /api/telegram webhook 핸들러 (TDD)

**Files:**
- Create: `website/functions/api/telegram.ts`, `website/functions/api/telegram.test.ts`

- [ ] **Step 7.1: 실패 테스트**

`website/functions/api/telegram.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleTelegram, type TelegramEnv } from './telegram';
import { createMockKv } from './_shared/kv';
import { saveLead, getLead } from './_shared/lead';
import type { Lead } from '../../lib/concierge/types';

afterEach(() => vi.restoreAllMocks());

function env(): TelegramEnv {
  return {
    ANTHROPIC_API_KEY: 'k',
    RESEND_API_KEY: 'rs',
    OPERATOR_EMAIL: 'op@me.com',
    PAYPAL_CLIENT_ID: 'cid',
    PAYPAL_CLIENT_SECRET: 'sec',
    PAYPAL_ENV: 'sandbox',
    TELEGRAM_BOT_TOKEN: 'BOT',
    TELEGRAM_OPERATOR_CHAT_ID: '999',
    TELEGRAM_WEBHOOK_SECRET: 'whsec',
    CONCIERGE_KV: createMockKv(),
  };
}

async function seedLead(e: TelegramEnv): Promise<string> {
  const lead: Lead = { id: 'ABC123', email: 'c@d.com', context: 'help', conversation: [], triage: 't', status: 'new' };
  await saveLead(e.CONCIERGE_KV, lead);
  return lead.id;
}

function mockAll() {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const u = String(url);
    if (u.includes('api.anthropic.com'))
      return new Response(JSON.stringify({ content: [{ type: 'text', text: 'Hi, here is our plan...' }], usage: {} }), { status: 200 });
    if (u.includes('oauth2/token')) return new Response(JSON.stringify({ access_token: 'AT' }), { status: 200 });
    if (u.endsWith('/v2/invoicing/invoices'))
      return new Response(JSON.stringify({ href: 'https://x/v2/invoicing/invoices/INV2-1' }), { status: 201 });
    return new Response('{}', { status: 200 }); // send invoice, resend, telegram
  });
}

describe('handleTelegram', () => {
  it('drafts + sends email + invoice when amount > 0', async () => {
    mockAll();
    const e = env();
    await seedLead(e);
    const res = await handleTelegram(
      { message: { chat: { id: 999 }, text: 'ABC123 | 300 USD | 이렇게 답해주세요' } },
      e,
      'whsec',
    );
    expect(res.status).toBe(200);
    const lead = await getLead(e.CONCIERGE_KV, 'ABC123');
    expect(lead?.status).toBe('sent');
    expect(lead?.invoiceId).toBe('INV2-1');
  });

  it('rejects bad webhook secret with 403', async () => {
    const res = await handleTelegram({ message: { chat: { id: 999 }, text: 'x' } }, env(), 'WRONG');
    expect(res.status).toBe(403);
  });

  it('ignores non-operator chat (200, no action)', async () => {
    const res = await handleTelegram({ message: { chat: { id: 5 }, text: 'ABC123 | 0 | hi' } }, env(), 'whsec');
    expect(res.status).toBe(200);
  });

  it('no invoice when amount is 0', async () => {
    mockAll();
    const e = env();
    await seedLead(e);
    const res = await handleTelegram(
      { message: { chat: { id: 999 }, text: 'ABC123 | 0 | just reply' } },
      e,
      'whsec',
    );
    expect(res.status).toBe(200);
    const lead = await getLead(e.CONCIERGE_KV, 'ABC123');
    expect(lead?.invoiceId).toBeUndefined();
  });
});
```

- [ ] **Step 7.2: 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `Cannot find module './telegram'` (functions/api/telegram.ts)

- [ ] **Step 7.3: 구현**

`website/functions/api/telegram.ts`:
```ts
import { buildDraftPrompt } from '../../lib/concierge/prompts';
import { callAnthropic } from './_shared/anthropic';
import { type KvLike } from './_shared/kv';
import { getLead, updateLead } from './_shared/lead';
import { sendTelegram, isOperatorChat, type TelegramUpdate } from './_shared/telegram';
import { sendEmail } from './_shared/resend';
import { getPaypalToken, createAndSendInvoice } from './_shared/paypal';

export interface TelegramEnv {
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY: string;
  OPERATOR_EMAIL: string;
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_ENV: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_OPERATOR_CHAT_ID: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  CONCIERGE_KV: KvLike;
}

const DRAFT_MODEL = 'claude-sonnet-4-6';

function ok(): Response {
  return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
}

// "300 USD" → {amount:300, currency:'USD'}; "0"/"무료" → {amount:0}
function parseAmount(s: string): { amount: number; currency: string } {
  const t = s.trim();
  if (!t || /무료|free/i.test(t)) return { amount: 0, currency: 'USD' };
  const m = t.match(/([\d.]+)\s*([A-Za-z]{3})?/);
  if (!m) return { amount: 0, currency: 'USD' };
  return { amount: Number(m[1]) || 0, currency: (m[2] ?? 'USD').toUpperCase() };
}

export async function handleTelegram(
  update: TelegramUpdate,
  env: TelegramEnv,
  secretHeader: string,
): Promise<Response> {
  // 1. webhook secret
  if (secretHeader !== env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 });
  }
  // 2. 운영자 본인만 (그 외는 조용히 200)
  if (!isOperatorChat(update, env.TELEGRAM_OPERATOR_CHAT_ID)) return ok();

  const text = (update.message?.text ?? '').trim();
  const parts = text.split('|').map((p) => p.trim());
  if (parts.length < 3) {
    await safeTg(env, '형식: leadId | 금액(예: 300 USD, 무료면 0) | 한글 지시');
    return ok();
  }
  const [leadId, amountStr, ...rest] = parts;
  const instruction = rest.join(' | ');

  const lead = await getLead(env.CONCIERGE_KV, leadId);
  if (!lead) {
    await safeTg(env, `lead ${leadId} 없음 (만료됐을 수 있음)`);
    return ok();
  }

  try {
    // 3. 고객 답변 초안 (Sonnet)
    const draft = await callAnthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      model: DRAFT_MODEL,
      system: buildDraftPrompt(),
      messages: [
        {
          role: 'user',
          content: `Operator instruction: ${instruction}\n\nLead context: ${lead.context}\n\nCustomer email: ${lead.email}`,
        },
      ],
      maxTokens: 1500,
    });

    // 4. 인보이스 (금액 > 0)
    const { amount, currency } = parseAmount(amountStr);
    let invoiceId: string | undefined;
    if (amount > 0) {
      const token = await getPaypalToken(env.PAYPAL_CLIENT_ID, env.PAYPAL_CLIENT_SECRET, env.PAYPAL_ENV);
      invoiceId = await createAndSendInvoice(token, env.PAYPAL_ENV, {
        email: lead.email,
        amount,
        currency,
        description: `firebase-totp-mfa help — ${lead.id}`,
      });
    }

    // 5. 고객 메일 (Resend)
    const note = invoiceId ? '\n\nAn invoice will arrive separately (pay after we agree on scope).' : '';
    await sendEmail(env.RESEND_API_KEY, {
      from: env.OPERATOR_EMAIL,
      to: lead.email,
      subject: 'Re: your firebase-totp-mfa inquiry',
      text: draft.text + note,
    });

    await updateLead(env.CONCIERGE_KV, leadId, { status: 'sent', invoiceId });
    await safeTg(
      env,
      `✅ #${leadId} 발송 완료 → ${lead.email}${invoiceId ? ` (invoice ${invoiceId}, ${amount} ${currency})` : ' (인보이스 없음)'}`,
    );
  } catch (e) {
    await updateLead(env.CONCIERGE_KV, leadId, { status: 'error' });
    await safeTg(env, `❌ #${leadId} 처리 실패: ${(e as Error).message}`);
  }
  return ok();
}

async function safeTg(env: TelegramEnv, text: string): Promise<void> {
  try {
    await sendTelegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_OPERATOR_CHAT_ID, text);
  } catch {
    /* ignore */
  }
}

export const onRequestPost = async (context: {
  request: Request;
  env: TelegramEnv;
}): Promise<Response> => {
  const secret = context.request.headers.get('x-telegram-bot-api-secret-token') ?? '';
  let update: TelegramUpdate;
  try {
    update = (await context.request.json()) as TelegramUpdate;
  } catch {
    return new Response('bad json', { status: 400 });
  }
  return handleTelegram(update, context.env, secret);
};
```

- [ ] **Step 7.4: 통과 + commit**

Run: `cd website && npm test` → PASS (전체)
```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/functions/api/telegram.ts website/functions/api/telegram.test.ts
git commit -m "feat(concierge-b): /api/telegram webhook (draft + paypal invoice + email)"
```

---

## Task 8: QuoteForm + ChatDialog 연결

**Files:**
- Create: `website/components/concierge/QuoteForm.tsx`
- Modify: `website/components/concierge/ChatDialog.tsx`

- [ ] **Step 8.1: QuoteForm**

`website/components/concierge/QuoteForm.tsx`:
```tsx
import { useState } from 'react';

export default function QuoteForm({
  turnstileToken,
  conversation,
}: {
  turnstileToken: string;
  conversation: { role: 'user' | 'assistant'; content: string }[];
}) {
  const [email, setEmail] = useState('');
  const [context, setContext] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || context.trim().length < 5) {
      setState('error');
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, context, conversation, turnstileToken }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div className="p-4 text-sm text-slate-700">
        Thanks — we’ll review and follow up by email. No charge until we agree on scope.
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      <p className="text-sm font-medium">Request help / quote</p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Your setup and what you need help with…"
        rows={3}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />
      {state === 'error' && (
        <p className="text-xs text-red-600" role="alert">
          Check your email and add a short description.
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={state === 'sending'}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-40"
      >
        {state === 'sending' ? 'Sending…' : 'Send request'}
      </button>
      <p className="text-xs text-slate-400">A human follows up. No prepayment.</p>
    </div>
  );
}
```

- [ ] **Step 8.2: ChatDialog 에 견적 모드 연결**

`website/components/concierge/ChatDialog.tsx` 상단 import 에 추가:
```tsx
import QuoteForm from './QuoteForm';
```
`ChatDialog` 컴포넌트 상태에 추가 (다른 useState 들 옆):
```tsx
  const [showQuote, setShowQuote] = useState(false);
```
`onFaq` 함수 시작부에 'help' 항목이면 견적 폼을 띄우도록 추가 (함수 첫 줄):
```tsx
    if (id === 'help') {
      setShowQuote(true);
      return;
    }
```
그리고 렌더 부 — `<ChatMessages ... />` **다음 줄**에 견적 폼 조건부 렌더 추가:
```tsx
      {showQuote && <QuoteForm turnstileToken={tsToken} conversation={messages} />}
```

- [ ] **Step 8.3: 빌드 + commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit/website && npm test && npm run build
```
Expected: 테스트 PASS, 빌드 `Compiled successfully`
```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/components/concierge/QuoteForm.tsx website/components/concierge/ChatDialog.tsx
git commit -m "feat(concierge-b): quote form wired into chat dialog"
```

---

## Task 9: CF 셋업 + Telegram webhook + 배포 + 검증

**Files:** (CF/Telegram 콘솔 — 운영자 수동)

- [ ] **Step 9.1: 외부 계정 준비 (운영자)**
1. **Telegram Bot**: @BotFather → `/newbot` → **bot token**. 본인과 1:1 대화 시작 후, 본인 **chat id** 확인 (`https://api.telegram.org/bot<TOKEN>/getUpdates` 의 `message.chat.id`)
2. **Resend**: resend.com → API key. 발신 도메인 인증(또는 onboarding 발신 주소)
3. **PayPal**: developer.paypal.com → REST app → **Client ID / Secret** (먼저 **sandbox**)

- [ ] **Step 9.2: CF Pages 환경변수 추가 (암호화 secret)**
`firebase-totp-mfa-kit` → Settings → 환경변수(Production):
`RESEND_API_KEY`, `OPERATOR_EMAIL`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV`(=`sandbox`), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_OPERATOR_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`(임의 긴 랜덤 문자열)
(기존 `ANTHROPIC_API_KEY`, `TURNSTILE_SECRET_KEY`, `CONCIERGE_KV` 바인딩 재사용)

- [ ] **Step 9.3: push → 배포**
```bash
cd C:/Dev/firebase-totp-mfa-kit
git push origin main
```
Expected: CF 가 `/api/quote`, `/api/telegram` 함수 인식 + 배포

- [ ] **Step 9.4: Telegram webhook 등록 (운영자, 1회)**
```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://totp.antmon.kr/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```
브라우저에서 한번 열어 `{"ok":true}` 확인.

- [ ] **Step 9.5: end-to-end 검증 (sandbox)**
1. `https://totp.antmon.kr` 위젯 → FAQ "I need help integrating" → 견적 폼 → 본인 이메일+내용 제출
2. 본인 Telegram 에 triage 푸시 도착 확인
3. Telegram 으로 `<leadId> | 19 USD | 테스트 답변입니다` 회신
4. 본인 이메일에 답변 메일 + PayPal **sandbox** 인보이스 도착 확인
5. 운영 전 `PAYPAL_ENV=live` + live 자격증명으로 전환

---

## Self-Review

**1. Spec coverage (SP3):**
- ✅ 견적 → 한글 triage(Sonnet) → KV lead → Telegram 푸시 (Task 1,2,6)
- ✅ 운영자 Telegram 지시 → draft(Sonnet) → 고객 메일(Resend) + 후결제 인보이스(PayPal) (Task 3,4,5,7)
- ✅ 후결제(PayPal Invoicing, 선결제 X), 금액 0 = 메일만 (Task 7)
- ✅ 가드: Turnstile + quote rate limit (6) / webhook secret + 운영자 chat allowlist (7)
- ✅ no-auth-code(triage/draft 프롬프트) (1) / human-in-the-loop (운영자 지시 후 발송)
- ✅ QuoteForm UI 연결 (8)
- ✅ 테스트: 모든 헬퍼 + 두 핸들러 (1-7, fetch/KV mock)

**2. Placeholder scan:** TBD/TODO 없음. PayPal 필드명은 "docs 확인" 주석(의도적). 모든 step 실제 코드/명령.

**3. Type 일관성:** `Lead`/`QuoteInput`(types) 일관. `QuoteEnv`/`TelegramEnv`·`handleQuote`/`handleTelegram`·`callAnthropic`(Sonnet)·`getLead`/`saveLead`/`updateLead`·`sendTelegram`/`isOperatorChat`·`sendEmail`·`getPaypalToken`/`createAndSendInvoice` 시그니처가 정의처(2-5)와 사용처(6,7) 일치.

issue 없음.

---

## 관련 문서
- 설계서: `docs/superpowers/specs/2026-06-02-conversion-concierge-design.md`
- 선행: Plan A (`docs/superpowers/plans/2026-06-02-concierge-plan-a-widget.md`)
- [[project-phase2b-deploy-choice]] — CF Pages / 런타임 env
- PayPal Invoicing: https://developer.paypal.com/docs/invoicing/
