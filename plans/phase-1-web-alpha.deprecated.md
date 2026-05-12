# ⚠️ DEPRECATED — see `phase-1-cli-alpha.md`

> 2026-05-12: Codex high reasoning review 후 shadcn-style CLI 로 pivot.
> 새 plan: `phase-1-cli-alpha.md`
> Pivot 사유: `../internal/codex-review-2026-05-12.md`

본 파일은 history 보존 목적으로만 유지.

---

# Phase 1 — Web Alpha 구현 plan (deprecated 원본)

> 기반: `../spec.md` §3 (아키텍처) + §4 (API) + §7 (Claude orchestration) + §11 (검증) + 부록 A (격리 규칙)
> 목표: Web 만 동작 + Demo + Real 두 모드 + Claude Code orchestration 진입점 (CLAUDE.md) 완성. private repo 상태.
> 예상 소요: **~7h**

## 0. 사전 준비 (사용자 확정 필요)

| 항목 | 값 | 액션 |
|---|---|---|
| GitHub username | TBD | placeholder `@<gh-user>` 로 진행. Phase 2 publish 직전 확정. |
| Real mode 검증용 Firebase project | **별도 신규 프로젝트 권장** (iUPPITER 격리 원칙) | Spec §1 — 본 kit 가 iUPPITER 와 격리. 검증도 별도 GCP project 권장. 비용 0 (Spark plan + MAU 50K 무료). |
| 검증 사용자 계정 | 별도 test 이메일 1개 (예: `test@example.com` Firebase Auth 등록) | example real-mode 검증용. |

→ Phase 1 시작 시 1-2분 결정 후 진입. Real mode 검증은 마지막 Task 7 에서만 사용.

## 1. Task breakdown

### Task 1 — Repo scaffold (30분)

산출:
- `package.json` (root) — workspaces, scripts (`build`, `test`, `lint`, `dev`)
- `pnpm-workspace.yaml` — `packages/*`, `examples/*`
- `turbo.json` — task pipeline (build → test → lint)
- `tsconfig.base.json` — strict + ESM + bundler resolution
- `.gitignore`, `.npmrc` (auto-install-peers=true)
- `LICENSE` (MIT, 사용자 이름)
- `README.md` skeleton (실제 내용은 Task 6)
- `.changeset/config.json` (Phase 2 npm publish 준비)

검증: `pnpm install` 성공.

### Task 2 — `packages/core` (60분)

산출:
- `package.json`
  - name: `@<scope>/firebase-totp-mfa-core`
  - peerDependencies: `firebase >=10.6.0`
  - dependencies: `qrcode ^1.5.3`
- `src/`
  - `index.ts` — public API barrel
  - `types.ts` — TotpEnrollState, MfaSignInState, ...
  - `enroll.ts` — `createTotpEnrollMachine(auth)` — generateSecret → enroll
  - `sign-in.ts` — `createMfaSignInMachine()` — multi-factor-required catch → resolver
  - `utils.ts` — `hasTotpFactor`, `requireRecentLogin`, `generateQrDataUrl`
- `tsup.config.ts` — ESM + CJS + dts
- `vitest.config.ts` + `__tests__/utils.test.ts` (unit, Firebase mock 없이)

검증: `pnpm --filter core build` 성공 + dts 생성 확인.

### Task 3 — `packages/react` (90분)

산출:
- `package.json`
  - name: `@<scope>/firebase-totp-mfa-react`
  - peerDependencies: `react >=18`, `firebase >=10.6`
  - dependencies: `@<scope>/firebase-totp-mfa-core: workspace:*`
- `src/`
  - `hooks/`
    - `useTotpEnroll.ts` — core machine wrap + React state sync
    - `useMfaSignIn.ts`
    - `useMfaStatus.ts` — onAuthStateChanged + enrolledFactors
  - `components/`
    - `TotpEnroll.tsx` — QR + manual key + 6자리 input + i18n texts prop
    - `TotpSignInPrompt.tsx` — resolver consume + verify
    - `MfaGuard.tsx` — currentPath 기반 redirect (Next/Vite/CRA 모두 호환)
  - `styles/` — CSS modules (minimal — variables: --totp-primary, --totp-bg, --totp-text)
  - `i18n.ts` — defaultTexts (en + ko)
  - `index.ts` — barrel
- `tsup.config.ts` (cjs 제외 — React 18+ ESM only)

검증: `pnpm --filter react build` 성공. Types import 확인.

### Task 4 — `CLAUDE.md` orchestration playbook 작성 (30분) **NEW — 핵심**

산출: `CLAUDE.md` (repo 루트)

spec §7-2 의 5-step playbook 정식 작성:
- **Step 0** detect (framework / firebase 경로 / package manager)
- **Step 1** AskUserQuestion 4-5개 (GCP project / issuer / 적용 영역 / Auth provider)
- **Step 2** Identity Platform TOTP enable (gcloud auth check → script run → 응답 검증)
- **Step 3** 의존성 설치 (firebase / @<scope>/firebase-totp-mfa-react)
- **Step 4** 코드 통합 (framework branch — Next App Router / Next Pages / Vite / CRA)
- **Step 5** 검증 (dev 서버 + 시나리오 출력)
- **금지 사항** (iUPPITER 노출 / .env 직접 읽기 / 파괴적 명령)

각 step 별로 Claude 가 사용할 명령/도구 (WebFetch / Bash / Edit / Write / AskUserQuestion) 명시. 사용자 응답 분기 시나리오 detail.

검증: GPT-4/Claude/Gemini 등 다른 모델이 본 playbook 만 보고도 동일한 흐름 진행 가능한지 review.

### Task 5 — `examples/nextjs-playground` Demo + Real 두 모드 (90분)

산출:
- Next.js 14 app router scaffold (no Tailwind, vanilla CSS)
- `package.json` — `next`, `react@18`, `firebase`, `@<scope>/firebase-totp-mfa-react: workspace:*`
- `lib/`
  - `auth-mode.ts` — env 검사 → `'demo' | 'real'` 자동 분기 (NEXT_PUBLIC_FIREBASE_API_KEY 비어있으면 demo)
  - `firebase.ts` — env 기반 real Firebase init
  - `firebase.mock.ts` — in-memory Auth mock (signInWithEmailAndPassword / multiFactor / TotpMultiFactorGenerator 동일 인터페이스)
- `app/`
  - `layout.tsx` — root + DemoBanner (demo 모드 시 표시) + CSS variables theme
  - `(public)/page.tsx` — index, login link
  - `(auth)/layout.tsx` — MfaGuard wrap (mode-aware)
  - `(auth)/login/page.tsx` — email/password form + useMfaSignIn integration
  - `(auth)/mfa-enroll/page.tsx` — `<TotpEnroll issuer={ENV.TOTP_ISSUER ?? "DemoApp"} onSuccess={navigate}>`
  - `(auth)/dashboard/page.tsx` — "로그인 성공" + 사용자 정보 표시 (mock 또는 real)
- `.env.example` — 6개 Firebase config + 1개 TOTP_ISSUER (모두 비어둠)
- `README.md` — Demo first 흐름 + Real 전환 흐름 둘 다 안내
- `next.config.mjs` — transpile @<scope>/* (monorepo workspace)
- 격리 검증 — 모든 텍스트/CSS/주석에 iUPPITER 관련 0

#### Demo mode 구현 detail
- mock secret 고정 (`JBSWY3DPEHPK3PXP` — RFC 4226 example 시크릿)
- 사용자가 Authenticator 앱에 등록 시 실제 6자리 코드 생성 가능
- mock verifier 가 실제 TOTP 알고리즘 (RFC 6238) 으로 코드 검증 — Demo 도 "진짜 같은 경험"
- DemoBanner: "Demo Mode — connect Firebase in .env.local for real auth"

검증:
- `pnpm --filter nextjs-playground dev` (config 0) → localhost:3000 → demo 흐름 한 사이클 통과
- `cp .env.local` 채움 → real 흐름 한 사이클 통과

### Task 6 — scripts (30분)

산출:
- `scripts/enable-totp.ps1` — spec §5-1 그대로 (CLI arg 처리 + 검증 응답)
- `scripts/enable-totp.sh` — spec §5-2 그대로
- `scripts/run-enable.mjs` — cross-platform 분기 (Windows → pwsh / else → bash)
- `scripts/init.ts` — stub (Phase 2 에서 inquirer interactive 완성)
- 루트 `package.json` scripts:
  - `totp:enable`: `node scripts/run-enable.mjs`
  - `dev:demo`: `pnpm --filter nextjs-playground dev` (config 없이)

검증: 별도 GCP project 에 `pnpm totp:enable -- --project NEW-TEST-PROJECT` idempotent 확인.

### Task 7 — docs + README (75분)

산출:
- `README.md` (루트, spec §7-3 형태)
  - Hero
  - 30-second start (Claude Code)
  - Demo first (Firebase 없이)
  - Manual setup pointer
  - Identity Platform enable
  - License
- `docs/setup-gcp.md` — **사용자 손이 필요한 부분** (Console 작업 6단계 — spec §7-6)
- `docs/claude-code-prompts.md` — Sub-prompts (CLAUDE.md 가 메인 진입점, 본 파일은 step 별 수동 진행 시)
  - A. Next.js 통합만
  - B. Vite/CRA 통합
  - C. Identity Platform TOTP enable
  - D. BE middleware (snippets 참조)
  - E. Playwright 검증 시나리오
- `docs/manual-setup.md` — Claude Code 없이 copy-paste 가이드 — **branding 제거 후** (부록 A-2 규칙 적용)
- `docs/be-middleware-snippets.md` — Express / Cloud Functions / Cloud Run / Next Route Handler 4개 패턴
- `docs/troubleshooting.md`
  - `auth/requires-recent-login` 자동 처리
  - QR 카메라 인식 안 됨 (정상)
  - Identity Platform 403 (X-Goog-User-Project 헤더 누락)
  - example transpile config
  - Authenticator 앱 코드 안 맞음 (시계 동기화)
- `docs/architecture.md` — core/react 분리 이유 + state machine 도식 + Demo mode 작동 원리

### Task 8 — 검증 (30분) — **3축 모두**

#### 8-1. Static / 격리 검증 (필수 통과)
```bash
# 격리 grep — 0 hits 여야 함 (spec 부록 A-3)
grep -ri "iuppiter\|xpla\|piup\|drops.iuppiter\|vault.xpla\|walletManagers\|blockedWallets\|adminAuditLog\|microPiUP" \
  packages/ examples/ scripts/ docs/ README.md CLAUDE.md \
  --exclude-dir=node_modules --exclude-dir=.git
```
- [ ] `pnpm install` 성공
- [ ] `pnpm build` 전 패키지 성공
- [ ] **Demo mode**: `pnpm dev:demo` → localhost:3000 → 모든 화면 mock 으로 동작
- [ ] DemoBanner 명확히 표시
- [ ] Mock 6자리 코드 검증이 실제 TOTP 알고리즘으로 동작

#### 8-2. Real mode 검증 (별도 GCP project 1개로)
- [ ] `.env.local` 채움 → real 모드 자동 전환
- [ ] `pnpm totp:enable -- --project NEW-TEST-PROJECT` 성공
- [ ] login → email/password → MFA prompt → 6자리 코드 → dashboard
- [ ] enrolledFactors 없는 사용자가 protected 진입 시 enroll page 자동 redirect

#### 8-3. Claude orchestration dogfood (핵심)
- [ ] 빈 Next.js 14 프로젝트 1개 생성 (`pnpm create next-app dogfood-test`)
- [ ] `dogfood-test` 디렉토리에서 Claude Code 새 세션 시작
- [ ] spec §7-1 한 줄 명령 입력 (단 repo URL 은 local file 경로로 임시 대체)
- [ ] Claude 가 CLAUDE.md fetch → Step 0-5 끝까지 수행
- [ ] 사용자(나) 는 Step 1 의 질문에만 답변
- [ ] 결과: dogfood-test 에 `/mfa-enroll` + login MFA stage + layout guard 자동 적용
- [ ] dev 서버 띄워 검증 시나리오 통과
- [ ] **iUPPITER 노출 0** 재확인 (dogfood-test 도 grep)

## 2. 의존성 / 순서

```
Task 1 (scaffold)
    ↓
Task 2 (core) ←─────────── 독립 (firebase mock 필요시 sinon-firebase 검토)
    ↓
Task 3 (react) ←────────── core 완성 후
    ↓
Task 4 (CLAUDE.md)         ← react API 확정 후 (Step 4 구체 코드 가능)
    ↓
Task 5 (nextjs-playground) ← react 완성 후. demo + real 모드
    ↓ (병렬 가능)
Task 6 (scripts)           ← Task 1 후 언제든
Task 7 (docs)              ← Task 5 후 (예제 코드 포함)
    ↓
Task 8 (3축 검증)
```

## 3. Time table (총 ~7h)

| Task | 시간 |
|---|---|
| 1. Repo scaffold | 30분 |
| 2. core | 60분 |
| 3. react | 90분 |
| **4. CLAUDE.md orchestration playbook** | **30분** |
| 5. nextjs-playground (demo + real) | 90분 |
| 6. scripts | 30분 |
| 7. docs (6개 문서) | 75분 |
| 8. 3축 검증 (격리 + real + dogfood) | 30분 |
| **합계** | **~7h** |

## 4. 위험 / 미확정

| 항목 | 위험 | 대응 |
|---|---|---|
| Next.js 14 + Firebase JS SDK ESM 호환 | `next.config` transpile 설정 필요 | 첫 dev run 시 발견 → transpilePackages 추가 |
| pnpm workspace + tsup composite | dts 경로 깨질 가능성 | tsup `entry` 명시 + types 검증 |
| `qrcode` 가 Node-only API | Next.js client component 에서 동작? | dynamic import 또는 dataURL 사전 생성 |
| iUPPITER 격리 누락 | grep 한 번 누락 시 brand leak | Task 8-1 격리 grep 명령을 CI 에도 추가 검토 |
| Mock Auth 의 TOTP 검증 | RFC 6238 알고리즘 직접 구현 필요 | otplib 또는 `@otplib/preset-default` 사용 (~5kb) |
| Claude playbook 의 framework detect 정확도 | 다양한 setup 패턴 — 일부 못 잡을 가능성 | Task 4 작성 시 Next App/Pages/Vite/CRA 4개 패턴 우선. 그 외는 fallback prompt |
| Authenticator 앱 시계 동기화 실패 | 사용자 디바이스 시간 어긋남 시 enroll 실패 | enable script 에서 `adjacentIntervals=5` 적용 + troubleshooting 명시 |

## 4. Phase 1 산출 후 상태

- private GitHub repo 가능 (또는 로컬 only)
- npm publish 전
- RN 미포함
- Recovery codes 미포함
- BE middleware 는 docs 스니펫만

## 5. Phase 1 → Phase 2 게이트

Phase 2 (Public release) 진입 전 확정:
- [ ] npm scope 확정 (`@<gh-user>`)
- [ ] GitHub repo URL 확정 + push
- [ ] LICENSE 의 copyright 라인 확정
- [ ] CHANGELOG 초기 entry (changesets `add`)
- [ ] GitHub Actions CI green
- [ ] npm 2FA 활성 (publish 보안)

## 6. 실행 진입 조건

다음 중 어느 것이든:
- 사용자가 "Phase 1 진행" 명시
- 사용자가 §0 사전 준비 (GitHub username + 검증용 Firebase project) 확정

→ 진입 시 Task 1 부터 순서대로 실행. 각 Task 끝나면 TaskUpdate 로 진행률 추적.
