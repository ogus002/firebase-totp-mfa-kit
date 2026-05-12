// Firebase Auth MFA 에러 코드 → 사용자 친화 메시지 매핑
// CLI 가 사용자 프로젝트에 복사. 사용자가 자유롭게 커스터마이즈 / i18n.

export type MfaErrorCode =
  | 'auth/multi-factor-auth-required'
  | 'auth/multi-factor-info-not-found'
  | 'auth/invalid-verification-code'
  | 'auth/code-expired'
  | 'auth/totp-challenge-timeout'
  | 'auth/requires-recent-login'
  | 'auth/unverified-email'
  | 'auth/too-many-requests'
  | 'auth/user-disabled'
  | 'auth/network-request-failed'
  | string;

export interface MfaError {
  code: MfaErrorCode;
  message: string;
  // 'reauth' = 재로그인 필요. 'verify-email' = email verify 필요. 'retry' = 재시도. 'wait' = rate limit.
  recovery: 'reauth' | 'verify-email' | 'retry' | 'wait' | 'contact-support' | 'unknown';
}

const TABLE: Record<string, Omit<MfaError, 'code'>> = {
  'auth/multi-factor-auth-required': {
    message: 'Multi-factor authentication required.',
    recovery: 'retry',
  },
  'auth/multi-factor-info-not-found': {
    message: 'No second factor enrolled.',
    recovery: 'retry',
  },
  'auth/invalid-verification-code': {
    message: 'Wrong code. Check your authenticator app and try again.',
    recovery: 'retry',
  },
  'auth/code-expired': {
    message: 'Code expired. Generate a new one in your authenticator app.',
    recovery: 'retry',
  },
  'auth/totp-challenge-timeout': {
    message: 'TOTP challenge timed out. Sign in again.',
    recovery: 'reauth',
  },
  'auth/requires-recent-login': {
    message: 'Please sign in again to continue.',
    recovery: 'reauth',
  },
  'auth/unverified-email': {
    message: 'Please verify your email address before enabling MFA.',
    recovery: 'verify-email',
  },
  'auth/too-many-requests': {
    message: 'Too many attempts. Try again in a few minutes.',
    recovery: 'wait',
  },
  'auth/user-disabled': {
    message: 'This account has been disabled. Contact support.',
    recovery: 'contact-support',
  },
  'auth/network-request-failed': {
    message: 'Network error. Check your connection and try again.',
    recovery: 'retry',
  },
};

export function toMfaError(e: unknown): MfaError {
  const code = (e as { code?: string })?.code ?? 'unknown';
  const known = TABLE[code];
  if (known) return { code, ...known };
  const msg = (e as { message?: string })?.message ?? 'Unexpected error.';
  return { code, message: msg, recovery: 'unknown' };
}

export function isRecentLoginRequired(e: unknown): boolean {
  return (e as { code?: string })?.code === 'auth/requires-recent-login';
}

export function isUnverifiedEmail(e: unknown): boolean {
  return (e as { code?: string })?.code === 'auth/unverified-email';
}

export function isMfaRequired(e: unknown): boolean {
  return (e as { code?: string })?.code === 'auth/multi-factor-auth-required';
}
