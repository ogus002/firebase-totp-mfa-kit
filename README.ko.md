# Firebase TOTP MFA Kit

<p align="center">
  <a href="README.md">English</a> ·
  <strong>한국어</strong> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.pt-BR.md">Português</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.fr.md">Français</a>
</p>

> **10분 안에 Firebase TOTP MFA — 감사 가능한 diff 와 함께.**

Next.js / Vite / CRA 용 shadcn-style CLI + registry source 설치.
**CLI 우선 · 코드 소유 · Agent-compatible (Claude Code / Codex).**

## Quick start

```bash
npx firebase-totp-mfa add next --area /admin --issuer "MyApp"
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run
# diff 검토 후:
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID
cp .env.example .env.local  # Firebase config 6개 값 입력
pnpm dev
```

## Demo 먼저 (Firebase config 불필요)

```bash
git clone https://github.com/ogus002/firebase-totp-mfa-kit
cd firebase-totp-mfa-kit
pnpm install
pnpm dev:demo
# → localhost:3000 — Demo mode (고정 credentials, 실 입력 가드)
```

## AI 와 함께 사용 (Claude Code / Codex)

본인 프로젝트에서 AI assistant 실행 후:

> "이 프로젝트에 Firebase TOTP MFA 를 설치해줘. github.com/ogus002/firebase-totp-mfa-kit 의 CLI 를 사용해."

Assistant 가 `CLAUDE.md` / `AGENTS.md` (agent compatibility playbook) 를 따라 deterministic CLI 를 호출합니다.

## Why

- **SMS 비용 = 0** — 공식 Firebase TOTP, Spark plan 3,000 DAU 까지 무료
- **코드 소유** — shadcn-style source 설치. 디버깅 / 커스터마이즈 / audit 가능. `firebase-totp-mfa update` 로 upstream drift 추적
- **공식 backed** — Identity Platform, custom auth 아님
- **Recovery codes + server enforcement** — Phase 1 모두 포함
- **Agent-compatible** — Claude Code / Codex 가 `CLAUDE.md` / `AGENTS.md` playbook 따름; CLI 가 deterministic mutation layer (LLM trust 경계)

**Firebase Auth 잔존자만 사용하세요.** Clerk / Supabase / Auth.js / Stack Auth 로 마이그레이션 중이면 → 각 솔루션의 native MFA 사용. [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) §6 참조.

## Status

- ✅ **Phase 1 (CLI alpha) 완료** — 코드 + GCP 통합 검증 완료
- 🚧 **Phase 2 (public launch 준비) 진행 중** — `update/diff` 명령, `PRODUCTION-CHECKLIST.md`, npm stub publish, validation artifact
- 전체 design — [`spec.md`](spec.md) (v3, 2026-05-12)
- 현재 Phase 2 plan — [`docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md`](docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md)
- Production 배포 전 — [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md)

## License

MIT
