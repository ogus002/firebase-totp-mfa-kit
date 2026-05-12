// Express MFA middleware
// 사용자가 자기 프로젝트로 copy-paste. firebase-admin SDK 필요 (>=11.6).
//
// 사용 예:
//   import express from 'express';
//   import { mfaRequired } from './middleware/mfa-required';
//   const app = express();
//   app.use('/api/admin', mfaRequired, adminRouter);
//
// 원칙:
// - client guard 는 보안 경계 아님 — 모든 privileged endpoint 는 server-side 검증
// - decoded.firebase.sign_in_second_factor 가 totp 인지 확인
// - mfa_factor_uid 존재 = MFA 통과 토큰

import type { NextFunction, Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      uid?: string;
      mfaFactorUid?: string;
    }
  }
}

export async function mfaRequired(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing-token' });
    return;
  }
  const idToken = header.slice('Bearer '.length).trim();
  try {
    const decoded = await getAuth().verifyIdToken(idToken, true);
    const signInAttrs = decoded.firebase?.sign_in_attributes as
      | { mfa_factor_uid?: string; sign_in_second_factor?: string }
      | undefined;
    const factorUid = signInAttrs?.mfa_factor_uid;
    const secondFactor = signInAttrs?.sign_in_second_factor;
    if (!factorUid || secondFactor !== 'totp') {
      res.status(403).json({ error: 'mfa-required', code: 'MFA_NOT_PRESENT' });
      return;
    }
    req.uid = decoded.uid;
    req.mfaFactorUid = factorUid;
    next();
  } catch (e) {
    res.status(401).json({ error: 'invalid-token' });
  }
}
