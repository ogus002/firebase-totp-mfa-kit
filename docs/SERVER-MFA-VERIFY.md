# Server-side MFA verification

**Client guards are not security boundaries.** Every privileged endpoint must
verify the user's ID token contains a TOTP MFA factor.

## The check

After `firebase-admin verifyIdToken`, inspect:

- `decoded.firebase.sign_in_attributes.sign_in_second_factor === 'totp'`
- `decoded.firebase.sign_in_attributes.mfa_factor_uid` is present

If either is missing, reject the request with HTTP 403.

## Add to your project

Use `firebase-totp-mfa add` with `--server`:

```
npx firebase-totp-mfa add next --area /admin --issuer "MyApp" --server express
```

Replace `express` with one of:

- `express` — generic Express middleware
- `cloud-functions` — Cloud Functions v2 `onCall` guard
- `cloud-run` — Cloud Run Express with structured logging
- `next-route-handler` — Next.js App Router

The CLI copies the snippet into `src/server/` (Cloud Functions uses your `functions/` dir).

## Express

```ts
// src/server/express-mfa-middleware.ts (copied by the CLI)
app.use('/api/admin', mfaRequired, adminRouter);
```

Returns `401` on missing/invalid token. Returns `403 { code: 'MFA_NOT_PRESENT' }` on
tokens without a TOTP factor.

## Cloud Functions

```ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { requireMfa } from './lib/require-mfa';

export const grantAdminAccess = onCall(async (req) => {
  const { uid } = requireMfa(req.auth);
  // ... privileged work ...
});
```

## Cloud Run

Same Express pattern, with structured Cloud Run logs. The snippet emits
`{ severity, message, path, uid }` JSON so Cloud Logging classifies events.

## Next.js Route Handler

```ts
// app/api/admin/route.ts
import { requireMfa } from '@/lib/require-mfa';

export async function POST(req: Request) {
  const guard = await requireMfa(req);
  if (!guard.ok) return guard.response;
  // ... privileged work using guard.uid ...
}
```

## Performance

Each verify involves a token signature check and a JWKS lookup (cached).
Typical cost: 1-3ms after the first request. Don't disable token revocation
checks (`verifyIdToken(token, true)`) for privileged endpoints.

## Don't forget Firestore Rules

Same principle for Firestore Security Rules:

```
match /admin/{doc} {
  allow read, write: if request.auth != null
    && request.auth.token.firebase.sign_in_attributes.sign_in_second_factor == 'totp';
}
```

This is the second line of defense if your API server is bypassed.
