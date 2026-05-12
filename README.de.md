# Firebase TOTP MFA Kit

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.pt-BR.md">Português</a> ·
  <strong>Deutsch</strong> ·
  <a href="README.fr.md">Français</a>
</p>

> **Firebase TOTP MFA in 10 Minuten — mit auditierbaren Diffs.**

shadcn-style CLI + Registry-Source-Installation für Next.js / Vite / CRA.
**CLI zuerst · Eigener Code · Agent-kompatibel (Claude Code / Codex).**

## Quick start

```bash
npx firebase-totp-mfa add next --area /admin --issuer "MyApp"
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run
# Diff prüfen, dann:
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID
cp .env.example .env.local  # 6 Firebase-Config-Werte eintragen
pnpm dev
```

## Demo zuerst (kein Firebase-Config nötig)

```bash
git clone https://github.com/ogus002/firebase-totp-mfa-kit
cd firebase-totp-mfa-kit
pnpm install
pnpm dev:demo
# → localhost:3000 — Demo-Modus (feste Credentials, Schutz vor echter Eingabe)
```

## Mit KI (Claude Code / Codex)

In Ihrem Projekt einen KI-Assistenten starten und sagen:

> "Richte Firebase TOTP MFA in diesem Projekt ein. Verwende github.com/ogus002/firebase-totp-mfa-kit und führe die CLI aus."

Der Assistent folgt `CLAUDE.md` / `AGENTS.md` (Agent-Kompatibilitäts-Playbook) und löst die deterministische CLI aus.

## Why

- **SMS-Kosten = 0** — offizielles Firebase TOTP, kostenlos bis 3.000 DAU im Spark-Plan
- **Eigener Code** — shadcn-style Source-Installation. Debuggen / Anpassen / Audit selbst. `firebase-totp-mfa update` verfolgt Upstream-Drift
- **Offiziell gestützt** — Identity Platform, kein Custom-Auth
- **Recovery-Codes + Server-Enforcement** — Phase 1 enthält beides
- **Agent-kompatibel** — Claude Code / Codex folgen dem `CLAUDE.md` / `AGENTS.md`-Playbook; die CLI ist die deterministische Mutations-Ebene (LLM-Vertrauensgrenze)

**Nur verwenden, wenn Sie bei Firebase Auth bleiben.** Bei Migration zu Clerk / Supabase / Auth.js / Stack Auth → deren natives MFA verwenden. Siehe [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) §6.

## Status

- ✅ **Phase 1 (CLI Alpha) abgeschlossen** — Code + GCP-Integration verifiziert
- 🚧 **Phase 2 (Public-Launch-Vorbereitung) läuft** — `update/diff`-Befehl, `PRODUCTION-CHECKLIST.md`, npm-Stub-Publish, Validierungs-Artefakt
- Vollständiges Design — [`spec.md`](spec.md) (v3, 2026-05-12)
- Aktueller Phase-2-Plan — [`docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md`](docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md)
- Vor dem Produktiv-Deploy — [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md)

## License

MIT
