// useTotpEnroll — TOTP enrollment state machine + Firebase MFA 호출
// CLI 가 사용자 프로젝트의 firebase 위치로 import 치환.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  multiFactor,
  TotpMultiFactorGenerator,
  type TotpSecret,
  type User,
} from 'firebase/auth';
import QRCode from 'qrcode';
import { toMfaError, isRecentLoginRequired, isUnverifiedEmail } from '../lib/mfa-errors';
import { emitMfaEvent } from '../lib/observability';

export type EnrollStage = 'idle' | 'loading' | 'qr' | 'verifying' | 'done' | 'error';

export interface UseTotpEnrollOptions {
  issuer: string;
  accountLabel?: (user: User) => string;
  qrSize?: number;
  onSuccess?: () => void;
  onRequiresRecentLogin?: () => void;   // 호출 시 사용자가 signOut + redirect
  onUnverifiedEmail?: () => void;
}

export interface UseTotpEnrollState {
  stage: EnrollStage;
  qrDataUrl: string | null;
  manualKey: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface UseTotpEnrollActions {
  start: (user: User) => Promise<void>;
  verify: (code: string) => Promise<void>;
  reset: () => void;
}

export function useTotpEnroll(
  options: UseTotpEnrollOptions,
): UseTotpEnrollState & UseTotpEnrollActions {
  const [stage, setStage] = useState<EnrollStage>('idle');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ⚠️ secret 은 React state 에 두지 않는다. ref 만 사용 + verify 후 즉시 폐기.
  // (codex review §1: TotpSecret 노출 위험)
  const secretRef = useRef<TotpSecret | null>(null);
  const userRef = useRef<User | null>(null);
  const startedAtRef = useRef<number>(0);

  const reset = useCallback(() => {
    setStage('idle');
    setQrDataUrl(null);
    setManualKey(null);
    setErrorCode(null);
    setErrorMessage(null);
    secretRef.current = null;
    userRef.current = null;
  }, []);

  // Component unmount 시 secret 폐기 보장
  useEffect(() => {
    return () => {
      secretRef.current = null;
    };
  }, []);

  const start = useCallback(
    async (user: User) => {
      reset();
      setStage('loading');
      userRef.current = user;
      startedAtRef.current = Date.now();
      emitMfaEvent({ type: 'enroll.started', uid: user.uid, at: new Date().toISOString() });

      try {
        const session = await multiFactor(user).getSession();
        const secret = await TotpMultiFactorGenerator.generateSecret(session);
        secretRef.current = secret;

        const label = options.accountLabel ? options.accountLabel(user) : user.email ?? user.uid;
        const otpauthUrl = secret.generateQrCodeUrl(label, options.issuer);

        const qr = await QRCode.toDataURL(otpauthUrl, {
          width: options.qrSize ?? 240,
          margin: 1,
        });

        setQrDataUrl(qr);
        setManualKey(secret.secretKey);
        setStage('qr');
      } catch (e: unknown) {
        const err = toMfaError(e);
        setErrorCode(err.code);
        setErrorMessage(err.message);
        setStage('error');
        emitMfaEvent({
          type: 'enroll.failed',
          uid: user.uid,
          at: new Date().toISOString(),
          code: err.code,
          durationMs: Date.now() - startedAtRef.current,
        });
        if (isRecentLoginRequired(e)) options.onRequiresRecentLogin?.();
        if (isUnverifiedEmail(e)) options.onUnverifiedEmail?.();
      }
    },
    [options, reset],
  );

  const verify = useCallback(
    async (code: string) => {
      const secret = secretRef.current;
      const user = userRef.current;
      if (!secret || !user) {
        setErrorMessage('Enrollment not started.');
        setStage('error');
        return;
      }
      if (!/^\d{6}$/.test(code)) {
        setErrorMessage('Enter the 6-digit code.');
        return;
      }
      setStage('verifying');
      setErrorCode(null);
      setErrorMessage(null);

      try {
        const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code);
        await multiFactor(user).enroll(assertion, 'TOTP');
        // 성공 즉시 secret 폐기
        secretRef.current = null;
        setManualKey(null);
        setQrDataUrl(null);
        setStage('done');
        emitMfaEvent({
          type: 'enroll.succeeded',
          uid: user.uid,
          at: new Date().toISOString(),
          durationMs: Date.now() - startedAtRef.current,
        });
        options.onSuccess?.();
      } catch (e: unknown) {
        const err = toMfaError(e);
        setErrorCode(err.code);
        setErrorMessage(err.message);
        setStage('qr');
        emitMfaEvent({
          type: 'enroll.failed',
          uid: user.uid,
          at: new Date().toISOString(),
          code: err.code,
          durationMs: Date.now() - startedAtRef.current,
        });
        if (isRecentLoginRequired(e)) options.onRequiresRecentLogin?.();
      }
    },
    [options],
  );

  return {
    stage,
    qrDataUrl,
    manualKey,
    errorCode,
    errorMessage,
    start,
    verify,
    reset,
  };
}
