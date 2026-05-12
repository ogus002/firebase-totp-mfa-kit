// Next.js App Router Route Handler MFA guard
// 사용자 코드:
//   // app/api/admin/route.ts
//   import { NextResponse } from 'next/server';
//   import { requireMfa } from '@/lib/require-mfa';
//
//   export async function POST(req: Request) {
//     const guard = await requireMfa(req);
//     if (!guard.ok) return guard.response;
//     // ... privileged work using guard.uid ...
//   }

import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';

export type MfaGuardResult =
  | { ok: true; uid: string; factorUid: string }
  | { ok: false; response: NextResponse };

export async function requireMfa(req: Request): Promise<MfaGuardResult> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return { ok: false, response: NextResponse.json({ error: 'missing-token' }, { status: 401 }) };
  }
  const idToken = header.slice('Bearer '.length).trim();
  try {
    const decoded = await getAuth().verifyIdToken(idToken, true);
    const attrs = decoded.firebase?.sign_in_attributes as
      | { mfa_factor_uid?: string; sign_in_second_factor?: string }
      | undefined;
    if (!attrs?.mfa_factor_uid || attrs.sign_in_second_factor !== 'totp') {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'mfa-required', code: 'MFA_NOT_PRESENT' },
          { status: 403 },
        ),
      };
    }
    return { ok: true, uid: decoded.uid, factorUid: attrs.mfa_factor_uid };
  } catch (e) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'invalid-token' }, { status: 401 }),
    };
  }
}
