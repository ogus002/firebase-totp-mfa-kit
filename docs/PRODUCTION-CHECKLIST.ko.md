# 프로덕션 체크리스트

<p align="center">
  <a href="PRODUCTION-CHECKLIST.md">English</a> ·
  <strong>한국어</strong> ·
  <a href="PRODUCTION-CHECKLIST.ja.md">日本語</a> ·
  <a href="PRODUCTION-CHECKLIST.zh-CN.md">简体中文</a> ·
  <a href="PRODUCTION-CHECKLIST.es.md">Español</a> ·
  <a href="PRODUCTION-CHECKLIST.pt-BR.md">Português</a> ·
  <a href="PRODUCTION-CHECKLIST.de.md">Deutsch</a> ·
  <a href="PRODUCTION-CHECKLIST.fr.md">Français</a>
</p>

> firebase-totp-mfa 를 프로덕션에 배포하기 전 필독.

본 kit 은 alpha 단계 (Phase 2 launch 시점). 본 checklist 는 ship 전 통과 의무.

## 1. 사전 셋업 검증

- [ ] gcloud 인증의 project 정확: `gcloud config get-value project` 가 의도된 project 명
- [ ] `npx firebase-totp-mfa doctor` 모든 항목 green
- [ ] `.env.local` 에 Firebase Web App config 6 값 (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) — git 에 commit 금지
- [ ] `emailVerified=true` 인 test user 최소 1명 (CLI 가 admin REST `accounts:update` 로 set)
- [ ] `npx firebase-totp-mfa verify` 시나리오 5/5 수동 검증 통과
- [ ] `npx firebase-totp-mfa update` (dry-run) 으로 local source 가 kit 최신과 일치 확인

## 2. 서버 강제 게이트 (필수)

⚠️ 클라이언트 측 가드 (`<MfaGuard>`) 는 **보안 경계가 아닙니다**. 다음 코드를 server-side 에 강제 — 의무:

```ts
import { admin } from './firebase-admin';

const decoded = await admin.auth().verifyIdToken(idToken);
if (!decoded.firebase?.sign_in_attributes?.mfa_factor_uid) {
  throw new AppError(403, 'MFA required');
}
```

본 kit 의 [`docs/SERVER-MFA-VERIFY.md`](SERVER-MFA-VERIFY.md) 의 4 framework snippets (Express / Cloud Functions / Cloud Run / Next Route Handler) 중 본인 stack 적용.

## 3. 복구 / 잠금

- 10개 backup codes (hash 저장) → 사용자가 download 또는 print
- 관리자 reset SOP — 2명 합의 (multisig 패턴) 또는 단순 `admin.deleteUser` + 재초대
- 자세히는 [`docs/RECOVERY-CODES.md`](RECOVERY-CODES.md)

⚠️ Recovery codes 분실 + Authenticator 분실 = 계정 영구 lock. 사용자 download 강제 UX 필수.

## 4. 책임 경계 (Liability)

본 kit 은 **MIT 라이센스** + **NO WARRANTY**. 다음 인지 사항 명시:

- **shadcn-style source copy** → 사용자 코드로 소유. 보안 audit 책임 = 사용자
- **Firebase API breaking change** 시 본 kit update 지연 가능. `firebase-totp-mfa update` 명령으로 사용자 통제
- **LLM (Claude / Codex) 가 본 kit 호출 시** deterministic CLI 만 mutation — 사용자 환경 변화는 사용자 책임. `CLAUDE.md` / `AGENTS.md` 의 "절대 금지" 5개 hard rule 강제
- **breach 시 책임** — 본 kit 운영자 (1인) 는 사용자의 production breach 에 대한 법적 책임 없음. 사용자 책임

## 5. 지원 정책 + 버전 매트릭스

| Kit 버전 | Firebase JS SDK | Firebase Admin SDK | Identity Platform | 상태 |
|---|---|---|---|---|
| 0.x (alpha) | >=10.6 <12 | >=11.6 <13 | TOTP enabled (REST) | 현재 |
| 1.x (계획) | >=11 <13 | >=12 <14 | TOTP + Passkey adapter | Phase 5 |

- **GitHub issues**: best-effort 응답 7-14일 (1인 운영자)
- **보안 issue**: GitHub Security advisory + 5일 내 응답 약속
- **상용 우선 지원**: `$299 fixed-fee Firebase MFA integration review` 서비스 (별도 page — Phase 2 launch 시 link)

## 6. "Use Only If" Disclaimer

본 kit 의 적합한 사용자:

- ✅ Firebase Auth 의 email/password (or OAuth) 사용 중
- ✅ Identity Platform upgrade 결정 또는 이미 활성
- ✅ Next.js / Vite / CRA / Expo (Phase 3, 조건부) React 프로젝트
- ✅ TOTP MFA 로 충분 (Phase 5 까지 Passkey 안 기다림)

부적합한 사용자:

- ❌ **Auth.js / NextAuth / Clerk / Supabase / Stack Auth / Better Auth** → native MFA 사용
- ❌ Custom auth (Firebase 아님) → 본 kit 미적용
- ❌ Passkey-only 정책 → Phase 5 대기 또는 Hanko / Stack Auth 등

## 7. 지속가능성 명시

본 kit 은 **1인 운영자** 가 maintain. **Lucia** (2025-03 deprecated, 4년 운영 후 burn-out) 같은 abandonment 위험 인지:

- **Phase 4 Pro tier launch** = 최소 **3명 paying user 명시 요청** 후만 build. 미리 build 금지
- **본 kit fork 권장** — MIT 라이센스. 운영 중단 시 사용자가 자가 maintain 가능
- **`update` 명령** 으로 사용자 own copy 가 upstream 와 diverge 해도 사용자 통제. `.firebase-totp-mfa.json` metadata = 양쪽 통제 지점

본 kit 운영자 SLA 약속:

- 정기 release: 분기 1회 또는 critical 보안 issue 시
- 응답: 7-14일 best-effort
- 운영 중단 시 30일 사전 공지 (GitHub README + npm package deprecate)

## Sign-off

본 production deploy 의 검토자가 7 sections 전부 확인 후 서명:

| Checked | Reviewer | Date | Notes |
|---|---|---|---|
| □ |  |  |  |
| □ |  |  |  |

— END —
