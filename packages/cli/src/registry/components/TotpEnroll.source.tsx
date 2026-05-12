// TotpEnroll — TOTP enrollment UI
// 접근성: autocomplete="one-time-code", inputMode="numeric", aria-live, focus management

'use client';

import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { useTotpEnroll } from '../hooks/useTotpEnroll';
import { en, type MfaTexts } from '../lib/i18n';
import './totp.css';

export interface TotpEnrollProps {
  user: User;
  issuer: string;
  accountLabel?: (user: User) => string;
  qrSize?: number;
  onSuccess?: () => void;
  onRequiresRecentLogin?: () => void;
  onUnverifiedEmail?: () => void;
  texts?: Partial<MfaTexts['enroll']>;
  className?: string;
  autoStart?: boolean; // default true — mount 시 자동 start
}

export function TotpEnroll(props: TotpEnrollProps): JSX.Element {
  const t = { ...en.enroll, ...(props.texts ?? {}) };
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const [code, setCode] = useState('');

  const enroll = useTotpEnroll({
    issuer: props.issuer,
    accountLabel: props.accountLabel,
    qrSize: props.qrSize,
    onSuccess: props.onSuccess,
    onRequiresRecentLogin: props.onRequiresRecentLogin,
    onUnverifiedEmail: props.onUnverifiedEmail,
  });

  // mount 시 자동 start
  useEffect(() => {
    if (props.autoStart !== false && enroll.stage === 'idle') {
      void enroll.start(props.user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // QR stage 진입 시 input 자동 focus
  useEffect(() => {
    if (enroll.stage === 'qr') {
      codeInputRef.current?.focus();
    }
  }, [enroll.stage]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return;
    await enroll.verify(code);
  };

  const errorMessage = (() => {
    if (!enroll.errorMessage) return null;
    if (enroll.errorCode === 'auth/requires-recent-login') return t.errorRecentLogin;
    if (enroll.errorCode === 'auth/unverified-email') return t.errorUnverifiedEmail;
    if (enroll.errorCode === 'auth/invalid-verification-code') return t.errorWrongCode;
    return enroll.errorMessage || t.errorGeneric;
  })();

  return (
    <div className={`totp-card ${props.className ?? ''}`} role="region" aria-label={t.title}>
      <h2 className="totp-title">{t.title}</h2>
      <p className="totp-description">{t.description}</p>

      {enroll.stage === 'loading' && (
        <p className="totp-loading" aria-live="polite">
          {t.submitting}
        </p>
      )}

      {(enroll.stage === 'qr' || enroll.stage === 'verifying') && enroll.qrDataUrl && (
        <>
          <div className="totp-qr-wrap">
            <img
              src={enroll.qrDataUrl}
              alt={t.qrAlt}
              className="totp-qr"
              width={props.qrSize ?? 240}
              height={props.qrSize ?? 240}
            />
          </div>

          <p className="totp-hint">{t.authenticatorAppHint}</p>

          {enroll.manualKey && (
            <details className="totp-manual">
              <summary>{t.manualKeyLabel}</summary>
              <p className="totp-manual-hint">{t.manualKeyHint}</p>
              <code className="totp-manual-key">{enroll.manualKey}</code>
            </details>
          )}

          <form onSubmit={handleSubmit} className="totp-form">
            <label htmlFor="totp-code" className="totp-label">
              {t.codeLabel}
            </label>
            <input
              ref={codeInputRef}
              id="totp-code"
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
              aria-describedby={errorMessage ? 'totp-error' : undefined}
              aria-invalid={errorMessage ? true : false}
              className="totp-input"
            />
            <button
              type="submit"
              disabled={enroll.stage === 'verifying' || code.length !== 6}
              className="totp-button-primary"
            >
              {enroll.stage === 'verifying' ? t.submitting : t.submit}
            </button>
          </form>
        </>
      )}

      {enroll.stage === 'done' && (
        <p className="totp-success" role="status" aria-live="polite">
          {t.success}
        </p>
      )}

      {errorMessage && (
        <p id="totp-error" className="totp-error" role="alert" aria-live="assertive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
