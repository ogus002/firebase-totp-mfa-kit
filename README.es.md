# Firebase TOTP MFA Kit

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh-CN.md">简体中文</a> ·
  <strong>Español</strong> ·
  <a href="README.pt-BR.md">Português</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.fr.md">Français</a>
</p>

> **Firebase TOTP MFA en 10 minutos — con diffs auditables.**

CLI estilo shadcn + instalación de registry source para Next.js / Vite / CRA.
**CLI primero · Posee el código · Compatible con agentes (Claude Code / Codex).**

## Quick start

```bash
npx firebase-totp-mfa add next --area /admin --issuer "MyApp"
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run
# revisa el diff, luego:
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID
cp .env.example .env.local  # rellena los 6 valores de Firebase config
pnpm dev
```

## Demo primero (sin Firebase config)

```bash
git clone https://github.com/ogus002/firebase-totp-mfa-kit
cd firebase-totp-mfa-kit
pnpm install
pnpm dev:demo
# → localhost:3000 — Modo Demo (credenciales fijas, guardia de entrada real)
```

## Con IA (Claude Code / Codex)

En tu proyecto, ejecuta un asistente IA y di:

> "Configura Firebase TOTP MFA en este proyecto. Usa github.com/ogus002/firebase-totp-mfa-kit y ejecuta la CLI."

El asistente sigue `CLAUDE.md` / `AGENTS.md` (playbook de compatibilidad de agentes) y activa la CLI determinista.

## Why

- **Coste SMS = 0** — TOTP oficial de Firebase, gratis hasta 3.000 DAU en plan Spark
- **Posee el código** — instalación de fuentes estilo shadcn. Depura / personaliza / audita tú mismo. `firebase-totp-mfa update` para rastrear drift upstream
- **Respaldado oficialmente** — Identity Platform, no auth custom
- **Recovery codes + enforcement del servidor** — Phase 1 incluye ambos
- **Compatible con agentes** — Claude Code / Codex siguen el playbook `CLAUDE.md` / `AGENTS.md`; la CLI es la capa determinista de mutación (límite de confianza LLM)

**Usa esto sólo si te quedas con Firebase Auth.** Migrando a Clerk / Supabase / Auth.js / Stack Auth → usa su MFA nativo. Ver [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) §6.

## Status

- ✅ **Phase 1 (CLI alpha) completa** — código + integración GCP verificados
- 🚧 **Phase 2 (preparación para lanzamiento público) en progreso** — comando `update/diff`, `PRODUCTION-CHECKLIST.md`, publicación de stub en npm, artefacto de validación
- Diseño completo — [`spec.md`](spec.md) (v3, 2026-05-12)
- Plan Phase 2 actual — [`docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md`](docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md)
- Antes de desplegar a producción — [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md)

## License

MIT
