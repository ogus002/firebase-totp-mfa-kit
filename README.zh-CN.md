# Firebase TOTP MFA Kit

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.ja.md">日本語</a> ·
  <strong>简体中文</strong> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.pt-BR.md">Português</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.fr.md">Français</a>
</p>

> **10 分钟内为 Firebase 接入 TOTP MFA — 附可审计 diff。**

面向 Next.js / Vite / CRA 的 shadcn 风格 CLI + registry 源码安装。
**CLI 优先 · 拥有代码 · 兼容 AI Agent (Claude Code / Codex)。**

## Quick start

```bash
npx firebase-totp-mfa add next --area /admin --issuer "MyApp"
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run
# 检查 diff 后:
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID
cp .env.example .env.local  # 填入 6 个 Firebase config 值
pnpm dev
```

## 先看 Demo (无需 Firebase config)

```bash
git clone https://github.com/ogus002/firebase-totp-mfa-kit
cd firebase-totp-mfa-kit
pnpm install
pnpm dev:demo
# → localhost:3000 — Demo 模式 (固定 credentials、真实输入保护)
```

## 与 AI 一起使用 (Claude Code / Codex)

在你的项目中运行 AI assistant 并说:

> "请在这个项目中设置 Firebase TOTP MFA。使用 github.com/ogus002/firebase-totp-mfa-kit 的 CLI。"

Assistant 会按照 `CLAUDE.md` / `AGENTS.md` (agent compatibility playbook) 调用 deterministic CLI。

## Why

- **SMS 成本 = 0** — 官方 Firebase TOTP,Spark 套餐下 3,000 DAU 免费
- **拥有代码** — shadcn 风格源码安装。可调试 / 定制 / 审计。`firebase-totp-mfa update` 跟踪上游 drift
- **官方 backed** — Identity Platform,非 custom auth
- **Recovery codes + server enforcement** — Phase 1 全部包含
- **Agent-compatible** — Claude Code / Codex 遵循 `CLAUDE.md` / `AGENTS.md` playbook;CLI 是 deterministic mutation layer (LLM 信任边界)

**仅限继续使用 Firebase Auth 的项目。** 迁移到 Clerk / Supabase / Auth.js / Stack Auth → 使用各自的 native MFA。参见 [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) §6。

## Status

- ✅ **Phase 1 (CLI alpha) 完成** — 代码 + GCP 集成已验证
- 🚧 **Phase 2 (public launch 准备) 进行中** — `update/diff` 命令、`PRODUCTION-CHECKLIST.md`、npm stub publish、validation artifact
- 完整 design — [`spec.md`](spec.md) (v3, 2026-05-12)
- 当前 Phase 2 plan — [`docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md`](docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md)
- 生产部署前 — [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md)

## License

MIT
