// Cloud Run Express MFA guard
// Express 와 동일 패턴. Cloud Run logging + structured 응답.
//
// 사용 예:
//   import express from 'express';
//   import { initializeApp } from 'firebase-admin/app';
//   import { mfaRequired } from './middleware/mfa-required';
//
//   initializeApp(); // Cloud Run default credential 자동
//   const app = express();
//   app.use(express.json());
//   app.use('/api/admin', mfaRequired);
//   app.listen(Number(process.env.PORT) || 8080);

import type { NextFunction, Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';

export async function mfaRequired(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    // Cloud Run structured logging
    console.log(JSON.stringify({ severity: 'WARNING', message: 'mfa-required: missing token', path: req.path }));
    res.status(401).json({ error: 'missing-token' });
    return;
  }
  const idToken = header.slice('Bearer '.length).trim();
  try {
    const decoded = await getAuth().verifyIdToken(idToken, true);
    const attrs = decoded.firebase?.sign_in_attributes as
      | { mfa_factor_uid?: string; sign_in_second_factor?: string }
      | undefined;
    if (!attrs?.mfa_factor_uid || attrs.sign_in_second_factor !== 'totp') {
      console.log(JSON.stringify({
        severity: 'WARNING',
        message: 'mfa-required: token without TOTP MFA',
        path: req.path,
        uid: decoded.uid,
      }));
      res.status(403).json({ error: 'mfa-required', code: 'MFA_NOT_PRESENT' });
      return;
    }
    (req as Request & { uid: string; mfaFactorUid: string }).uid = decoded.uid;
    (req as Request & { uid: string; mfaFactorUid: string }).mfaFactorUid = attrs.mfa_factor_uid;
    next();
  } catch (e) {
    console.log(JSON.stringify({
      severity: 'ERROR',
      message: 'mfa-required: verifyIdToken failed',
      error: (e as Error).message,
    }));
    res.status(401).json({ error: 'invalid-token' });
  }
}
