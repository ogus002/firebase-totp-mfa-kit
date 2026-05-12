# Configuración manual (sin CLI)

<p align="center">
  <a href="manual-setup.md">English</a> ·
  <a href="manual-setup.ko.md">한국어</a> ·
  <a href="manual-setup.ja.md">日本語</a> ·
  <a href="manual-setup.zh-CN.md">简体中文</a> ·
  <strong>Español</strong> ·
  <a href="manual-setup.pt-BR.md">Português</a> ·
  <a href="manual-setup.de.md">Deutsch</a> ·
  <a href="manual-setup.fr.md">Français</a>
</p>

Si no quieres ejecutar la CLI, sigue estos pasos. Harás manualmente lo que la CLI haría automáticamente.

## 1. Instalar dependencias

```bash
npm install firebase qrcode
npm install -D @types/qrcode  # si usas TypeScript
```

Firebase JS SDK >= 10.6, React >= 18.

## 2. Copiar el registry source

Clona o descarga este kit. Copia estos directorios a tu proyecto:

```
packages/cli/src/registry/components/  →  src/components/totp-mfa/components/
packages/cli/src/registry/hooks/       →  src/components/totp-mfa/hooks/
packages/cli/src/registry/lib/         →  src/components/totp-mfa/lib/
```

Renombra `.source.ts` → `.ts`, `.source.tsx` → `.tsx`. (La CLI lo hace automáticamente)

El archivo `.css` se copia tal cual.

## 3. Server snippet (opcional, recomendado)

Elige uno según tu stack y cópialo a `src/server/`:

- `packages/cli/src/registry/server/express-mfa-middleware.source.ts`
- `packages/cli/src/registry/server/cloud-functions-mfa.source.ts`
- `packages/cli/src/registry/server/cloud-run-mfa.source.ts`
- `packages/cli/src/registry/server/next-route-handler-mfa.source.ts`

## 4. Integrar en tu app

### Next.js App Router

Crea `app/<area>/layout.tsx`:

```tsx
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { MfaGuard } from '@/components/totp-mfa/components/MfaGuard';
import { auth } from '@/lib/firebase';  // tu instancia de Firebase auth

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

Crea `app/<area>/login/page.tsx` — usa el hook `useMfaSignIn` + `<TotpSignInPrompt>`.
Crea `app/<area>/mfa-enroll/page.tsx` — usa `<TotpEnroll>`.

### Vite + React Router

Crea `src/components/totp-mfa/ProtectedRoute.tsx`:

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

Envuelve tus rutas protegidas con `<ProtectedRoute>` dentro de la config del Router.

## 5. Activar TOTP en Identity Platform

```bash
gcloud auth login
gcloud config set project YOUR-PROJECT-ID
# GET de la config actual:
curl "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID"
# Revisa el bloque mfa existente. Fusiona TOTP. Luego PATCH:
curl -X PATCH "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config?updateMask=mfa" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID" \
  -H "Content-Type: application/json" \
  -d '{"mfa":{"state":"ENABLED","providerConfigs":[{"state":"ENABLED","totpProviderConfig":{"adjacentIntervals":1}}]}}'
```

Verifica con otro GET. `mfa.state` debe ser `ENABLED` y `providerConfigs` debe incluir `totpProviderConfig`.

## 6. Configurar `.env.local`

Copia `.env.example` y rellena los 6 valores de Firebase config + `NEXT_PUBLIC_TOTP_ISSUER`.

## 7. Probar

Arranca tu dev server. Sign up con email/password, verifica el email, luego enroll TOTP. Consulta `docs/troubleshooting.md` si algo falla.
