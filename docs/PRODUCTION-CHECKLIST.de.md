# Produktions-Checkliste

<p align="center">
  <a href="PRODUCTION-CHECKLIST.md">English</a> ·
  <a href="PRODUCTION-CHECKLIST.ko.md">한국어</a> ·
  <a href="PRODUCTION-CHECKLIST.ja.md">日本語</a> ·
  <a href="PRODUCTION-CHECKLIST.zh-CN.md">简体中文</a> ·
  <a href="PRODUCTION-CHECKLIST.es.md">Español</a> ·
  <a href="PRODUCTION-CHECKLIST.pt-BR.md">Português</a> ·
  <strong>Deutsch</strong> ·
  <a href="PRODUCTION-CHECKLIST.fr.md">Français</a>
</p>

> Pflichtlektüre vor dem Deploy von firebase-totp-mfa in die Produktion.

Dieses Kit befindet sich in der Alpha-Phase (Phase-2-Launch-Zeitpunkt). Diese Checkliste ist vor dem Ship verbindlich.

## 1. Pre-flight Setup-Verifikation

- [ ] Korrektes gcloud-Projekt: `gcloud config get-value project` entspricht dem beabsichtigten Projekt
- [ ] `npx firebase-totp-mfa doctor` alle Punkte green
- [ ] Alle 6 Firebase-Web-App-Config-Werte (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) in `.env.local` — NICHT in Git committen
- [ ] Mindestens 1 Test-User mit `emailVerified=true` (von der CLI via admin REST `accounts:update` gesetzt)
- [ ] `npx firebase-totp-mfa verify` 5/5 Szenarien manuell verifiziert
- [ ] `npx firebase-totp-mfa update` (dry-run) bestätigt, dass die lokale Source mit der aktuellen Kit-Version übereinstimmt

## 2. Server-Enforcement-Gate (ERFORDERLICH)

⚠️ Die Client-seitige Guard (`<MfaGuard>`) ist **keine Sicherheitsgrenze**. Folgenden Code Server-seitig erzwingen — Pflicht:

```ts
import { admin } from './firebase-admin';

const decoded = await admin.auth().verifyIdToken(idToken);
if (!decoded.firebase?.sign_in_attributes?.mfa_factor_uid) {
  throw new AppError(403, 'MFA required');
}
```

Aus den 4 Framework-Snippets in [`docs/SERVER-MFA-VERIFY.md`](SERVER-MFA-VERIFY.md) (Express / Cloud Functions / Cloud Run / Next Route Handler) den passenden für den eigenen Stack anwenden.

## 3. Recovery / Lockout

- 10 Backup-Codes (als Hash gespeichert) → Benutzer lädt herunter oder druckt
- Admin-Reset-SOP — Zwei-Personen-Zustimmung (Multisig-Muster) oder einfach `admin.deleteUser` + Neueinladung
- Details in [`docs/RECOVERY-CODES.md`](RECOVERY-CODES.md)

⚠️ Recovery-Codes verloren + Authenticator verloren = Konto dauerhaft gesperrt. Erzwungener Download-UX für Benutzer ist Pflicht.

## 4. Haftungsgrenze (Liability)

Dieses Kit steht unter **MIT-Lizenz** + **NO WARRANTY**. Folgendes zur Kenntnis nehmen:

- **shadcn-style Source Copy** → Code geht in den Besitz des Benutzers. Sicherheits-Audit-Verantwortung liegt beim Benutzer
- **Bei Firebase-API-Breaking-Changes** kann das Kit-Update verzögert eintreffen. Benutzer kontrolliert per `firebase-totp-mfa update`-Befehl
- **Wenn ein LLM (Claude / Codex) das Kit aufruft**, mutiert nur die deterministische CLI — Änderungen an der Benutzerumgebung liegen in dessen Verantwortung. Die 5 "absoluten Hard-Rules" in `CLAUDE.md` / `AGENTS.md` werden erzwungen
- **Haftung bei Breach** — der Kit-Betreiber (1 Person) trägt KEINE rechtliche Haftung für Produktions-Breaches des Benutzers. Verantwortung beim Benutzer

## 5. Support-Policy + Versions-Matrix

| Kit-Version | Firebase JS SDK | Firebase Admin SDK | Identity Platform | Status |
|---|---|---|---|---|
| 0.x (alpha) | >=10.6 <12 | >=11.6 <13 | TOTP enabled (REST) | aktuell |
| 1.x (geplant) | >=11 <13 | >=12 <14 | TOTP + Passkey-Adapter | Phase 5 |

- **GitHub Issues**: Best-Effort-Antwort 7-14 Tage (1 Betreiber)
- **Security Issues**: GitHub Security Advisory + Zusage einer Antwort innerhalb von 5 Tagen
- **Kommerzieller Vorrang-Support**: `$299 fixed-fee Firebase MFA integration review`-Service (separate Seite — Link bei Phase-2-Launch)

## 6. "Use Only If"-Disclaimer

Geeignete Benutzer für dieses Kit:

- ✅ Verwenden Firebase Auth mit E-Mail/Passwort (oder OAuth)
- ✅ Identity Platform bereits aktiviert oder Aktivierung entschieden
- ✅ React-Projekt mit Next.js / Vite / CRA / Expo (Phase 3, bedingt)
- ✅ TOTP MFA ist ausreichend (kein Warten auf Passkey bis Phase 5)

NICHT geeignete Benutzer:

- ❌ **Auth.js / NextAuth / Clerk / Supabase / Stack Auth / Better Auth** → deren natives MFA verwenden
- ❌ Custom Auth (nicht Firebase) → dieses Kit gilt nicht
- ❌ Passkey-only-Policy → auf Phase 5 warten oder Hanko / Stack Auth etc. verwenden

## 7. Sustainability-Statement

Dieses Kit wird von **1 Betreiber** gepflegt. Risiko eines Abandons wie **Lucia** (deprecated 2025-03, Burn-out nach 4 Betriebsjahren) anerkannt:

- **Phase-4-Pro-Tier-Launch** = erst gebaut nach **expliziter Anfrage von mindestens 3 zahlenden Nutzern**. Kein Vorab-Build
- **Fork empfohlen** — MIT-Lizenz. Bei Betriebseinstellung können Nutzer sich selbst pflegen
- **`update`-Befehl** ermöglicht Nutzerkontrolle selbst wenn die eigene Kopie vom Upstream divergiert. `.firebase-totp-mfa.json`-Metadata = beidseitiger Kontrollpunkt

SLA-Zusagen des Betreibers:

- Regelmäßiger Release: quartalsweise oder bei kritischen Security Issues
- Antwort: 7-14 Tage Best-Effort
- 30 Tage Voranmeldung bei Betriebseinstellung (GitHub README + npm-Package-Deprecate)

## Sign-off

Reviewer dieses Produktions-Deploys unterschreibt nach Bestätigung aller 7 Sections:

| Checked | Reviewer | Date | Notes |
|---|---|---|---|
| □ |  |  |  |
| □ |  |  |  |

— END —
