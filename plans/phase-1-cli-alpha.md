# Phase 1 — CLI Alpha (private) 구현 plan

> 기반: `../spec.md` v2 (2026-05-12) + `../internal/codex-review-2026-05-12.md`
> 목표: shadcn-style CLI + registry source + Demo/Real Next.js + 핵심 docs + dogfood 검증. private repo.
> 예상 소요: **20-22h ≈ 2-3일** (codex high reasoning 가 검증한 현실적 추정)

## 0. 사전 준비 (사용자)

| 항목 | 값 | 시점 |
|---|---|---|
| GitHub username | TBD | Phase 2 직전 |
| Real mode 검증용 GCP project (운영자용 별도 1개) | 사용자 생성 | Task 5 (enable) 끝나면 |
| Authenticator 앱 (Google Authenticator / 1Password / Authy / Microsoft Authenticator) | 1개 설치 | Task 9 (real 검증) 직전 |

## 1. Task breakdown (8 tasks)

### Task 1 — Repo scaffold (1h)
- `package.json` (root, workspaces: `packages/*`, `examples/*`)
- `pnpm-workspace.yaml`
- `tsconfig.base.json` (strict, ESNext, bundler)
- `.gitignore` (`internal/` 포함)
- `.npmrc` (auto-install-peers=true)
- `LICENSE` (MIT)
- `README.md` skeleton
- `.changeset/config.json`

검증: `pnpm install` 성공.

### Task 2 — CLI core scaffold + utils (2h)
- `packages/cli/package.json` — name `firebase-totp-mfa`, bin entry, deps (commander/prompts/picocolors/execa/fast-glob/diff)
- `packages/cli/src/index.ts` — CLI 진입점 (`#!/usr/bin/env node`)
- `packages/cli/src/utils/`:
  - `detect-framework.ts` — Next App Router / Pages / Vite / CRA / Expo 감지
  - `detect-package-manager.ts` — pnpm / npm / yarn / bun
  - `detect-firebase-export.ts` — `lib/firebase.{ts,js}`, `src/lib/firebase.{ts,js}`, `firebase/config` 등 검색
  - `diff-and-confirm.ts` — shadcn-style diff 출력 + prompts 확인
  - `exec-gcloud.ts` — gcloud 호출 래퍼 + 에러 표준화
- `packages/cli/tsup.config.ts` — ESM + CJS + binary

검증: `pnpm --filter cli build` 성공. `node packages/cli/dist/index.js --help` 동작.

### Task 3 — Registry source 컴포넌트 + 훅 (3h)
spec 부록 A-2 의 격리 규칙 적용. 모든 source 파일은 `.source.tsx` / `.source.ts` 확장자 (CLI 가 사용자 프로젝트로 복사 시 `.tsx` / `.ts` 로 rename).

`packages/cli/src/registry/components/`:
- `TotpEnroll.source.tsx` (~180 lines)
  - QR + manual key + 6자리 input
  - autocomplete="one-time-code" + inputMode="numeric"
  - aria-live error/success
  - focus management (mount 시 input focus, error 시 announce)
  - i18n texts prop (default en)
  - classNames prop (CSS variables 기반)
  - observability hooks (onEnrollStart/Success/Fail props)
  - `auth/requires-recent-login` 자동 처리
  - `auth/unverified-email` 안내
- `TotpSignInPrompt.source.tsx` (~120 lines)
- `MfaGuard.source.tsx` (~50 lines) — `currentPath` + `onNavigate` props 로 framework agnostic
- `RecoveryCodesPanel.source.tsx` (~100 lines) — 10개 표시 + 다운로드 + 인쇄

`packages/cli/src/registry/hooks/`:
- `useTotpEnroll.source.ts` — Firebase MFA error typing 포함
- `useMfaSignIn.source.ts` — multi-factor-required catch + resolver state
- `useRecoveryCodes.source.ts` — 생성/검증/소비

`packages/cli/src/registry/lib/`:
- `mfa-errors.source.ts` — Firebase MFA 에러 코드 → 사용자 친화 메시지 매핑
- `recovery-codes.source.ts` — 10개 generate + bcrypt hash + Firestore 저장 패턴
- `observability.source.ts` — 이벤트 타입 정의 (consumer 가 Sentry/PostHog 연결)
- `i18n.source.ts` — en defaults + `defineTexts({...})` factory

검증: TypeScript 컴파일 통과. 각 source 파일 import 가능 (test fixture 로).

### Task 4 — Registry server-side snippets + codemods (2h)

`packages/cli/src/registry/server/`:
- `express-mfa-middleware.source.ts` — `verifyIdToken` + mfa claim 검증
- `cloud-functions-mfa.source.ts` — onCall guard
- `cloud-run-mfa.source.ts` — Express + Cloud Run 환경
- `next-route-handler-mfa.source.ts` — App Router Route Handler

`packages/cli/src/codemods/`:
- `next-app-router.ts` — `app/<area>/layout.tsx` 에 `<MfaGuard>` 자동 wrap
- `next-pages-router.ts` — `_app.tsx` 의 protected route wrap
- `vite-react.ts` — React Router 의 protected route
- `cra.ts` — React Router 동일

검증: codemod unit test (input fixture → output fixture 비교)

### Task 5 — `add` + `enable` + `doctor` + `verify` commands (3h)

`packages/cli/src/commands/`:
- `add.ts` — Section 4-1 spec 그대로
- `enable.ts` — Section 4-2 spec 그대로 (5-step safe)
- `doctor.ts` — Section 4-3 환경 진단
- `verify.ts` — Section 4-4 검증 시나리오 출력

각 command 의 prompts UX:
- 시작 시 detect 결과 표시
- 변경 사항 diff 표시
- explicit confirm (단 `--yes` skip)
- 성공/실패 명확한 메시지 + 다음 단계 안내

검증:
- `npx firebase-totp-mfa add next --dry-run` → diff 정확
- `npx firebase-totp-mfa enable --dry-run --project XXX` → current config + 변경 diff 정확
- `npx firebase-totp-mfa doctor` → 모든 체크 항목 출력

### Task 6 — `examples/nextjs-playground` Demo + Real (3h)

- Next.js 14 App Router scaffold
- `package.json` — next + react@18 + firebase@10.6+
- `lib/`:
  - `auth-mode.ts` — env 검사 → 'demo' | 'real'
  - `firebase.ts` — real init
  - `firebase.demo.ts` — thin adapter (전체 mock 아님)
- `app/`:
  - `layout.tsx` — DemoBanner (mode === 'demo')
  - `(public)/page.tsx`
  - `(auth)/login/page.tsx` — fixed credentials autofill + readonly + 변경 가드
  - `(auth)/mfa-enroll/page.tsx`
  - `(auth)/recovery/page.tsx`
  - `(protected)/layout.tsx` — MfaGuard wrap
  - `(protected)/dashboard/page.tsx`
- `.env.example` — 6 Firebase config + TOTP_ISSUER
- `next.config.mjs` — transpilePackages (필요 시)

**Demo mode 검증**:
- `pnpm dev:demo` (config 0) → localhost:3000
- login 화면에 `demo@example.com` / `Demo!1234` 자동 채워짐 + 변경 불가 + 안내 텍스트
- enroll 화면 QR (고정 secret JBSWY3DPEHPK3PXP) → Authenticator 앱 등록 가능
- 6자리 코드 입력 → RFC 6238 (otplib) 검증 통과
- recovery codes 생성 + 다운로드 + 사용 흐름 모두 demo 작동

### Task 7 — `AGENTS.md` + `CLAUDE.md` + docs 8개 (4h)

- 루트 `AGENTS.md` + `CLAUDE.md` (동일 내용) — spec §7-2 fallback playbook
- `docs/ARCHITECTURE.md` — 모듈 구조 + state machine 도식
- `docs/SECURITY.md` (신규) — TOTP secret 처리 / Demo 가드 / prompt injection / accountLabel uid 옵션 / `adjacentIntervals` 보안 tradeoff
- `docs/ACCESSIBILITY.md` (신규) — autocomplete / aria-live / focus / contrast
- `docs/RECOVERY-CODES.md` (신규) — 10개 흐름 + admin reset 절차 + Firestore schema
- `docs/SERVER-MFA-VERIFY.md` (신규) — 4개 framework snippets (Express / CF / Cloud Run / Next Route)
- `docs/OBSERVABILITY.md` (신규) — 이벤트 모델 + Sentry/PostHog 예시
- `docs/i18n.md` — en + locale prop contract + error code 매핑
- `docs/claude-orchestration.md` — Claude/Codex fallback playbook 상세 (CLAUDE.md 의 detail)
- `docs/manual-setup.md` — CLI 없이 copy-paste (branding 격리 검증 통과)
- `docs/troubleshooting.md` — 흔한 에러 + 해결
- `docs/setup-gcp.md` — 사용자 직접 Console UI 6단계

### Task 8 — 3축 검증 (2-3h)

#### 8-1. Static / 격리
- `pnpm install` 성공
- `pnpm build` 전 패키지 성공
- `pnpm dev:demo` 동작
- Demo fixed credentials 가드 검증
- Mock 6자리 코드 RFC 6238 검증
- **격리 grep 0 hits** (spec 부록 A-3)

#### 8-2. Real mode (별도 GCP project)
- 운영자 1회 GCP project 생성 + Firebase 활성 + Identity Platform upgrade (~10분)
- `pnpm cli enable --dry-run --project NEW` → diff 확인
- `pnpm cli enable --project NEW` → 5-step 통과
- `.env.local` 채움 → real 모드 자동 전환
- email/password 사용자 1명 + email verify
- login → MFA prompt → 6자리 코드 → dashboard
- enrolledFactors 없는 사용자가 protected 진입 → enroll redirect
- `auth/requires-recent-login` 자동 처리
- `auth/unverified-email` 안내
- Recovery codes 생성 + 사용 + 검증

#### 8-3. Claude orchestration dogfood
- 빈 Next.js 14 프로젝트 1개 생성 (`pnpm create next-app dogfood-test`)
- `dogfood-test` 디렉토리에서 Claude Code 새 세션
- spec §0 한 줄 명령 입력 (단 repo URL 은 local file 경로로 임시 대체)
- Claude 가 `npx firebase-totp-mfa add next` 호출
- CLI 가 detect → diff → confirm → apply
- 사용자(나) = confirm 만 답변
- 결과: dogfood-test 에 enroll/login/protected/recovery 모두 자동 적용
- **iUPPITER 노출 0 재확인** (dogfood-test 도 grep)
- Claude 가 절대 금지 규칙 5개 준수 (.env 안 읽음 / package script 안 실행 등)

## 2. 의존성 / 순서

```
Task 1 (scaffold)
   ↓
Task 2 (CLI core + utils)
   ↓
Task 3 (registry components/hooks/lib) ←── Task 4 (server snippets + codemods) — Task 3 끝나면 병렬
   ↓
Task 5 (commands — add/enable/doctor/verify)
   ↓
Task 6 (nextjs-playground Demo + Real) ←── Task 7 (AGENTS.md + docs 11개) — Task 5 끝나면 병렬
   ↓
Task 8 (3축 검증)
```

## 3. Time table (총 ~22h ≈ 2.5일)

| Task | 시간 |
|---|---|
| 1. Scaffold | 1h |
| 2. CLI core + utils | 2h |
| 3. Registry components/hooks/lib | 3h |
| 4. Server snippets + codemods | 2h |
| 5. Commands (4 개) | 3h |
| 6. nextjs-playground (Demo + Real) | 3h |
| 7. AGENTS.md + 11 docs | 4h |
| 8. 3축 검증 | 2-3h |
| **합계** | **20-22h** |

## 4. 위험 / 미확정

| 항목 | 위험 | 대응 |
|---|---|---|
| Codemod 정확도 | 사용자 기존 코드 패턴 무한 | App Router / Pages / Vite / CRA 4개만 Phase 1. 나머지는 `manual-setup.md` fallback |
| QR `otpauth://` 카메라 미인식 | 모든 OS 의 한계 | manual key 동시 노출 + 안내 텍스트 (Authenticator 앱 안 QR 스캔 필요) |
| Demo mode 의 TOTP 알고리즘 | RFC 6238 직접 구현 필요 | otplib (`@otplib/preset-default`) 사용 (~5kb) |
| Firebase MFA error 종류 | 문서화 안 된 에러 코드 | mfa-errors.source.ts 의 fallback "unknown error" + GitHub issue 유도 |
| Identity Platform PATCH 충돌 | 다른 mfa provider (SMS) 와 공존 시 enable 이 덮어쓰면 안 됨 | 5-step 의 step 2 (GET) 에서 기존 providerConfigs preserve + diff 표시 |
| Recovery codes Firestore 의존성 | 사용자가 Firestore 없으면? | source 파일에 "Firestore 미사용 시 alternate storage" 주석 + adapter 패턴 |
| Claude playbook prompt injection | 사용자 코드 안 지시문 | AGENTS.md / CLAUDE.md 의 "절대 금지" 5개 명시 |

## 5. Phase 1 → Phase 2 게이트

Phase 2 (Public release) 진입 전 확정:
- [ ] npm 패키지 이름 검증 (`firebase-totp-mfa` 가용? `npm search`)
- [ ] GitHub repo URL 확정 + push
- [ ] LICENSE copyright 라인 확정
- [ ] CHANGELOG 초기 entry (changesets `add`)
- [ ] GitHub Actions CI green
- [ ] npm 2FA 활성
- [ ] Demo hosting 사이트 1차 배포 (`internal/setup-operator-gcp.md` 참조)

## 6. 실행 진입 조건

다음 중:
- 사용자가 "Phase 1 진행" 명시
- 사용자가 §0 사전 준비 (GitHub username placeholder OK / Real mode 검증용 GCP project Task 5 직전 생성) 확인

→ Task 1 부터 순서대로 실행.
