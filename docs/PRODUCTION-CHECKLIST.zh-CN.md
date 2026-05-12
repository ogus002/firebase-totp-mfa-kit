# 生产部署清单

<p align="center">
  <a href="PRODUCTION-CHECKLIST.md">English</a> ·
  <a href="PRODUCTION-CHECKLIST.ko.md">한국어</a> ·
  <a href="PRODUCTION-CHECKLIST.ja.md">日本語</a> ·
  <strong>简体中文</strong> ·
  <a href="PRODUCTION-CHECKLIST.es.md">Español</a> ·
  <a href="PRODUCTION-CHECKLIST.pt-BR.md">Português</a> ·
  <a href="PRODUCTION-CHECKLIST.de.md">Deutsch</a> ·
  <a href="PRODUCTION-CHECKLIST.fr.md">Français</a>
</p>

> 将 firebase-totp-mfa 部署到生产前的必读资料。

本 kit 处于 alpha 阶段 (Phase 2 launch 时点)。本 checklist 是 ship 前的通过义务。

## 1. 预飞设置验证

- [ ] gcloud 认证 project 正确: `gcloud config get-value project` 是预期的 project 名
- [ ] `npx firebase-totp-mfa doctor` 所有项 green
- [ ] `.env.local` 中 Firebase Web App config 6 个值 (`apiKey`、`authDomain`、`projectId`、`storageBucket`、`messagingSenderId`、`appId`) — 禁止 commit 到 git
- [ ] 至少 1 个 `emailVerified=true` 的 test user (CLI 通过 admin REST `accounts:update` 设置)
- [ ] `npx firebase-totp-mfa verify` 5/5 场景手动验证通过
- [ ] `npx firebase-totp-mfa update` (dry-run) 验证 local source 与 kit 最新版一致

## 2. 服务器强制网关 (必需)

⚠️ 客户端守卫 (`<MfaGuard>`) **不是安全边界**。必须在 server-side 强制以下代码 — 义务:

```ts
import { admin } from './firebase-admin';

const decoded = await admin.auth().verifyIdToken(idToken);
if (!decoded.firebase?.sign_in_attributes?.mfa_factor_uid) {
  throw new AppError(403, 'MFA required');
}
```

应用本 kit 的 [`docs/SERVER-MFA-VERIFY.md`](SERVER-MFA-VERIFY.md) 中 4 个 framework snippets (Express / Cloud Functions / Cloud Run / Next Route Handler) 适合自己 stack 的一个。

## 3. 恢复 / 锁定

- 10 个 backup codes (hash 存储) → 用户 download 或 print
- 管理员 reset SOP — 2 人合意 (multisig 模式) 或简单 `admin.deleteUser` + 重新邀请
- 详情见 [`docs/RECOVERY-CODES.md`](RECOVERY-CODES.md)

⚠️ Recovery codes 丢失 + Authenticator 丢失 = 账户永久 lock。用户 download 强制 UX 必须。

## 4. 责任边界 (Liability)

本 kit 为 **MIT 协议** + **NO WARRANTY**。明确以下认知:

- **shadcn 风格源码 copy** → 用户拥有代码。安全 audit 责任 = 用户
- **Firebase API breaking change** 时本 kit 的 update 可能延迟。用户通过 `firebase-totp-mfa update` 命令控制
- **LLM (Claude / Codex) 调用本 kit 时** 只有 deterministic CLI 做 mutation — 用户环境变化由用户负责。`CLAUDE.md` / `AGENTS.md` 的 "绝对禁止" 5 条 hard rule 强制
- **breach 时责任** — 本 kit 运营者 (1 人) 对用户的 production breach 不承担法律责任。用户负责

## 5. 支持策略 + 版本矩阵

| Kit 版本 | Firebase JS SDK | Firebase Admin SDK | Identity Platform | 状态 |
|---|---|---|---|---|
| 0.x (alpha) | >=10.6 <12 | >=11.6 <13 | TOTP enabled (REST) | 当前 |
| 1.x (计划) | >=11 <13 | >=12 <14 | TOTP + Passkey adapter | Phase 5 |

- **GitHub issues**: best-effort 响应 7-14 天 (1 人运营者)
- **安全 issue**: GitHub Security advisory + 5 天内响应承诺
- **商用优先支持**: `$299 fixed-fee Firebase MFA integration review` 服务 (单独 page — Phase 2 launch 时 link)

## 6. "Use Only If" Disclaimer

适用本 kit 的用户:

- ✅ 正在使用 Firebase Auth 的 email/password (或 OAuth)
- ✅ 已决定或已启用 Identity Platform upgrade
- ✅ Next.js / Vite / CRA / Expo (Phase 3、条件性) React 项目
- ✅ TOTP MFA 足够 (Phase 5 之前不等 Passkey)

不适用的用户:

- ❌ **Auth.js / NextAuth / Clerk / Supabase / Stack Auth / Better Auth** → 使用各自的 native MFA
- ❌ Custom auth (不是 Firebase) → 本 kit 不适用
- ❌ Passkey-only 策略 → 等待 Phase 5 或使用 Hanko / Stack Auth 等

## 7. 可持续性声明

本 kit 由 **1 人运营者** 维护。识别 **Lucia** (2025-03 deprecated、4 年运营后 burn-out) 类 abandonment 风险:

- **Phase 4 Pro tier launch** = 最少 **3 名 paying user 明确请求** 后才 build。事前 build 禁止
- **推荐 fork 本 kit** — MIT 协议。运营中断时用户可自行 maintain
- **`update` 命令** 让用户的 own copy 与 upstream diverge 时仍可控。`.firebase-totp-mfa.json` metadata = 双方的控制点

本 kit 运营者 SLA 承诺:

- 定期 release: 季度 1 次或 critical 安全 issue 时
- 响应: 7-14 天 best-effort
- 运营中断时提前 30 天告知 (GitHub README + npm package deprecate)

## Sign-off

本次 production deploy 的审核者确认 7 sections 全部后签名:

| Checked | Reviewer | Date | Notes |
|---|---|---|---|
| □ |  |  |  |
| □ |  |  |  |

— END —
