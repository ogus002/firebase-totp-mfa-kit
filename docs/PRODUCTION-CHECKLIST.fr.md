# Checklist de Production

<p align="center">
  <a href="PRODUCTION-CHECKLIST.md">English</a> ·
  <a href="PRODUCTION-CHECKLIST.ko.md">한국어</a> ·
  <a href="PRODUCTION-CHECKLIST.ja.md">日本語</a> ·
  <a href="PRODUCTION-CHECKLIST.zh-CN.md">简体中文</a> ·
  <a href="PRODUCTION-CHECKLIST.es.md">Español</a> ·
  <a href="PRODUCTION-CHECKLIST.pt-BR.md">Português</a> ·
  <a href="PRODUCTION-CHECKLIST.de.md">Deutsch</a> ·
  <strong>Français</strong>
</p>

> Lecture obligatoire avant de déployer firebase-totp-mfa en production.

Ce kit est en phase alpha (au moment du Phase 2 launch). Cette checklist est obligatoire avant le ship.

## 1. Vérification de configuration préalable

- [ ] Projet gcloud correct : `gcloud config get-value project` correspond au projet souhaité
- [ ] `npx firebase-totp-mfa doctor` tous les points en green
- [ ] Les 6 valeurs Firebase Web App config (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) dans `.env.local` — NE PAS commit dans git
- [ ] Au moins 1 test user avec `emailVerified=true` (la CLI le définit via admin REST `accounts:update`)
- [ ] `npx firebase-totp-mfa verify` les 5/5 scénarios passent en vérification manuelle
- [ ] `npx firebase-totp-mfa update` (dry-run) confirme que le source local correspond à la dernière version du kit

## 2. Gate de Server Enforcement (REQUIS)

⚠️ La garde côté client (`<MfaGuard>`) **n'est pas une frontière de sécurité**. Forcer le code suivant en server-side — obligatoire :

```ts
import { admin } from './firebase-admin';

const decoded = await admin.auth().verifyIdToken(idToken);
if (!decoded.firebase?.sign_in_attributes?.mfa_factor_uid) {
  throw new AppError(403, 'MFA required');
}
```

Appliquer le snippet de [`docs/SERVER-MFA-VERIFY.md`](SERVER-MFA-VERIFY.md) (Express / Cloud Functions / Cloud Run / Next Route Handler) correspondant à votre stack.

## 3. Récupération / Verrouillage

- 10 backup codes (stockés en hash) → l'utilisateur télécharge ou imprime
- SOP de reset admin — accord de 2 personnes (motif multisig) ou simplement `admin.deleteUser` + réinvitation
- Détails dans [`docs/RECOVERY-CODES.md`](RECOVERY-CODES.md)

⚠️ Perte des recovery codes + perte de l'Authenticator = compte verrouillé définitivement. UX de téléchargement forcé utilisateur obligatoire.

## 4. Frontière de Responsabilité (Liability)

Ce kit est sous **licence MIT** + **NO WARRANTY**. Reconnaître :

- **Source copy style shadcn** → code transféré à l'utilisateur. Responsabilité d'audit sécurité = utilisateur
- **En cas de breaking change Firebase API**, l'update du kit peut être retardée. L'utilisateur contrôle via la commande `firebase-totp-mfa update`
- **Quand un LLM (Claude / Codex) invoque ce kit**, seule la CLI déterministe effectue la mutation — les changements de l'environnement utilisateur relèvent de l'utilisateur. Les 5 « absolute hard rules » de `CLAUDE.md` / `AGENTS.md` sont appliquées
- **Responsabilité en cas de breach** — l'opérateur du kit (1 personne) n'a AUCUNE responsabilité légale sur les breaches en production de l'utilisateur. Responsabilité de l'utilisateur

## 5. Politique de Support + Matrice de Versions

| Version du Kit | Firebase JS SDK | Firebase Admin SDK | Identity Platform | État |
|---|---|---|---|---|
| 0.x (alpha) | >=10.6 <12 | >=11.6 <13 | TOTP enabled (REST) | actuel |
| 1.x (prévu) | >=11 <13 | >=12 <14 | TOTP + Passkey adapter | Phase 5 |

- **GitHub issues** : réponse best-effort 7-14 jours (1 opérateur)
- **Issue de sécurité** : GitHub Security advisory + engagement de réponse sous 5 jours
- **Support commercial prioritaire** : service `$299 fixed-fee Firebase MFA integration review` (page séparée — lien au Phase 2 launch)

## 6. Disclaimer « Use Only If »

Utilisateurs adaptés à ce kit :

- ✅ Utilisez Firebase Auth avec email/password (ou OAuth)
- ✅ Identity Platform déjà activé ou décision d'activer
- ✅ Projet React en Next.js / Vite / CRA / Expo (Phase 3, conditionnel)
- ✅ TOTP MFA suffit (pas d'attente Passkey avant Phase 5)

Utilisateurs NON adaptés :

- ❌ **Auth.js / NextAuth / Clerk / Supabase / Stack Auth / Better Auth** → utilisez leur MFA natif
- ❌ Auth custom (pas Firebase) → ce kit ne s'applique pas
- ❌ Politique Passkey-only → attendre Phase 5 ou utiliser Hanko / Stack Auth etc.

## 7. Déclaration de Pérennité

Ce kit est maintenu par **1 opérateur**. Risque d'abandon de type **Lucia** (deprecated 2025-03, burn-out après 4 ans d'opération) reconnu :

- **Lancement Phase 4 Pro tier** = construit seulement après **demande explicite d'au moins 3 utilisateurs payants**. Pas de construction préalable
- **Fork recommandé** — licence MIT. En cas d'arrêt d'opération, les utilisateurs peuvent auto-maintenir
- **La commande `update`** permet à l'utilisateur de contrôler même si sa copie diverge de l'upstream. `.firebase-totp-mfa.json` metadata = point de contrôle bilatéral

Engagements SLA de l'opérateur :

- Release régulière : trimestrielle ou lors d'issue de sécurité critique
- Réponse : 7-14 jours best-effort
- Préavis de 30 jours en cas d'arrêt d'opération (GitHub README + deprecate du npm package)

## Sign-off

Le revieweur de ce déploiement de production signe après confirmation des 7 sections :

| Checked | Reviewer | Date | Notes |
|---|---|---|---|
| □ |  |  |  |
| □ |  |  |  |

— END —
