# 수동 셋업 (CLI 없이)

<p align="center">
  <a href="manual-setup.md">English</a> ·
  <strong>한국어</strong> ·
  <a href="manual-setup.ja.md">日本語</a> ·
  <a href="manual-setup.zh-CN.md">简体中文</a> ·
  <a href="manual-setup.es.md">Español</a> ·
  <a href="manual-setup.pt-BR.md">Português</a> ·
  <a href="manual-setup.de.md">Deutsch</a> ·
  <a href="manual-setup.fr.md">Français</a>
</p>

CLI 를 실행하지 않을 경우 다음 단계를 따르세요. CLI 가 자동 처리하는 작업을 수동으로 수행합니다.

## 1. 의존성 설치

```bash
npm install firebase qrcode
npm install -D @types/qrcode  # TypeScript 사용 시
```

Firebase JS SDK >= 10.6, React >= 18.

## 2. Registry source 복사

본 kit 을 clone 또는 download. 다음 디렉토리를 본인 프로젝트에 복사:

```
packages/cli/src/registry/components/  →  src/components/totp-mfa/components/
packages/cli/src/registry/hooks/       →  src/components/totp-mfa/hooks/
packages/cli/src/registry/lib/         →  src/components/totp-mfa/lib/
```

`.source.ts` → `.ts`, `.source.tsx` → `.tsx` rename. (CLI 가 자동 처리)

`.css` 파일은 그대로 복사.

## 3. Server snippet (선택, 권장)

stack 에 맞는 하나 선택 후 `src/server/` 에 복사:

- `packages/cli/src/registry/server/express-mfa-middleware.source.ts`
- `packages/cli/src/registry/server/cloud-functions-mfa.source.ts`
- `packages/cli/src/registry/server/cloud-run-mfa.source.ts`
- `packages/cli/src/registry/server/next-route-handler-mfa.source.ts`

## 4. App 에 연결

### Next.js App Router

`app/<area>/layout.tsx` 생성:

```tsx
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { MfaGuard } from '@/components/totp-mfa/components/MfaGuard';
import { auth } from '@/lib/firebase';  // 본인 Firebase auth 인스턴스

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

`app/<area>/login/page.tsx` 생성 — `useMfaSignIn` hook + `<TotpSignInPrompt>` 사용.
`app/<area>/mfa-enroll/page.tsx` 생성 — `<TotpEnroll>` 사용.

### Vite + React Router

`src/components/totp-mfa/ProtectedRoute.tsx` 생성:

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

Router config 내에서 보호할 route 를 `<ProtectedRoute>` 로 wrap.

## 5. Identity Platform TOTP 활성화

```bash
gcloud auth login
gcloud config set project YOUR-PROJECT-ID
# 현재 config GET:
curl "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID"
# 기존 mfa 블록 검토 후 TOTP merge. 그 다음 PATCH:
curl -X PATCH "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config?updateMask=mfa" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID" \
  -H "Content-Type: application/json" \
  -d '{"mfa":{"state":"ENABLED","providerConfigs":[{"state":"ENABLED","totpProviderConfig":{"adjacentIntervals":1}}]}}'
```

다른 GET 으로 검증. `mfa.state` 가 `ENABLED` + `providerConfigs` 에 `totpProviderConfig` 포함되어야 함.

## 6. `.env.local` 설정

`.env.example` 복사 후 6개 Firebase config 값 + `NEXT_PUBLIC_TOTP_ISSUER` 채움.

## 7. 테스트

dev server 실행. email/password 로 sign up + email verify + TOTP enroll. 실패 시 `docs/troubleshooting.md` 참조.
