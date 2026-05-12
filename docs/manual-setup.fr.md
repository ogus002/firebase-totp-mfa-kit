# Configuration manuelle (sans CLI)

<p align="center">
  <a href="manual-setup.md">English</a> ·
  <a href="manual-setup.ko.md">한국어</a> ·
  <a href="manual-setup.ja.md">日本語</a> ·
  <a href="manual-setup.zh-CN.md">简体中文</a> ·
  <a href="manual-setup.es.md">Español</a> ·
  <a href="manual-setup.pt-BR.md">Português</a> ·
  <a href="manual-setup.de.md">Deutsch</a> ·
  <strong>Français</strong>
</p>

Si vous ne voulez pas exécuter la CLI, suivez ces étapes. Vous ferez manuellement ce que la CLI ferait automatiquement.

## 1. Installer les dépendances

```bash
npm install firebase qrcode
npm install -D @types/qrcode  # si TypeScript
```

Firebase JS SDK >= 10.6, React >= 18.

## 2. Copier le registry source

Cloner ou télécharger ce kit. Copier ces répertoires dans votre projet :

```
packages/cli/src/registry/components/  →  src/components/totp-mfa/components/
packages/cli/src/registry/hooks/       →  src/components/totp-mfa/hooks/
packages/cli/src/registry/lib/         →  src/components/totp-mfa/lib/
```

Renommer `.source.ts` → `.ts`, `.source.tsx` → `.tsx`. (La CLI le fait automatiquement)

Le fichier `.css` est copié tel quel.

## 3. Server snippet (optionnel, recommandé)

Choisir un selon votre stack et copier dans `src/server/` :

- `packages/cli/src/registry/server/express-mfa-middleware.source.ts`
- `packages/cli/src/registry/server/cloud-functions-mfa.source.ts`
- `packages/cli/src/registry/server/cloud-run-mfa.source.ts`
- `packages/cli/src/registry/server/next-route-handler-mfa.source.ts`

## 4. Intégrer dans votre app

### Next.js App Router

Créer `app/<area>/layout.tsx` :

```tsx
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { MfaGuard } from '@/components/totp-mfa/components/MfaGuard';
import { auth } from '@/lib/firebase';  // votre instance Firebase auth

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

Créer `app/<area>/login/page.tsx` — utiliser le hook `useMfaSignIn` + `<TotpSignInPrompt>`.
Créer `app/<area>/mfa-enroll/page.tsx` — utiliser `<TotpEnroll>`.

### Vite + React Router

Créer `src/components/totp-mfa/ProtectedRoute.tsx` :

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

Envelopper vos routes protégées avec `<ProtectedRoute>` dans la config du Router.

## 5. Activer TOTP sur Identity Platform

```bash
gcloud auth login
gcloud config set project YOUR-PROJECT-ID
# GET de la config actuelle :
curl "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID"
# Vérifier le bloc mfa existant. Fusionner TOTP. Puis PATCH :
curl -X PATCH "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config?updateMask=mfa" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID" \
  -H "Content-Type: application/json" \
  -d '{"mfa":{"state":"ENABLED","providerConfigs":[{"state":"ENABLED","totpProviderConfig":{"adjacentIntervals":1}}]}}'
```

Vérifier avec un autre GET. `mfa.state` doit être `ENABLED` et `providerConfigs` doit inclure `totpProviderConfig`.

## 6. Configurer `.env.local`

Copier `.env.example` et remplir les 6 valeurs Firebase config + `NEXT_PUBLIC_TOTP_ISSUER`.

## 7. Tester

Lancer votre dev server. Sign up avec email/password, vérifier l'email, puis enroll TOTP. Voir `docs/troubleshooting.md` en cas d'échec.
