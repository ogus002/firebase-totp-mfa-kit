// TotpSignInPrompt — sign-in 흐름의 MFA stage UI
// 사용자 코드:
//   const mfa = useMfaSignIn(auth);
//   await mfa.primarySignIn(() => signInWithEmailAndPassword(auth, email, password));
//   if (mfa.stage === 'mfa-required') return <TotpSignInPrompt mfa={mfa} onSuccess={(c) => router.push('/')} />;

'use client';

import { useEffect, useRef, useState } from 'react';
import type { UserCredential } from 'firebase/auth';
import { en, type MfaTexts } from '../lib/i18n';
import type { useMfaSignIn } from '../hooks/useMfaSignIn';
import './totp.css';

export type MfaSignInController = ReturnType<typeof useMfaSignIn>;

export interface TotpSignInPromptProps {
  mfa: MfaSignInController;
  onSuccess?: (cred: UserCredential) => void;
  onUseRecovery?: () => void;
  texts?: Partial<MfaTexts['signIn']>;
  className?: string;
}

export function TotpSignInPrompt(props: TotpSignInPromptProps): JSX.Element {
  const t = { ...en.signIn, ...(props.texts ?? {}) };
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [code, setCode] = useState('');

  // stage = 'mfa-required' 진입 시 input 자동 focus
  useEffect(() => {
    if (props.mfa.stage === 'mfa-required') {
      inputRef.current?.focus();
    }
  }, [props.mfa.stage]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return;
    const cred = await props.mfa.verifyMfaCode(code);
    if (cred) {
      setCode('');
      props.onSuccess?.(cred);
    } else {
      // 실패 — input clear + re-focus
      setCode('');
      inputRef.current?.focus();
    }
  };

  const errorMessage = (() => {
    if (!props.mfa.errorMessage) return null;
    if (props.mfa.errorCode === 'auth/invalid-verification-code') return t.errorWrongCode;
    return props.mfa.errorMessage || t.errorGeneric;
  })();

  return (
    <div className={`totp-card ${props.className ?? ''}`} role="region" aria-label={t.title}>
      <h2 className="totp-title">{t.title}</h2>
      <p className="totp-description">{t.description}</p>

      <form onSubmit={handleSubmit} className="totp-form">
        <label htmlFor="totp-mfa-code" className="totp-label">
          {t.codeLabel}
        </label>
        <input
          ref={inputRef}
          id="totp-mfa-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          minLength={6}
          required
          placeholder={t.codePlaceholder}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          aria-describedby={errorMessage ? 'totp-mfa-error' : undefined}
          aria-invalid={errorMessage ? true : false}
          className="totp-input"
        />
        <button
          type="submit"
          disabled={props.mfa.stage === 'verifying' || code.length !== 6}
          className="totp-button-primary"
        >
          {props.mfa.stage === 'verifying' ? t.submitting : t.submit}
        </button>
      </form>

      {props.onUseRecovery && (
        <button
          type="button"
          onClick={props.onUseRecovery}
          className="totp-button-link"
        >
          {t.useRecovery}
        </button>
      )}

      {errorMessage && (
        <p id="totp-mfa-error" className="totp-error" role="alert" aria-live="assertive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
