# Setup manual (sem CLI)

<p align="center">
  <a href="manual-setup.md">English</a> ·
  <a href="manual-setup.ko.md">한국어</a> ·
  <a href="manual-setup.ja.md">日本語</a> ·
  <a href="manual-setup.zh-CN.md">简体中文</a> ·
  <a href="manual-setup.es.md">Español</a> ·
  <strong>Português</strong> ·
  <a href="manual-setup.de.md">Deutsch</a> ·
  <a href="manual-setup.fr.md">Français</a>
</p>

Se não quiser rodar a CLI, siga estes passos. Você fará manualmente o que a CLI faria automaticamente.

## 1. Instalar dependências

```bash
npm install firebase qrcode
npm install -D @types/qrcode  # se usar TypeScript
```

Firebase JS SDK >= 10.6, React >= 18.

## 2. Copiar o registry source

Clone ou baixe este kit. Copie estes diretórios para o seu projeto:

```
packages/cli/src/registry/components/  →  src/components/totp-mfa/components/
packages/cli/src/registry/hooks/       →  src/components/totp-mfa/hooks/
packages/cli/src/registry/lib/         →  src/components/totp-mfa/lib/
```

Renomeie `.source.ts` → `.ts`, `.source.tsx` → `.tsx`. (A CLI faz automaticamente)

O arquivo `.css` é copiado como está.

## 3. Server snippet (opcional, recomendado)

Escolha um conforme seu stack e copie para `src/server/`:

- `packages/cli/src/registry/server/express-mfa-middleware.source.ts`
- `packages/cli/src/registry/server/cloud-functions-mfa.source.ts`
- `packages/cli/src/registry/server/cloud-run-mfa.source.ts`
- `packages/cli/src/registry/server/next-route-handler-mfa.source.ts`

## 4. Integrar ao seu app

### Next.js App Router

Crie `app/<area>/layout.tsx`:

```tsx
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { MfaGuard } from '@/components/totp-mfa/components/MfaGuard';
import { auth } from '@/lib/firebase';  // sua instância de Firebase auth

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

Crie `app/<area>/login/page.tsx` — use o hook `useMfaSignIn` + `<TotpSignInPrompt>`.
Crie `app/<area>/mfa-enroll/page.tsx` — use `<TotpEnroll>`.

### Vite + React Router

Crie `src/components/totp-mfa/ProtectedRoute.tsx`:

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

Envolva suas rotas protegidas com `<ProtectedRoute>` dentro da config do Router.

## 5. Ativar TOTP no Identity Platform

```bash
gcloud auth login
gcloud config set project YOUR-PROJECT-ID
# GET da config atual:
curl "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID"
# Revise o bloco mfa existente. Faça merge de TOTP. Depois PATCH:
curl -X PATCH "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config?updateMask=mfa" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID" \
  -H "Content-Type: application/json" \
  -d '{"mfa":{"state":"ENABLED","providerConfigs":[{"state":"ENABLED","totpProviderConfig":{"adjacentIntervals":1}}]}}'
```

Valide com outro GET. `mfa.state` deve ser `ENABLED` e `providerConfigs` deve incluir `totpProviderConfig`.

## 6. Configurar `.env.local`

Copie `.env.example` e preencha os 6 valores de Firebase config + `NEXT_PUBLIC_TOTP_ISSUER`.

## 7. Testar

Suba seu dev server. Sign up com email/password, verifique o email, então enroll TOTP. Consulte `docs/troubleshooting.md` se algo falhar.
