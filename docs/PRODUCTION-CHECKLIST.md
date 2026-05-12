# Production Checklist

> Required reading before deploying firebase-totp-mfa to production.

본 kit 은 alpha 단계 (Phase 2 launch 시점). 본 checklist 는 ship 전 통과 의무.

## 1. Pre-flight Setup Verification

- [ ] gcloud auth correct project: `gcloud config get-value project` 가 의도된 project 명
- [ ] `npx firebase-totp-mfa doctor` 모든 항목 green
- [ ] Firebase Web App config 6 values in `.env.local` (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) — NOT committed to git
- [ ] At least 1 test user with `emailVerified=true` (CLI sets via admin REST `accounts:update`)
- [ ] `npx firebase-totp-mfa verify` 시나리오 5/5 manual 검증 통과
- [ ] `npx firebase-totp-mfa update --apply=false` (dry-run) 으로 local source 가 kit 의 latest 와 일치 확인

## 2. Server Enforcement Gate (REQUIRED)

⚠️ Client-side guard (`<MfaGuard>`) 는 **보안 경계 아님**. 다음 코드 server-side 에 강제 — 의무:

```ts
import { admin } from './firebase-admin';

const decoded = await admin.auth().verifyIdToken(idToken);
if (!decoded.firebase?.sign_in_attributes?.mfa_factor_uid) {
  throw new AppError(403, 'MFA required');
}
```

본 kit 의 [`docs/SERVER-MFA-VERIFY.md`](SERVER-MFA-VERIFY.md) 의 4 framework snippets (Express / Cloud Functions / Cloud Run / Next Route Handler) 중 본인 stack 적용.

## 3. Recovery / Lockout

- 10 backup codes (hash 저장) → 사용자 download 또는 print
- Admin reset SOP — 2명 합의 (multisig 패턴) 또는 단순 `admin.deleteUser` + 재초대
- 자세히는 [`docs/RECOVERY-CODES.md`](RECOVERY-CODES.md)

⚠️ Recovery codes 분실 + Authenticator 분실 = account permanent lock. 사용자 download 강제 UX 필수.

## 4. Liability Boundary

본 kit 은 **MIT 라이센스** + **NO WARRANTY**. 다음 인지 사항 명시:

- **shadcn-style source copy** → 사용자 코드로 owned. 보안 audit 책임 = 사용자
- **Firebase API breaking change** 시 본 kit 의 update 지연 가능. `firebase-totp-mfa update` 명령으로 사용자 통제
- **LLM (Claude / Codex) 가 본 kit 호출 시** deterministic CLI 만 mutation — 단 사용자 환경 변화는 사용자 책임. `CLAUDE.md` / `AGENTS.md` 의 "절대 금지" 5개 hard rule 강제
- **breach 시 책임** — 본 kit 운영자 (1인) 는 사용자의 production breach 에 대한 법적 책임 없음. 사용자 책임

## 5. Support Policy + Version Matrix

| Kit version | Firebase JS SDK | Firebase Admin SDK | Identity Platform | 상태 |
|---|---|---|---|---|
| 0.x (alpha) | >=10.6 <12 | >=11.6 <13 | TOTP enabled (REST) | 현재 |
| 1.x (planned) | >=11 <13 | >=12 <14 | TOTP + Passkey adapter | Phase 5 |

- **GitHub issues**: best-effort 응답 7-14일 (1-person operator)
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

## 7. Sustainability Statement

본 kit 은 **1-person operator** 가 maintain. **Lucia** (March 2025 deprecated — 4년 운영 후 burn-out) 와 같은 abandonment 위험을 인지:

- **Phase 4 Pro tier launch** = 최소 **3명 paying user 명시 요청** 후만 build. 미리 build 금지.
- **본 kit fork 권장** — MIT 라이센스. 운영 중단 시 사용자가 자가 maintain 가능.
- **`update` 명령** 으로 사용자 own copy 가 upstream 와 diverge 해도 사용자 통제. `.firebase-totp-mfa.json` metadata = 양쪽 통제 지점.

본 kit 운영자 의 SLA 약속:

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
