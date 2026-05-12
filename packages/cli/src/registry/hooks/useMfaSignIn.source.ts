// useMfaSignIn — primary sign-in 흐름에서 multi-factor-required 처리
// 사용자 코드 패턴:
//   const { primarySignIn, verifyMfaCode, stage, hints } = useMfaSignIn();
//   await primarySignIn(() => signInWithEmailAndPassword(auth, email, password));
//   if (stage === 'mfa-required') await verifyMfaCode(code);

'use client';

import { useCallback, useState } from 'react';
import {
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  type Auth,
  type MultiFactorError,
  type MultiFactorInfo,
  type MultiFactorResolver,
  type UserCredential,
} from 'firebase/auth';
import { toMfaError, isMfaRequired } from '../lib/mfa-errors';
import { emitMfaEvent } from '../lib/observability';

export type SignInStage = 'idle' | 'authenticating' | 'mfa-required' | 'verifying' | 'success' | 'error';

export interface UseMfaSignInState {
  stage: SignInStage;
  hints: MultiFactorInfo[];
  errorCode: string | null;
  errorMessage: string | null;
}

export interface UseMfaSignInActions {
  primarySignIn: (signIn: () => Promise<UserCredential>) => Promise<UserCredential | null>;
  verifyMfaCode: (code: string, factorIndex?: number) => Promise<UserCredential | null>;
  reset: () => void;
}

export function useMfaSignIn(auth: Auth): UseMfaSignInState & UseMfaSignInActions {
  const [stage, setStage] = useState<SignInStage>('idle');
  const [hints, setHints] = useState<MultiFactorInfo[]>([]);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null);

  const reset = useCallback(() => {
    setStage('idle');
    setHints([]);
    setErrorCode(null);
    setErrorMessage(null);
    setResolver(null);
  }, []);

  const primarySignIn = useCallback(
    async (signIn: () => Promise<UserCredential>): Promise<UserCredential | null> => {
      reset();
      setStage('authenticating');
      try {
        const cred = await signIn();
        setStage('success');
        return cred;
      } catch (e: unknown) {
        if (isMfaRequired(e)) {
          const r = getMultiFactorResolver(auth, e as MultiFactorError);
          setResolver(r);
          setHints(r.hints);
          setStage('mfa-required');
          emitMfaEvent({
            type: 'signin.mfa_required',
            uid: null,
            at: new Date().toISOString(),
          });
          return null;
        }
        const err = toMfaError(e);
        setErrorCode(err.code);
        setErrorMessage(err.message);
        setStage('error');
        return null;
      }
    },
    [auth, reset],
  );

  const verifyMfaCode = useCallback(
    async (code: string, factorIndex = 0): Promise<UserCredential | null> => {
      if (!resolver) {
        setErrorMessage('No MFA challenge in progress.');
        setStage('error');
        return null;
      }
      if (!/^\d{6}$/.test(code)) {
        setErrorMessage('Enter the 6-digit code.');
        return null;
      }
      const hint = resolver.hints[factorIndex];
      if (!hint) {
        setErrorMessage('Invalid factor.');
        setStage('error');
        return null;
      }
      setStage('verifying');
      setErrorCode(null);
      setErrorMessage(null);
      try {
        const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code);
        const cred = await resolver.resolveSignIn(assertion);
        setStage('success');
        emitMfaEvent({
          type: 'signin.mfa_verified',
          uid: cred.user.uid,
          at: new Date().toISOString(),
        });
        return cred;
      } catch (e: unknown) {
        const err = toMfaError(e);
        setErrorCode(err.code);
        setErrorMessage(err.message);
        setStage('mfa-required'); // 재시도 가능
        emitMfaEvent({
          type: 'signin.mfa_failed',
          uid: null,
          at: new Date().toISOString(),
          code: err.code,
        });
        return null;
      }
    },
    [resolver],
  );

  return {
    stage,
    hints,
    errorCode,
    errorMessage,
    primarySignIn,
    verifyMfaCode,
    reset,
  };
}
