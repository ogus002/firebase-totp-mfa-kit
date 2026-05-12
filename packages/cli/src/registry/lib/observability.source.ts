// Observability — TOTP MFA 이벤트 모델
// 사용자가 Sentry / PostHog / Mixpanel / 자체 analytics 와 연결.
// 본 파일은 hook factory + 기본 noop. 사용자가 자기 프로젝트에서 customize.

export type MfaEvent =
  | { type: 'enroll.started'; uid: string; at: string }
  | { type: 'enroll.succeeded'; uid: string; at: string; durationMs: number }
  | { type: 'enroll.failed'; uid: string; at: string; code: string; durationMs: number }
  | { type: 'signin.mfa_required'; uid: string | null; at: string }
  | { type: 'signin.mfa_verified'; uid: string; at: string }
  | { type: 'signin.mfa_failed'; uid: string | null; at: string; code: string }
  | { type: 'recovery.used'; uid: string; at: string; codeIndex: number }
  | { type: 'recovery.exhausted'; uid: string; at: string }
  | { type: 'admin.reset'; targetUid: string; adminUid: string; at: string };

export type MfaEventHandler = (event: MfaEvent) => void;

// 기본 noop. 사용자가 본인 프로젝트에서 교체.
let handler: MfaEventHandler = () => {};

export function setMfaEventHandler(h: MfaEventHandler): void {
  handler = h;
}

export function emitMfaEvent(event: MfaEvent): void {
  try {
    handler(event);
  } catch {
    // observability 실패가 인증 흐름 막지 않도록 swallow
  }
}

// 사용자 사용 예시 (주석):
// import * as Sentry from '@sentry/nextjs';
// setMfaEventHandler((e) => {
//   if (e.type.startsWith('signin.mfa_failed')) Sentry.captureMessage(e.type, { extra: e });
// });
