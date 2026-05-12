# Firebase TOTP MFA Kit

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.pt-BR.md">Português</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <strong>Français</strong>
</p>

> **Firebase TOTP MFA en 10 minutes — avec des diffs auditables.**

CLI style shadcn + installation source registry pour Next.js / Vite / CRA.
**CLI prioritaire · Code à vous · Compatible agents (Claude Code / Codex).**

## Quick start

```bash
npx firebase-totp-mfa add next --area /admin --issuer "MyApp"
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run
# vérifiez le diff, puis :
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID
cp .env.example .env.local  # renseignez les 6 valeurs Firebase config
pnpm dev
```

## Demo d'abord (sans Firebase config)

```bash
git clone https://github.com/ogus002/firebase-totp-mfa-kit
cd firebase-totp-mfa-kit
pnpm install
pnpm dev:demo
# → localhost:3000 — Mode Demo (credentials fixes, garde de saisie réelle)
```

## Avec une IA (Claude Code / Codex)

Dans votre projet, lancez un assistant IA et dites :

> "Configure Firebase TOTP MFA dans ce projet. Utilise github.com/ogus002/firebase-totp-mfa-kit et exécute la CLI."

L'assistant suit `CLAUDE.md` / `AGENTS.md` (playbook de compatibilité des agents) et déclenche la CLI déterministe.

## Why

- **Coût SMS = 0** — TOTP officiel Firebase, gratuit jusqu'à 3 000 DAU sur le plan Spark
- **Code à vous** — installation source style shadcn. Debug / personnalisation / audit par vous. `firebase-totp-mfa update` pour suivre le drift upstream
- **Soutenu officiellement** — Identity Platform, pas d'auth custom
- **Recovery codes + enforcement serveur** — Phase 1 inclut les deux
- **Compatible agents** — Claude Code / Codex suivent le playbook `CLAUDE.md` / `AGENTS.md` ; la CLI est la couche déterministe de mutation (frontière de confiance LLM)

**À utiliser uniquement si vous restez sur Firebase Auth.** Migration vers Clerk / Supabase / Auth.js / Stack Auth → utilisez leur MFA natif. Voir [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) §6.

## Status

- ✅ **Phase 1 (CLI alpha) terminée** — code + intégration GCP vérifiés
- 🚧 **Phase 2 (préparation du lancement public) en cours** — commande `update/diff`, `PRODUCTION-CHECKLIST.md`, publication stub npm, artefact de validation
- Design complet — [`spec.md`](spec.md) (v3, 2026-05-12)
- Plan Phase 2 actuel — [`docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md`](docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md)
- Avant le déploiement en production — [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md)

## License

MIT
