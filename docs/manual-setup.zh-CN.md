# 手动设置 (无 CLI)

<p align="center">
  <a href="manual-setup.md">English</a> ·
  <a href="manual-setup.ko.md">한국어</a> ·
  <a href="manual-setup.ja.md">日本語</a> ·
  <strong>简体中文</strong> ·
  <a href="manual-setup.es.md">Español</a> ·
  <a href="manual-setup.pt-BR.md">Português</a> ·
  <a href="manual-setup.de.md">Deutsch</a> ·
  <a href="manual-setup.fr.md">Français</a>
</p>

如果不想运行 CLI,按以下步骤操作。手动完成 CLI 自动执行的工作。

## 1. 安装依赖

```bash
npm install firebase qrcode
npm install -D @types/qrcode  # 使用 TypeScript 时
```

Firebase JS SDK >= 10.6, React >= 18.

## 2. 复制 registry source

clone 或 download 本 kit。将以下目录复制到你的项目:

```
packages/cli/src/registry/components/  →  src/components/totp-mfa/components/
packages/cli/src/registry/hooks/       →  src/components/totp-mfa/hooks/
packages/cli/src/registry/lib/         →  src/components/totp-mfa/lib/
```

将 `.source.ts` → `.ts`、`.source.tsx` → `.tsx` 重命名。(CLI 自动处理)

`.css` 文件按原样复制。

## 3. Server snippet (可选、推荐)

按自己的 stack 选一个复制到 `src/server/`:

- `packages/cli/src/registry/server/express-mfa-middleware.source.ts`
- `packages/cli/src/registry/server/cloud-functions-mfa.source.ts`
- `packages/cli/src/registry/server/cloud-run-mfa.source.ts`
- `packages/cli/src/registry/server/next-route-handler-mfa.source.ts`

## 4. 接入到 app

### Next.js App Router

创建 `app/<area>/layout.tsx`:

```tsx
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { MfaGuard } from '@/components/totp-mfa/components/MfaGuard';
import { auth } from '@/lib/firebase';  // 你的 Firebase auth 实例

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

创建 `app/<area>/login/page.tsx` — 使用 `useMfaSignIn` hook + `<TotpSignInPrompt>`。
创建 `app/<area>/mfa-enroll/page.tsx` — 使用 `<TotpEnroll>`。

### Vite + React Router

创建 `src/components/totp-mfa/ProtectedRoute.tsx`:

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

在 Router config 中用 `<ProtectedRoute>` 包裹要保护的 route。

## 5. 启用 Identity Platform TOTP

```bash
gcloud auth login
gcloud config set project YOUR-PROJECT-ID
# GET 当前 config:
curl "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID"
# 检查现有 mfa 块,合并 TOTP。然后 PATCH:
curl -X PATCH "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config?updateMask=mfa" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID" \
  -H "Content-Type: application/json" \
  -d '{"mfa":{"state":"ENABLED","providerConfigs":[{"state":"ENABLED","totpProviderConfig":{"adjacentIntervals":1}}]}}'
```

用另一个 GET 验证。`mfa.state` 应为 `ENABLED` 且 `providerConfigs` 含 `totpProviderConfig`。

## 6. 配置 `.env.local`

复制 `.env.example` 并填入 6 个 Firebase config 值 + `NEXT_PUBLIC_TOTP_ISSUER`。

## 7. 测试

运行 dev server。用 email/password 注册 + verify email + enroll TOTP。如果失败请参见 `docs/troubleshooting.md`。
