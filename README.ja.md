# Firebase TOTP MFA Kit

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ko.md">한국어</a> ·
  <strong>日本語</strong> ·
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.pt-BR.md">Português</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.fr.md">Français</a>
</p>

> **10分で Firebase TOTP MFA — 監査可能な diff 付き。**

Next.js / Vite / CRA 向け shadcn スタイル CLI + registry ソース install。
**CLI 主導 · コード所有 · Agent-compatible (Claude Code / Codex)。**

## Quick start

```bash
npx firebase-totp-mfa add next --area /admin --issuer "MyApp"
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run
# diff を確認後:
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID
cp .env.example .env.local  # Firebase config 6 値を記入
pnpm dev
```

## まず Demo (Firebase config 不要)

```bash
git clone https://github.com/ogus002/firebase-totp-mfa-kit
cd firebase-totp-mfa-kit
pnpm install
pnpm dev:demo
# → localhost:3000 — Demo モード (固定 credentials、実入力ガード)
```

## AI と一緒に (Claude Code / Codex)

ご自身のプロジェクトで AI assistant を実行し、次のように言ってください:

> "このプロジェクトに Firebase TOTP MFA をセットアップして。github.com/ogus002/firebase-totp-mfa-kit の CLI を使って。"

Assistant が `CLAUDE.md` / `AGENTS.md` (agent compatibility playbook) に従い、deterministic CLI を呼び出します。

## Why

- **SMS コスト = 0** — 公式 Firebase TOTP、Spark プラン 3,000 DAU まで無料
- **コード所有** — shadcn スタイルのソース install。デバッグ / カスタマイズ / audit 可能。`firebase-totp-mfa update` で upstream drift を追跡
- **公式 backed** — Identity Platform、custom auth ではない
- **Recovery codes + server enforcement** — Phase 1 で両方含む
- **Agent-compatible** — Claude Code / Codex が `CLAUDE.md` / `AGENTS.md` playbook に従う; CLI が deterministic mutation layer (LLM trust boundary)

**Firebase Auth を継続利用する場合のみ使用してください。** Clerk / Supabase / Auth.js / Stack Auth へ移行中 → 各ソリューションの native MFA を使用。[`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) §6 参照。

## Status

- ✅ **Phase 1 (CLI alpha) 完了** — コード + GCP 統合検証済み
- 🚧 **Phase 2 (public launch 準備) 進行中** — `update/diff` コマンド、`PRODUCTION-CHECKLIST.md`、npm stub publish、validation artifact
- 全 design — [`spec.md`](spec.md) (v3, 2026-05-12)
- 現在の Phase 2 plan — [`docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md`](docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md)
- Production deploy 前 — [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md)

## License

MIT
