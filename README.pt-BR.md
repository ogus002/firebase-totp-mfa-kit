# Firebase TOTP MFA Kit

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="README.es.md">Español</a> ·
  <strong>Português</strong> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.fr.md">Français</a>
</p>

> **Firebase TOTP MFA em 10 minutos — com diffs auditáveis.**

CLI estilo shadcn + instalação de registry source para Next.js / Vite / CRA.
**CLI primeiro · Possui o código · Compatível com agentes (Claude Code / Codex).**

## Quick start

```bash
npx firebase-totp-mfa add next --area /admin --issuer "MyApp"
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run
# revise o diff, então:
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID
cp .env.example .env.local  # preencha os 6 valores do Firebase config
pnpm dev
```

## Demo primeiro (sem Firebase config)

```bash
git clone https://github.com/ogus002/firebase-totp-mfa-kit
cd firebase-totp-mfa-kit
pnpm install
pnpm dev:demo
# → localhost:3000 — Modo Demo (credenciais fixas, proteção de entrada real)
```

## Com IA (Claude Code / Codex)

No seu projeto, execute um assistente IA e diga:

> "Configure Firebase TOTP MFA neste projeto. Use github.com/ogus002/firebase-totp-mfa-kit e execute a CLI."

O assistente segue `CLAUDE.md` / `AGENTS.md` (playbook de compatibilidade de agentes) e aciona a CLI determinística.

## Why

- **Custo SMS = 0** — TOTP oficial do Firebase, gratuito até 3.000 DAU no plano Spark
- **Possui o código** — instalação de fonte estilo shadcn. Depure / customize / audite você mesmo. `firebase-totp-mfa update` para rastrear drift upstream
- **Suportado oficialmente** — Identity Platform, não auth custom
- **Recovery codes + enforcement do servidor** — Phase 1 inclui ambos
- **Compatível com agentes** — Claude Code / Codex seguem o playbook `CLAUDE.md` / `AGENTS.md`; a CLI é a camada determinística de mutação (limite de confiança LLM)

**Use isso apenas se permanecer no Firebase Auth.** Migrando para Clerk / Supabase / Auth.js / Stack Auth → use o MFA nativo deles. Veja [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) §6.

## Status

- ✅ **Phase 1 (CLI alpha) completa** — código + integração GCP verificados
- 🚧 **Phase 2 (preparação para lançamento público) em progresso** — comando `update/diff`, `PRODUCTION-CHECKLIST.md`, publicação de stub no npm, artefato de validação
- Design completo — [`spec.md`](spec.md) (v3, 2026-05-12)
- Plano Phase 2 atual — [`docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md`](docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md)
- Antes de implantar em produção — [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md)

## License

MIT
