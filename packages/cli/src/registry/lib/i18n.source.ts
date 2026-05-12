// i18n contract — en 기본 + locale prop. 사용자가 자유롭게 override.
// CLI 가 사용자 프로젝트에 복사. 사용자가 locale 별 텍스트 추가.

export interface MfaTexts {
  // Enrollment
  enroll: {
    title: string;
    description: string;
    qrAlt: string;
    manualKeyLabel: string;
    manualKeyHint: string;
    codeLabel: string;
    codePlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    errorWrongCode: string;
    errorRecentLogin: string;
    errorUnverifiedEmail: string;
    errorGeneric: string;
    authenticatorAppHint: string;
  };
  // Sign-in prompt
  signIn: {
    title: string;
    description: string;
    codeLabel: string;
    codePlaceholder: string;
    submit: string;
    submitting: string;
    useRecovery: string;
    errorWrongCode: string;
    errorGeneric: string;
  };
  // Recovery codes
  recovery: {
    title: string;
    description: string;
    warning: string;
    download: string;
    print: string;
    generate: string;
    regenerate: string;
    submit: string;
    codeLabel: string;
    codePlaceholder: string;
    errorInvalid: string;
    errorUsed: string;
  };
  // Common
  common: {
    cancel: string;
    back: string;
    retry: string;
    contactSupport: string;
  };
}

export const en: MfaTexts = {
  enroll: {
    title: 'Set up two-factor authentication',
    description: 'Scan the QR code with your authenticator app, then enter the 6-digit code below.',
    qrAlt: 'TOTP QR code for authenticator app',
    manualKeyLabel: 'Manual setup key',
    manualKeyHint: "Use this if your phone camera can't scan the QR code.",
    codeLabel: 'Authenticator code',
    codePlaceholder: '123456',
    submit: 'Verify & Enable',
    submitting: 'Verifying…',
    success: 'Two-factor authentication enabled.',
    errorWrongCode: 'Wrong code. Check your authenticator app and try again.',
    errorRecentLogin: 'Please sign in again to continue setup.',
    errorUnverifiedEmail: 'Verify your email before enabling MFA.',
    errorGeneric: 'Something went wrong. Try again.',
    authenticatorAppHint:
      'Use Google Authenticator, 1Password, Authy, Microsoft Authenticator, or any TOTP app.',
  },
  signIn: {
    title: 'Two-factor authentication',
    description: 'Enter the 6-digit code from your authenticator app.',
    codeLabel: 'Authenticator code',
    codePlaceholder: '123456',
    submit: 'Verify',
    submitting: 'Verifying…',
    useRecovery: 'Use a recovery code instead',
    errorWrongCode: 'Wrong code. Try again.',
    errorGeneric: 'Verification failed. Try again.',
  },
  recovery: {
    title: 'Recovery codes',
    description:
      'Each code can be used once if you lose access to your authenticator app. Store them somewhere safe.',
    warning: 'These codes will only be shown once.',
    download: 'Download as .txt',
    print: 'Print',
    generate: 'Generate recovery codes',
    regenerate: 'Regenerate (invalidates old codes)',
    submit: 'Use recovery code',
    codeLabel: 'Recovery code',
    codePlaceholder: 'xxxx-xxxx-xxxx',
    errorInvalid: 'Invalid recovery code.',
    errorUsed: 'This code has already been used.',
  },
  common: {
    cancel: 'Cancel',
    back: 'Back',
    retry: 'Try again',
    contactSupport: 'Contact support',
  },
};

// 사용자가 locale override 시:
// const ko: MfaTexts = { ...en, enroll: { ...en.enroll, title: '2단계 인증 설정' } };
// <TotpEnroll texts={ko} />
//
// 또는 부분 override 만 적용하고 싶을 때:
// export function defineTexts(overrides: PartialDeep<MfaTexts>): MfaTexts {
//   return deepMerge(en, overrides);
// }
//
// 본 kit 은 기본 en 만 포함. 다국어 (ko/ja/zh 등) 는 Phase 4-5.
