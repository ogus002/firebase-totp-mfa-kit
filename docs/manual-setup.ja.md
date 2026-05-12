# 手動セットアップ (CLI なし)

<p align="center">
  <a href="manual-setup.md">English</a> ·
  <a href="manual-setup.ko.md">한국어</a> ·
  <strong>日本語</strong> ·
  <a href="manual-setup.zh-CN.md">简体中文</a> ·
  <a href="manual-setup.es.md">Español</a> ·
  <a href="manual-setup.pt-BR.md">Português</a> ·
  <a href="manual-setup.de.md">Deutsch</a> ·
  <a href="manual-setup.fr.md">Français</a>
</p>

CLI を実行しない場合、次の手順に従ってください。CLI が自動で行う作業を手動で実施します。

## 1. 依存関係のインストール

```bash
npm install firebase qrcode
npm install -D @types/qrcode  # TypeScript の場合
```

Firebase JS SDK >= 10.6, React >= 18.

## 2. Registry source のコピー

本 kit を clone または download。次のディレクトリをご自身のプロジェクトにコピー:

```
packages/cli/src/registry/components/  →  src/components/totp-mfa/components/
packages/cli/src/registry/hooks/       →  src/components/totp-mfa/hooks/
packages/cli/src/registry/lib/         →  src/components/totp-mfa/lib/
```

`.source.ts` → `.ts`、`.source.tsx` → `.tsx` にリネーム。(CLI が自動で行います)

`.css` ファイルはそのままコピー。

## 3. Server snippet (オプション、推奨)

stack に応じて 1 つ選択し `src/server/` にコピー:

- `packages/cli/src/registry/server/express-mfa-middleware.source.ts`
- `packages/cli/src/registry/server/cloud-functions-mfa.source.ts`
- `packages/cli/src/registry/server/cloud-run-mfa.source.ts`
- `packages/cli/src/registry/server/next-route-handler-mfa.source.ts`

## 4. アプリへの組み込み

### Next.js App Router

`app/<area>/layout.tsx` を作成:

```tsx
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { MfaGuard } from '@/components/totp-mfa/components/MfaGuard';
import { auth } from '@/lib/firebase';  // ご自身の Firebase auth インスタンス

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

`app/<area>/login/page.tsx` を作成 — `useMfaSignIn` hook + `<TotpSignInPrompt>` を使用。
`app/<area>/mfa-enroll/page.tsx` を作成 — `<TotpEnroll>` を使用。

### Vite + React Router

`src/components/totp-mfa/ProtectedRoute.tsx` を作成:

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

Router config 内で保護するルートを `<ProtectedRoute>` でラップ。

## 5. Identity Platform TOTP の有効化

```bash
gcloud auth login
gcloud config set project YOUR-PROJECT-ID
# 現在の config を GET:
curl "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID"
# 既存の mfa ブロックを確認し TOTP をマージ。次に PATCH:
curl -X PATCH "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config?updateMask=mfa" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID" \
  -H "Content-Type: application/json" \
  -d '{"mfa":{"state":"ENABLED","providerConfigs":[{"state":"ENABLED","totpProviderConfig":{"adjacentIntervals":1}}]}}'
```

別の GET で確認。`mfa.state` が `ENABLED` + `providerConfigs` に `totpProviderConfig` を含むこと。

## 6. `.env.local` 設定

`.env.example` をコピーして 6 つの Firebase config 値 + `NEXT_PUBLIC_TOTP_ISSUER` を記入。

## 7. テスト

dev server を起動。email/password で sign up + email verify + TOTP enroll。失敗時は `docs/troubleshooting.md` 参照。
