# Manual setup (no CLI)

If you don't want to run the CLI, follow these steps. You'll do what the CLI
would have done, manually.

## 1. Install dependencies

```bash
npm install firebase qrcode
npm install -D @types/qrcode  # if TypeScript
```

Firebase JS SDK >= 10.6, React >= 18.

## 2. Copy registry source

Clone or download this kit. Copy these directories into your project:

```
packages/cli/src/registry/components/  →  src/components/totp-mfa/components/
packages/cli/src/registry/hooks/       →  src/components/totp-mfa/hooks/
packages/cli/src/registry/lib/         →  src/components/totp-mfa/lib/
```

Rename `.source.ts` → `.ts`, `.source.tsx` → `.tsx`. (The CLI does this automatically.)

The `.css` file copies as-is.

## 3. Server snippet (optional, recommended)

Pick one based on your stack and copy to `src/server/`:

- `packages/cli/src/registry/server/express-mfa-middleware.source.ts`
- `packages/cli/src/registry/server/cloud-functions-mfa.source.ts`
- `packages/cli/src/registry/server/cloud-run-mfa.source.ts`
- `packages/cli/src/registry/server/next-route-handler-mfa.source.ts`

## 4. Wire into your app

### Next.js App Router

Create `app/<area>/layout.tsx`:

```tsx
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { MfaGuard } from '@/components/totp-mfa/components/MfaGuard';
import { auth } from '@/lib/firebase';  // your Firebase auth instance

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? '/<area>';
  return (
    <MfaGuard
      auth={auth}
      enrollPath="/<area>/mfa-enroll"
      loginPath="/<area>/login"
      currentPath={pathname}
      onNavigate={(p) => router.replace(p)}
      fallback={<div>Loading…</div>}
    >
      {children}
    </MfaGuard>
  );
}
```

Create `app/<area>/login/page.tsx` — use `useMfaSignIn` hook and `<TotpSignInPrompt>`.
Create `app/<area>/mfa-enroll/page.tsx` — use `<TotpEnroll>`.

### Vite + React Router

Create `src/components/totp-mfa/ProtectedRoute.tsx`:

```tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { MfaGuard } from '@/components/totp-mfa/components/MfaGuard';
import { auth } from '@/lib/firebase';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <MfaGuard
      auth={auth}
      enrollPath="/<area>/mfa-enroll"
      loginPath="/<area>/login"
      currentPath={location.pathname}
      onNavigate={(p) => navigate(p, { replace: true })}
      fallback={<div>Loading…</div>}
    >
      {children}
    </MfaGuard>
  );
}
```

Wrap your protected routes in `<ProtectedRoute>` inside your Router config.

## 5. Enable Identity Platform TOTP

```bash
gcloud auth login
gcloud config set project YOUR-PROJECT-ID
# GET current config:
curl "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID"
# Review existing mfa block. Merge in TOTP. Then PATCH:
curl -X PATCH "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config?updateMask=mfa" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID" \
  -H "Content-Type: application/json" \
  -d '{"mfa":{"state":"ENABLED","providerConfigs":[{"state":"ENABLED","totpProviderConfig":{"adjacentIntervals":1}}]}}'
```

Verify with another GET. `mfa.state` should be `ENABLED` and `providerConfigs`
should include `totpProviderConfig`.

## 6. Configure `.env.local`

Copy `.env.example` and fill 6 Firebase config values + `NEXT_PUBLIC_TOTP_ISSUER`.

## 7. Test

Run your dev server. Sign up with email/password, verify your email, then enroll
TOTP. See `docs/troubleshooting.md` if anything fails.
