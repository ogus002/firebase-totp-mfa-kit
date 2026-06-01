# 인터랙티브 TOTP 데모 (라이브 플레이그라운드) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** totp.antmon.kr `/demo` 에 실제 RFC-6238 TOTP MFA 전체 라이프사이클(등록 → 로그인 challenge → 복구 코드)을 100% client-side 로 체험하는 페이지를 만든다.

**Architecture:** `website/` 안에 self-contained. 순수 TOTP 로직(`lib/demo-totp.ts`)은 `otpauth` 래퍼 + vitest 단위테스트. UI 는 `components/demo/*` 의 작은 컴포넌트 + `pages/demo.tsx` 상태머신. per-session 랜덤 시크릿, Firebase·계정·백엔드 없음.

**Tech Stack:** Next.js 16 (Pages Router, static export) / React 19 / Tailwind / `otpauth` / `qrcode` / vitest

**Source 설계서:** `docs/superpowers/specs/2026-06-01-demo-playground-design.md`

---

## File Structure

- Create: `website/lib/demo-totp.ts` — 순수 TOTP 함수 (otpauth 래퍼)
- Create: `website/lib/demo-totp.test.ts` — vitest 단위테스트
- Create: `website/vitest.config.ts` — vitest 설정
- Create: `website/components/demo/CodeInput.tsx` — 공용 6자리 입력
- Create: `website/components/demo/RecoveryCodes.tsx` — 복구코드 표시+복사
- Create: `website/components/demo/Stepper.tsx` — 진행 표시
- Create: `website/components/demo/EnrollStep.tsx` — QR+검증+복구코드 발급
- Create: `website/components/demo/ChallengeStep.tsx` — authenticator/복구 탭+검증
- Create: `website/components/demo/DoneStep.tsx` — 완료+CTA
- Create: `website/pages/demo.tsx` — 상태머신 오케스트레이션
- Modify: `website/package.json` — deps + test 스크립트
- Modify: `website/components/Layout.tsx` — "Demo" nav 링크
- Modify: `website/pages/index.tsx` — "Try the live demo" CTA

---

## Task 1: 의존성 + vitest 셋업

**Files:**
- Modify: `website/package.json`
- Create: `website/vitest.config.ts`

- [ ] **Step 1.1: deps 설치 (lifecycle script 보호)**

```bash
cd C:/Dev/firebase-totp-mfa-kit/website
npm install --ignore-scripts otpauth qrcode
npm install --ignore-scripts --save-dev @types/qrcode vitest
```

Expected: `package.json` 의 dependencies 에 `otpauth`, `qrcode`; devDependencies 에 `@types/qrcode`, `vitest` 추가. lifecycle scripts 미실행.

- [ ] **Step 1.2: test 스크립트 추가**

`website/package.json` 의 `"scripts"` 에 `"test"` 한 줄 추가:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "test": "vitest run"
  },
```

- [ ] **Step 1.3: vitest 설정 작성**

`website/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
});
```

- [ ] **Step 1.4: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/package.json website/package-lock.json website/vitest.config.ts
git commit -m "chore(website): add otpauth/qrcode/vitest for demo playground"
```

---

## Task 2: demo-totp.ts — 시크릿 + URL + 검증 (TDD)

**Files:**
- Create: `website/lib/demo-totp.test.ts`
- Create: `website/lib/demo-totp.ts`

- [ ] **Step 2.1: 실패하는 테스트 작성**

`website/lib/demo-totp.test.ts`:
```ts
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
```

- [ ] **Step 2.2: 테스트 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `Failed to resolve import "./demo-totp"` (파일 없음)

- [ ] **Step 2.3: 최소 구현 작성**

`website/lib/demo-totp.ts`:
```ts
import * as OTPAuth from 'otpauth';

export const DEMO_ISSUER = 'firebase-totp-mfa (demo)';
export const DEMO_LABEL = 'demo@totp.antmon.kr';

function totpFor(secretBase32: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: DEMO_ISSUER,
    label: DEMO_LABEL,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export function createSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function buildOtpauthUrl(secretBase32: string): string {
  return totpFor(secretBase32).toString();
}

export function currentCode(secretBase32: string, timestamp?: number): string {
  return totpFor(secretBase32).generate({ timestamp });
}

export function verifyCode(
  secretBase32: string,
  code: string,
  options?: { window?: number; timestamp?: number },
): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const delta = totpFor(secretBase32).validate({
    token: code,
    window: options?.window ?? 1,
    timestamp: options?.timestamp,
  });
  return delta !== null;
}
```

- [ ] **Step 2.4: 테스트 통과 확인**

Run: `cd website && npm test`
Expected: PASS (6 tests)

- [ ] **Step 2.5: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/lib/demo-totp.ts website/lib/demo-totp.test.ts
git commit -m "feat(website): demo-totp core (secret/url/verify) with RFC-6238 tests"
```

---

## Task 3: demo-totp.ts — 복구 코드 (TDD)

**Files:**
- Modify: `website/lib/demo-totp.test.ts`
- Modify: `website/lib/demo-totp.ts`

- [ ] **Step 3.1: 실패하는 테스트 추가**

`website/lib/demo-totp.test.ts` 끝에 새 describe 블록 추가:
```ts
import {
  generateRecoveryCodes,
  isValidRecovery,
} from './demo-totp';

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
```

Note: `import { generateRecoveryCodes, isValidRecovery }` 는 파일 상단 기존 import 에 합쳐도 되고 별도 줄로 둬도 됨.

- [ ] **Step 3.2: 테스트 실패 확인**

Run: `cd website && npm test`
Expected: FAIL — `generateRecoveryCodes is not a function` 류

- [ ] **Step 3.3: 구현 추가**

`website/lib/demo-totp.ts` 끝에 추가:
```ts
// 모호한 문자(0/1/I/O) 제외한 alphabet
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomChunk(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length]).join('');
}

export function generateRecoveryCodes(count = 8): string[] {
  const codes = new Set<string>();
  while (codes.size < count) {
    codes.add(`${randomChunk(4)}-${randomChunk(4)}`);
  }
  return Array.from(codes);
}

export function normalizeRecovery(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidRecovery(
  codes: string[],
  used: string[],
  input: string,
): boolean {
  const n = normalizeRecovery(input);
  return codes.includes(n) && !used.includes(n);
}
```

- [ ] **Step 3.4: 테스트 통과 확인**

Run: `cd website && npm test`
Expected: PASS (10 tests 전체)

- [ ] **Step 3.5: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/lib/demo-totp.ts website/lib/demo-totp.test.ts
git commit -m "feat(website): demo-totp recovery codes + validation"
```

---

## Task 4: CodeInput 컴포넌트

**Files:**
- Create: `website/components/demo/CodeInput.tsx`

- [ ] **Step 4.1: 컴포넌트 작성**

`website/components/demo/CodeInput.tsx`:
```tsx
type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
  id?: string;
};

export default function CodeInput({ value, onChange, onSubmit, autoFocus, id = 'code' }: Props) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={6}
      autoFocus={autoFocus}
      className="w-full border rounded px-3 py-2 text-lg tracking-[0.4em] font-mono"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSubmit) onSubmit();
      }}
    />
  );
}
```

- [ ] **Step 4.2: 빌드 확인**

Run: `cd website && npm run build`
Expected: `Compiled successfully` (아직 사용처 없어도 컴파일 OK)

- [ ] **Step 4.3: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/components/demo/CodeInput.tsx
git commit -m "feat(website): demo CodeInput component"
```

---

## Task 5: RecoveryCodes 컴포넌트

**Files:**
- Create: `website/components/demo/RecoveryCodes.tsx`

- [ ] **Step 5.1: 컴포넌트 작성**

`website/components/demo/RecoveryCodes.tsx`:
```tsx
import { useState } from 'react';

type Props = { codes: string[] };

export default function RecoveryCodes({ codes }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = codes.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback: hidden textarea + execCommand
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* give up silently */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border rounded p-4 bg-slate-50">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm">
        {codes.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <button
        onClick={copy}
        className="mt-3 text-sm border rounded px-3 py-1.5 hover:border-slate-900"
      >
        {copied ? 'Copied ✓' : 'Copy codes'}
      </button>
    </div>
  );
}
```

- [ ] **Step 5.2: 빌드 확인**

Run: `cd website && npm run build`
Expected: `Compiled successfully`

- [ ] **Step 5.3: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/components/demo/RecoveryCodes.tsx
git commit -m "feat(website): demo RecoveryCodes component"
```

---

## Task 6: Stepper 컴포넌트

**Files:**
- Create: `website/components/demo/Stepper.tsx`

- [ ] **Step 6.1: 컴포넌트 작성**

`website/components/demo/Stepper.tsx`:
```tsx
type Step = 'enroll' | 'challenge' | 'done';

const STEPS: { key: Step; label: string }[] = [
  { key: 'enroll', label: '1. Enroll' },
  { key: 'challenge', label: '2. Sign-in' },
  { key: 'done', label: '3. Done' },
];

export default function Stepper({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="flex gap-2 mb-8 text-sm">
      {STEPS.map((s, i) => (
        <li
          key={s.key}
          className={`px-3 py-1.5 rounded ${
            i <= idx ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {s.label}
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 6.2: 빌드 확인**

Run: `cd website && npm run build`
Expected: `Compiled successfully`

- [ ] **Step 6.3: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/components/demo/Stepper.tsx
git commit -m "feat(website): demo Stepper component"
```

---

## Task 7: EnrollStep 컴포넌트

**Files:**
- Create: `website/components/demo/EnrollStep.tsx`

- [ ] **Step 7.1: 컴포넌트 작성**

`website/components/demo/EnrollStep.tsx`:
```tsx
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  buildOtpauthUrl,
  currentCode,
  verifyCode,
  generateRecoveryCodes,
} from '../../lib/demo-totp';
import CodeInput from './CodeInput';
import RecoveryCodes from './RecoveryCodes';

type Props = {
  secret: string;
  onContinue: (recoveryCodes: string[]) => void;
};

export default function EnrollStep({ secret, onContinue }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(buildOtpauthUrl(secret), { width: 220, margin: 1 }).then((url) => {
      if (!cancelled) setQr(url);
    });
    return () => {
      cancelled = true;
    };
  }, [secret]);

  const verify = () => {
    setError(null);
    if (verifyCode(secret, code)) {
      const rc = generateRecoveryCodes(8);
      setCodes(rc);
      setEnrolled(true);
    } else {
      setError('That code is not valid. Check your authenticator app and try again.');
    }
  };

  if (enrolled) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">✓ TOTP enabled</h2>
        <p className="text-slate-600 text-sm">
          Save these recovery codes — they let you sign in if you lose your device.
        </p>
        <RecoveryCodes codes={codes} />
        <button
          onClick={() => onContinue(codes)}
          className="bg-slate-900 text-white px-5 py-2.5 rounded font-medium hover:bg-slate-700"
        >
          Continue to sign-in →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Scan with your authenticator app</h2>
      <p className="text-slate-600 text-sm">
        Use Google Authenticator, Authy, 1Password, etc. Then enter the 6-digit code.
      </p>
      {qr && (
        <img src={qr} alt="TOTP QR code" width={220} height={220} className="border rounded" />
      )}
      <details className="text-sm">
        <summary className="cursor-pointer">Can&apos;t scan? Enter the key manually</summary>
        <code className="mt-2 inline-block bg-slate-100 px-2 py-1 rounded select-all break-all">
          {secret}
        </code>
      </details>
      <div className="max-w-xs">
        <label htmlFor="enroll-code" className="block text-sm font-medium mb-1">
          Authenticator code
        </label>
        <CodeInput id="enroll-code" value={code} onChange={setCode} onSubmit={verify} autoFocus />
      </div>
      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={verify}
          disabled={code.length !== 6}
          className="bg-slate-900 text-white px-5 py-2.5 rounded font-medium hover:bg-slate-700 disabled:opacity-40"
        >
          Verify &amp; enable
        </button>
        <button
          type="button"
          onClick={() => setRevealed(currentCode(secret))}
          className="text-sm text-slate-500 underline"
        >
          No app? Reveal a valid code
        </button>
      </div>
      {revealed && (
        <p className="text-sm text-slate-600">
          Current valid code: <code className="font-mono">{revealed}</code> (changes every 30s)
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 7.2: 빌드 확인**

Run: `cd website && npm run build`
Expected: `Compiled successfully`

- [ ] **Step 7.3: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/components/demo/EnrollStep.tsx
git commit -m "feat(website): demo EnrollStep (QR scan + verify + recovery)"
```

---

## Task 8: ChallengeStep 컴포넌트

**Files:**
- Create: `website/components/demo/ChallengeStep.tsx`

- [ ] **Step 8.1: 컴포넌트 작성**

`website/components/demo/ChallengeStep.tsx`:
```tsx
import { useState } from 'react';
import { verifyCode, currentCode, isValidRecovery } from '../../lib/demo-totp';
import CodeInput from './CodeInput';

type Props = {
  secret: string;
  recoveryCodes: string[];
  onPassed: () => void;
};

export default function ChallengeStep({ secret, recoveryCodes, onPassed }: Props) {
  const [tab, setTab] = useState<'totp' | 'recovery'>('totp');
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);

  const submitTotp = () => {
    setError(null);
    if (verifyCode(secret, code)) onPassed();
    else setError('Incorrect code. Use the current code from your app.');
  };

  const submitRecovery = () => {
    setError(null);
    if (isValidRecovery(recoveryCodes, [], recovery)) onPassed();
    else setError('That recovery code is not valid.');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Now sign in again</h2>
      <p className="text-slate-600 text-sm">
        Next time this user logs in, they are challenged for a second factor.
      </p>
      <div className="flex gap-2 text-sm">
        <button
          onClick={() => setTab('totp')}
          className={`px-3 py-1.5 rounded ${tab === 'totp' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
        >
          Authenticator code
        </button>
        <button
          onClick={() => setTab('recovery')}
          className={`px-3 py-1.5 rounded ${tab === 'recovery' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
        >
          Use a recovery code
        </button>
      </div>

      {tab === 'totp' ? (
        <div className="max-w-xs space-y-3">
          <CodeInput id="challenge-code" value={code} onChange={setCode} onSubmit={submitTotp} autoFocus />
          <button
            onClick={submitTotp}
            disabled={code.length !== 6}
            className="bg-slate-900 text-white px-5 py-2.5 rounded font-medium hover:bg-slate-700 disabled:opacity-40"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setRevealed(currentCode(secret))}
            className="block text-sm text-slate-500 underline"
          >
            No app? Reveal a valid code
          </button>
          {revealed && (
            <p className="text-sm text-slate-600">
              Current code: <code className="font-mono">{revealed}</code>
            </p>
          )}
        </div>
      ) : (
        <div className="max-w-xs space-y-3">
          <input
            value={recovery}
            onChange={(e) => setRecovery(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            className="w-full border rounded px-3 py-2 font-mono tracking-widest"
          />
          <button
            onClick={submitRecovery}
            className="bg-slate-900 text-white px-5 py-2.5 rounded font-medium hover:bg-slate-700"
          >
            Use recovery code
          </button>
          <p className="text-xs text-slate-500">Use one of the codes shown after enrollment.</p>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 8.2: 빌드 확인**

Run: `cd website && npm run build`
Expected: `Compiled successfully`

- [ ] **Step 8.3: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/components/demo/ChallengeStep.tsx
git commit -m "feat(website): demo ChallengeStep (authenticator + recovery tabs)"
```

---

## Task 9: DoneStep 컴포넌트

**Files:**
- Create: `website/components/demo/DoneStep.tsx`

- [ ] **Step 9.1: 컴포넌트 작성**

`website/components/demo/DoneStep.tsx`:
```tsx
import Link from 'next/link';

type Props = { onRestart: () => void };

export default function DoneStep({ onRestart }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">✓ Signed in with two-factor auth</h2>
      <p className="text-slate-600">
        That is the complete TOTP MFA flow your users get — enrollment, the QR
        code, the login challenge, and recovery codes. Add it to your own
        Next.js app in one command:
      </p>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded text-sm overflow-x-auto">
        npx firebase-totp-mfa add next --area /admin --issuer &quot;MyApp&quot;
      </pre>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/firebase-totp-mfa-setup"
          className="bg-slate-900 text-white px-5 py-2.5 rounded font-medium hover:bg-slate-700"
        >
          Read the setup guide →
        </Link>
        <button
          onClick={onRestart}
          className="border border-slate-300 px-5 py-2.5 rounded font-medium hover:border-slate-900"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 9.2: 빌드 확인**

Run: `cd website && npm run build`
Expected: `Compiled successfully`

- [ ] **Step 9.3: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/components/demo/DoneStep.tsx
git commit -m "feat(website): demo DoneStep (success + CTA)"
```

---

## Task 10: demo.tsx 페이지 (오케스트레이션)

**Files:**
- Create: `website/pages/demo.tsx`

- [ ] **Step 10.1: 페이지 작성**

> **Note:** 시크릿은 `useEffect` 에서 client-side 로만 생성한다. 수동 키(secret)가 화면에 표시되므로 SSR 에서 생성하면 hydration mismatch 가 난다. 첫 렌더는 server·client 모두 "Loading demo…" 를 출력해 mismatch 를 피한다.

`website/pages/demo.tsx`:
```tsx
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Stepper from '../components/demo/Stepper';
import EnrollStep from '../components/demo/EnrollStep';
import ChallengeStep from '../components/demo/ChallengeStep';
import DoneStep from '../components/demo/DoneStep';
import { createSecret } from '../lib/demo-totp';

type Step = 'enroll' | 'challenge' | 'done';

export default function DemoPage() {
  const [step, setStep] = useState<Step>('enroll');
  const [secret, setSecret] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  useEffect(() => {
    setSecret(createSecret());
  }, []);

  const restart = () => {
    setSecret(createSecret());
    setRecoveryCodes([]);
    setStep('enroll');
  };

  return (
    <Layout
      title="Live Firebase TOTP MFA demo — try it in your browser"
      description="Experience the full TOTP 2FA flow — scan a real QR code, verify, and use recovery codes. 100% client-side, no account needed."
    >
      <div className="mb-6 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded px-4 py-2">
        Demo — no real account or Firebase. This is the exact UX the CLI installs into your app.
      </div>
      <h1 className="text-3xl font-bold mb-2">Live TOTP MFA demo</h1>
      <p className="text-slate-600 mb-6">
        Real RFC-6238 TOTP. Scan the QR with your authenticator app and the codes genuinely verify.
      </p>
      {!secret ? (
        <p className="text-slate-500">Loading demo…</p>
      ) : (
        <>
          <Stepper current={step} />
          {step === 'enroll' && (
            <EnrollStep
              secret={secret}
              onContinue={(codes) => {
                setRecoveryCodes(codes);
                setStep('challenge');
              }}
            />
          )}
          {step === 'challenge' && (
            <ChallengeStep
              secret={secret}
              recoveryCodes={recoveryCodes}
              onPassed={() => setStep('done')}
            />
          )}
          {step === 'done' && <DoneStep onRestart={restart} />}
        </>
      )}
    </Layout>
  );
}
```

- [ ] **Step 10.2: 빌드 + export 확인**

Run: `cd website && npm run build`
Expected: Route 목록에 `/demo` 등장, `out/demo/index.html` 생성. `Compiled successfully`

- [ ] **Step 10.3: 산출물 확인**

Run: `ls website/out/demo/`
Expected: `index.html` 존재

- [ ] **Step 10.4: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/pages/demo.tsx
git commit -m "feat(website): /demo page — interactive TOTP MFA lifecycle"
```

---

## Task 11: nav + CTA 링크 추가

**Files:**
- Modify: `website/components/Layout.tsx`
- Modify: `website/pages/index.tsx`

- [ ] **Step 11.1: 헤더 nav 에 Demo 링크**

`website/components/Layout.tsx` 의 nav `<div className="flex items-center gap-5 text-sm">` 안, `Setup Guide` Link **앞에** 추가:
```tsx
              <Link
                href="/demo"
                className="text-slate-600 hover:text-slate-900"
              >
                Demo
              </Link>
```

- [ ] **Step 11.2: 홈 CTA 에 데모 버튼 (primary 로)**

`website/pages/index.tsx` 의 `<div className="mt-6 flex flex-wrap gap-3">` 안, 맨 앞에 추가:
```tsx
        <Link
          href="/demo"
          className="inline-block bg-slate-900 text-white px-5 py-2.5 rounded font-medium hover:bg-slate-700"
        >
          Try the live demo →
        </Link>
```

그리고 기존 `Read the setup guide →` Link 의 className 을 secondary(테두리) 스타일로 변경:
```tsx
        <Link
          href="/firebase-totp-mfa-setup"
          className="inline-block border border-slate-300 px-5 py-2.5 rounded font-medium hover:border-slate-900"
        >
          Read the setup guide →
        </Link>
```

- [ ] **Step 11.3: 빌드 확인**

Run: `cd website && npm run build`
Expected: `Compiled successfully`, `/demo` 포함

- [ ] **Step 11.4: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/components/Layout.tsx website/pages/index.tsx
git commit -m "feat(website): link /demo from nav + home CTA"
```

---

## Task 12: 최종 검증 + 배포

**Files:** (없음 — 검증/배포)

- [ ] **Step 12.1: 전체 테스트 + 빌드**

```bash
cd C:/Dev/firebase-totp-mfa-kit/website
npm test
npm run build
```
Expected: 테스트 10개 PASS, 빌드 `Compiled successfully`, Routes 에 `/`, `/demo`, `/firebase-totp-mfa-setup`

- [ ] **Step 12.2: 로컬 수동 QA (선택, dev 서버)**

```bash
cd website && npm run dev
```
브라우저 `http://localhost:3000/demo` 에서:
- QR 표시 → authenticator 앱으로 스캔 → 코드 입력 → "✓ TOTP enabled" + 복구코드 8개
- (앱 없으면 "Reveal a valid code" 로 코드 확인)
- Continue → challenge 에서 같은 앱 코드 또는 복구코드 → "✓ Signed in"
- Start over → 새 QR

- [ ] **Step 12.3: push (production 배포 trigger)**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git push origin main
```
Expected: Cloudflare Pages 가 main push 감지 → 빌드 → `https://totp.antmon.kr/demo/` 노출

- [ ] **Step 12.4: 배포 검증**

빌드 완료(~2분) 후 브라우저에서 `https://totp.antmon.kr/demo/` 접속 — 데모 정상 동작 확인. 헤더 "Demo" 링크 + 홈 "Try the live demo" 버튼 확인.

---

## Self-Review (writing-plans 가이드)

**1. Spec coverage:**
- ✅ 범위(등록→challenge→복구) — Task 7/8 + demo.tsx(10)
- ✅ client-side real TOTP — Task 2 (otpauth, RFC-6238)
- ✅ per-session 랜덤 시크릿 — Task 2 createSecret + Task 10 useEffect
- ✅ 복구코드 발급/사용 — Task 3 + Task 5/7/8
- ✅ "유효 코드 보기" 보조 — Task 7/8 currentCode
- ✅ 진입점(nav/홈 CTA) — Task 11
- ✅ 보안/스코프(배너, secret 미전송, CLI 미수정) — Task 10 배너 + demo 자체포함
- ✅ 테스트(RFC 벡터 결정적) — Task 2/3
- ✅ 정적 export 호환 — Task 10 hydration 회피 note + Step 10.2/10.3

**2. Placeholder scan:** TBD/TODO 없음. 모든 step 에 실제 코드/명령.

**3. Type 일관성:** 함수명 일관 — `createSecret` `buildOtpauthUrl` `currentCode` `verifyCode` `generateRecoveryCodes` `normalizeRecovery` `isValidRecovery`. 컴포넌트 props (`secret`, `onContinue(codes)`, `onPassed`, `recoveryCodes`, `onRestart`) 가 Task 7/8/9 정의와 Task 10 사용처 일치.

issue 없음.

---

## 관련 메모리
- [[project-playground-real-mode-stub]]
- [[project-phase2b-deploy-choice]] (totp.antmon.kr 배포)
- [[feedback-latest-versions]]
