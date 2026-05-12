# Firebase TOTP MFA Kit

<p align="center">
  <strong>English</strong> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.pt-BR.md">Português</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.fr.md">Français</a>
</p>

> **Firebase TOTP MFA in 10 minutes — with auditable diffs.**

shadcn-style CLI + registry source install for Next.js / Vite / CRA.
**CLI primary · Own the code · Agent-compatible (Claude Code / Codex).**

## Quick start

```bash
npx firebase-totp-mfa add next --area /admin --issuer "MyApp"
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run
# review the diff, then:
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID
cp .env.example .env.local  # fill 6 Firebase config values
pnpm dev
```

## Demo first (no Firebase config needed)

```bash
git clone https://github.com/ogus002/firebase-totp-mfa-kit
cd firebase-totp-mfa-kit
pnpm install
pnpm dev:demo
# → localhost:3000 — Demo mode (fixed credentials, real-input guard)
```

## With AI (Claude Code / Codex)

In your project, run an AI assistant and say:

> Set up Firebase TOTP MFA in this project. Use github.com/ogus002/firebase-totp-mfa-kit and run the CLI.

The assistant follows `CLAUDE.md` / `AGENTS.md` (fallback playbook) and triggers the deterministic CLI.

## Why

- **SMS cost = 0** — official Firebase TOTP, free up to 3,000 DAU on Spark plan
- **Own the code** — shadcn-style source install. Debug / customize / audit yourself. `firebase-totp-mfa update` to track upstream drift.
- **Officially backed** — Identity Platform, not custom auth
- **Recovery codes + server enforcement** — Phase 1 includes both
- **Agent-compatible** — Claude Code / Codex follow `CLAUDE.md` / `AGENTS.md` playbook; CLI is the deterministic mutation layer (LLM trust boundary)

**Use this only if you are staying on Firebase Auth.** Migrating to Clerk / Supabase / Auth.js / Stack Auth → use their native MFA. See [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) §6.

## Status

- ✅ **Phase 1 (CLI alpha) complete** — code + GCP integration verified
- 🚧 **Phase 2 (public launch readiness) in progress** — `update/diff` command, `PRODUCTION-CHECKLIST.md`, npm stub publish, validation artifact
- See [`spec.md`](spec.md) for full design (v3, 2026-05-12)
- See [`docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md`](docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md) for current Phase 2 plan
- See [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) before deploying to production

## License

MIT
