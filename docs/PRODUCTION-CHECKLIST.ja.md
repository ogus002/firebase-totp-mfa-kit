# プロダクション チェックリスト

<p align="center">
  <a href="PRODUCTION-CHECKLIST.md">English</a> ·
  <a href="PRODUCTION-CHECKLIST.ko.md">한국어</a> ·
  <strong>日本語</strong> ·
  <a href="PRODUCTION-CHECKLIST.zh-CN.md">简体中文</a> ·
  <a href="PRODUCTION-CHECKLIST.es.md">Español</a> ·
  <a href="PRODUCTION-CHECKLIST.pt-BR.md">Português</a> ·
  <a href="PRODUCTION-CHECKLIST.de.md">Deutsch</a> ·
  <a href="PRODUCTION-CHECKLIST.fr.md">Français</a>
</p>

> firebase-totp-mfa を本番にデプロイする前の必読資料。

本 kit は alpha 段階 (Phase 2 launch 時点)。本 checklist は ship 前の通過義務。

## 1. 事前セットアップ検証

- [ ] gcloud 認証の project 正確性: `gcloud config get-value project` が意図した project 名
- [ ] `npx firebase-totp-mfa doctor` の全項目 green
- [ ] `.env.local` に Firebase Web App config 6 値 (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) — git に commit 禁止
- [ ] `emailVerified=true` の test user 最低 1 名 (CLI が admin REST `accounts:update` で set)
- [ ] `npx firebase-totp-mfa verify` シナリオ 5/5 手動検証通過
- [ ] `npx firebase-totp-mfa update` (dry-run) で local source が kit の最新と一致を確認

## 2. サーバ強制ゲート (必須)

⚠️ クライアント側ガード (`<MfaGuard>`) は **セキュリティ境界ではありません**。次のコードを server-side で強制 — 義務:

```ts
import { admin } from './firebase-admin';

const decoded = await admin.auth().verifyIdToken(idToken);
if (!decoded.firebase?.sign_in_attributes?.mfa_factor_uid) {
  throw new AppError(403, 'MFA required');
}
```

本 kit の [`docs/SERVER-MFA-VERIFY.md`](SERVER-MFA-VERIFY.md) の 4 framework snippets (Express / Cloud Functions / Cloud Run / Next Route Handler) のうちご自身の stack を適用。

## 3. リカバリ / ロックアウト

- 10 個の backup codes (hash 保存) → ユーザが download または print
- 管理者 reset SOP — 2 名合意 (multisig パターン) または単純な `admin.deleteUser` + 再招待
- 詳細は [`docs/RECOVERY-CODES.md`](RECOVERY-CODES.md)

⚠️ Recovery codes 紛失 + Authenticator 紛失 = アカウント永久 lock。ユーザ download 強制 UX が必須。

## 4. 責任境界 (Liability)

本 kit は **MIT ライセンス** + **NO WARRANTY**。次の認識事項を明示:

- **shadcn-style source copy** → ユーザのコードとして所有。セキュリティ audit 責任 = ユーザ
- **Firebase API breaking change** 時に本 kit の update が遅延する可能性。`firebase-totp-mfa update` コマンドでユーザが制御
- **LLM (Claude / Codex) が本 kit を呼び出す際** deterministic CLI のみ mutation — ユーザ環境の変化はユーザ責任。`CLAUDE.md` / `AGENTS.md` の "絶対禁止" 5 つの hard rule を強制
- **breach 時の責任** — 本 kit 運営者 (1 人) はユーザの production breach に対する法的責任なし。ユーザ責任

## 5. サポートポリシー + バージョンマトリクス

| Kit バージョン | Firebase JS SDK | Firebase Admin SDK | Identity Platform | 状態 |
|---|---|---|---|---|
| 0.x (alpha) | >=10.6 <12 | >=11.6 <13 | TOTP enabled (REST) | 現在 |
| 1.x (計画) | >=11 <13 | >=12 <14 | TOTP + Passkey adapter | Phase 5 |

- **GitHub issues**: best-effort 応答 7-14 日 (1 人運営者)
- **セキュリティ issue**: GitHub Security advisory + 5 日以内応答約束
- **商用優先サポート**: `$299 fixed-fee Firebase MFA integration review` サービス (別途 page — Phase 2 launch 時に link)

## 6. "Use Only If" Disclaimer

本 kit に適合するユーザ:

- ✅ Firebase Auth の email/password (or OAuth) を使用中
- ✅ Identity Platform upgrade を決定または既に活性化
- ✅ Next.js / Vite / CRA / Expo (Phase 3、条件付き) React プロジェクト
- ✅ TOTP MFA で十分 (Phase 5 まで Passkey を待たない)

不適合なユーザ:

- ❌ **Auth.js / NextAuth / Clerk / Supabase / Stack Auth / Better Auth** → native MFA を使用
- ❌ Custom auth (Firebase ではない) → 本 kit 非適用
- ❌ Passkey-only ポリシー → Phase 5 待機または Hanko / Stack Auth 等

## 7. 持続可能性の声明

本 kit は **1 人運営者** が maintain。**Lucia** (2025-03 deprecated、4 年運営後 burn-out) のような abandonment リスクを認識:

- **Phase 4 Pro tier launch** = 最低 **3 名の paying user 明示的要請** 後のみ build。事前 build 禁止
- **本 kit の fork 推奨** — MIT ライセンス。運営中断時にユーザが自己 maintain 可能
- **`update` コマンド** でユーザ own copy が upstream と diverge してもユーザが制御。`.firebase-totp-mfa.json` metadata = 双方の制御ポイント

本 kit 運営者の SLA 約束:

- 定期 release: 四半期 1 回または critical セキュリティ issue 時
- 応答: 7-14 日 best-effort
- 運営中断時 30 日前事前告知 (GitHub README + npm package deprecate)

## Sign-off

本 production deploy のレビュアーが 7 sections 全部確認後署名:

| Checked | Reviewer | Date | Notes |
|---|---|---|---|
| □ |  |  |  |
| □ |  |  |  |

— END —
