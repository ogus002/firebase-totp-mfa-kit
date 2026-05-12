// MfaGuard — protected 영역 wrapper
// 사용자가 enrolledFactors 없으면 enroll page 로 redirect.
// framework-agnostic: currentPath + onNavigate props.

'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, multiFactor, type Auth, type User } from 'firebase/auth';

export interface MfaGuardProps {
  auth: Auth;
  enrollPath: string;
  loginPath: string;
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  // optional — 특정 role 만 MFA 강제하고 싶을 때 (Phase 1 simple boolean)
  requireMfa?: (user: User) => boolean;
}

export function MfaGuard(props: MfaGuardProps): JSX.Element {
  const [state, setState] = useState<'loading' | 'unauth' | 'enroll' | 'ok'>('loading');

  useEffect(() => {
    const unsub = onAuthStateChanged(props.auth, (user) => {
      if (!user) {
        setState('unauth');
        return;
      }
      const shouldRequire = props.requireMfa ? props.requireMfa(user) : true;
      if (!shouldRequire) {
        setState('ok');
        return;
      }
      const factors = multiFactor(user).enrolledFactors;
      const hasTotp = factors.some((f) => f.factorId === 'totp');
      setState(hasTotp ? 'ok' : 'enroll');
    });
    return () => unsub();
  }, [props.auth, props.requireMfa]);

  useEffect(() => {
    if (state === 'unauth' && props.currentPath !== props.loginPath) {
      props.onNavigate(props.loginPath);
    } else if (
      state === 'enroll' &&
      props.currentPath !== props.enrollPath &&
      props.currentPath !== props.loginPath
    ) {
      props.onNavigate(props.enrollPath);
    }
  }, [state, props]);

  if (state === 'loading' || state === 'unauth' || state === 'enroll') {
    return <>{props.fallback ?? null}</>;
  }
  return <>{props.children}</>;
}
