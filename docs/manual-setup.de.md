# Manuelle Einrichtung (ohne CLI)

<p align="center">
  <a href="manual-setup.md">English</a> ·
  <a href="manual-setup.ko.md">한국어</a> ·
  <a href="manual-setup.ja.md">日本語</a> ·
  <a href="manual-setup.zh-CN.md">简体中文</a> ·
  <a href="manual-setup.es.md">Español</a> ·
  <a href="manual-setup.pt-BR.md">Português</a> ·
  <strong>Deutsch</strong> ·
  <a href="manual-setup.fr.md">Français</a>
</p>

Wenn Sie die CLI nicht ausführen möchten, folgen Sie diesen Schritten. Sie erledigen manuell, was die CLI automatisch tun würde.

## 1. Abhängigkeiten installieren

```bash
npm install firebase qrcode
npm install -D @types/qrcode  # bei TypeScript
```

Firebase JS SDK >= 10.6, React >= 18.

## 2. Registry-Source kopieren

Klonen oder downloaden Sie dieses Kit. Kopieren Sie diese Verzeichnisse in Ihr Projekt:

```
packages/cli/src/registry/components/  →  src/components/totp-mfa/components/
packages/cli/src/registry/hooks/       →  src/components/totp-mfa/hooks/
packages/cli/src/registry/lib/         →  src/components/totp-mfa/lib/
```

Benennen Sie `.source.ts` → `.ts`, `.source.tsx` → `.tsx` um. (Die CLI macht dies automatisch)

Die `.css`-Datei wird unverändert kopiert.

## 3. Server-Snippet (optional, empfohlen)

Wählen Sie eines passend zu Ihrem Stack und kopieren Sie es nach `src/server/`:

- `packages/cli/src/registry/server/express-mfa-middleware.source.ts`
- `packages/cli/src/registry/server/cloud-functions-mfa.source.ts`
- `packages/cli/src/registry/server/cloud-run-mfa.source.ts`
- `packages/cli/src/registry/server/next-route-handler-mfa.source.ts`

## 4. In Ihre App einbinden

### Next.js App Router

`app/<area>/layout.tsx` erstellen:

```tsx
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { MfaGuard } from '@/components/totp-mfa/components/MfaGuard';
import { auth } from '@/lib/firebase';  // Ihre Firebase-Auth-Instanz

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

`app/<area>/login/page.tsx` erstellen — verwenden Sie den Hook `useMfaSignIn` + `<TotpSignInPrompt>`.
`app/<area>/mfa-enroll/page.tsx` erstellen — verwenden Sie `<TotpEnroll>`.

### Vite + React Router

`src/components/totp-mfa/ProtectedRoute.tsx` erstellen:

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

Wickeln Sie Ihre geschützten Routen mit `<ProtectedRoute>` in der Router-Config ein.

## 5. Identity Platform TOTP aktivieren

```bash
gcloud auth login
gcloud config set project YOUR-PROJECT-ID
# Aktuelle Config GET:
curl "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID"
# Vorhandenen mfa-Block prüfen. TOTP einmergen. Danach PATCH:
curl -X PATCH "https://identitytoolkit.googleapis.com/admin/v2/projects/YOUR-PROJECT-ID/config?updateMask=mfa" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: YOUR-PROJECT-ID" \
  -H "Content-Type: application/json" \
  -d '{"mfa":{"state":"ENABLED","providerConfigs":[{"state":"ENABLED","totpProviderConfig":{"adjacentIntervals":1}}]}}'
```

Mit weiterem GET prüfen. `mfa.state` muss `ENABLED` sein und `providerConfigs` muss `totpProviderConfig` enthalten.

## 6. `.env.local` konfigurieren

`.env.example` kopieren und die 6 Firebase-Config-Werte + `NEXT_PUBLIC_TOTP_ISSUER` ausfüllen.

## 7. Testen

Dev-Server starten. Mit Email/Passwort registrieren, Email verifizieren, dann TOTP enroll. Bei Fehlern `docs/troubleshooting.md` konsultieren.
