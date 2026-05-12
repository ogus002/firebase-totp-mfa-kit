// Cloud Functions v2 (https.onCall) MFA guard
// 사용자가 onCall handler 내부에서 호출.
//
// 사용 예:
//   import { onCall, HttpsError } from 'firebase-functions/v2/https';
//   import { requireMfa } from './lib/require-mfa';
//
//   export const grantAdminAccess = onCall(async (req) => {
//     const { uid, factorUid } = requireMfa(req.auth);
//     // ... privileged work ...
//   });

import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

export function requireMfa(authContext: CallableRequest['auth']): {
  uid: string;
  factorUid: string;
} {
  if (!authContext?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  const token = authContext.token as {
    firebase?: {
      sign_in_attributes?: { mfa_factor_uid?: string; sign_in_second_factor?: string };
    };
  };
  const attrs = token.firebase?.sign_in_attributes;
  const factorUid = attrs?.mfa_factor_uid;
  const secondFactor = attrs?.sign_in_second_factor;
  if (!factorUid || secondFactor !== 'totp') {
    throw new HttpsError('permission-denied', 'TOTP MFA required.', { code: 'MFA_NOT_PRESENT' });
  }
  return { uid: authContext.uid, factorUid };
}
