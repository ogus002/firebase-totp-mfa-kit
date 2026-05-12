# Observability

## Event model

The kit emits typed events at every MFA lifecycle step. You wire them to your
analytics/monitoring stack.

```ts
type MfaEvent =
  | { type: 'enroll.started'; uid; at }
  | { type: 'enroll.succeeded'; uid; at; durationMs }
  | { type: 'enroll.failed'; uid; at; code; durationMs }
  | { type: 'signin.mfa_required'; uid; at }
  | { type: 'signin.mfa_verified'; uid; at }
  | { type: 'signin.mfa_failed'; uid; at; code }
  | { type: 'recovery.used'; uid; at; codeIndex }
  | { type: 'recovery.exhausted'; uid; at }
  | { type: 'admin.reset'; targetUid; adminUid; at };
```

## Wiring

Call `setMfaEventHandler` once at app startup:

```ts
// lib/mfa-observability.ts
import { setMfaEventHandler } from '@/components/totp-mfa/lib/observability';
import * as Sentry from '@sentry/nextjs';
import posthog from 'posthog-js';

setMfaEventHandler((e) => {
  // Always log
  console.log('[mfa]', e.type, e);

  // Track sign-in failure trends
  if (e.type === 'signin.mfa_failed') {
    posthog.capture('mfa_failed', { code: e.code });
  }

  // Page on lockouts
  if (e.type === 'recovery.exhausted') {
    Sentry.captureMessage('mfa.recovery.exhausted', { extra: { uid: e.uid } });
  }

  // Audit admin actions to your own log
  if (e.type === 'admin.reset') {
    fetch('/api/audit/mfa-reset', { method: 'POST', body: JSON.stringify(e) });
  }
});
```

## Suggested dashboards

| Metric | Source events | Why |
|---|---|---|
| Enrollment success rate | `enroll.succeeded / enroll.started` | Track UX regressions |
| Enrollment duration (p50/p95) | `enroll.succeeded.durationMs` | Detect Firebase latency issues |
| Sign-in MFA failure rate | `signin.mfa_failed / signin.mfa_verified` | Brute-force / clock-drift signals |
| Recovery code use rate | `recovery.used` | Anomaly = potential account takeover |
| Recovery exhaustion | `recovery.exhausted` | Page — user is locked out |

## Failure isolation

`emitMfaEvent` wraps your handler in `try/catch`. If your analytics SDK throws,
auth still works.

```ts
export function emitMfaEvent(event) {
  try { handler(event); } catch {}
}
```

Don't add awaitable handlers — they would block the auth flow. If you need
async work (HTTP send), fire-and-forget with `void`.

## What's NOT emitted

By design, the kit does not emit:

- The TOTP secret
- The 6-digit code itself
- Email or password values
- Authenticator app type (we don't know)

These would be sensitive in logs. Add your own observability if you need them
and accept the risk.
