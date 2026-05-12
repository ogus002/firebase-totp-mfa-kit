# Strategy Redesign v3 — Design Doc

> 2026-05-12. 사용자 ultrathink 메타 피드백 ("내 추천이 incremental + conservative bias") 이후 외부 시선 2차 검증 (codex high + plan-ceo-review SCOPE REDUCTION) 으로 strategic reframe.

## 0. Context

사용자가 ~2일 동안 firebase-totp-mfa-kit 의 spec v2 를 codex review v1 채택 후 설계 완료. Phase 1 CLI alpha 코드 + GCP project 활성 검증까지 완료. 이번 세션에서 사용자가 (1) 운영비 회수 광고 분석, (2) UI/UX + 모바일 테스트 모듈, (3) Claude/Codex encode 편의성 명시 요구. brainstorming 진행 중 사용자 메타 피드백 — 추천이 너무 기존 방향 유지, 외부 시선 + 냉정한 평가 + codex high 검증 + 놓친 axes 식별 부족.

대응: codex high (gpt-5.5, 136K tokens, web search) 외부 검증 + plan-ceo-review SCOPE REDUCTION mode 3차 시선. 두 외부 lens 가 brainstorming 의 5 결정 모두 reverse 권고.

## 1. Inputs

| 파일 | 역할 |
|---|---|
| `spec.md` (v2, 2026-05-12, 683 lines) | 현재 design source of truth |
| `README.md` | public hero |
| `internal/business-plan.md` (v2) | 수익 모델 |
| `internal/market-validation-2026-05-12.md` | 시장 평가 (agent 기반 7.5/10) |
| `internal/codex-review-2026-05-12.md` | 1차 codex review (Phase 0) |
| `docs/2026-05-11-firebase-totp-mfa-guide.md` | rosetta-stone 기술 가이드 |
| `.superpowers/brainstorm/1085-1778579273/codex-axis-review.md` | 이번 세션 codex high 답 (5 axes) |

## 2. 5 결정 이력 (D1-3A)

### D1 — Implementation Approach
**선택**: A. Codex Focus + $299 Audit Service (Minimal Viable).
**근거**: codex web-searched evidence — Firebase npm 3.06M wk vs 본 kit narrow add-on. HN/Reddit 시장은 stars 만 만들지 $30/mo subscription 못 만듦. setup friction wedge size 작음.
**대안 거부**:
- B (이번 세션 5 결정 유지) — codex 가 5 결정 모두 reverse 권고. AI hero 가 LLM trust 장벽 악화.
- C (10x Cathedral — Firebase Auth hardening platform) — 1인 운영 burden, Lucia (March 2025 deprecated) burn-out 위험.

### D2 — plan-ceo-review Mode
**선택**: SCOPE REDUCTION (surgeon mode).
**근거**: Approach A 일치. ruthless cut + 최소 viable.

### 1A — `firebase-totp-mfa update/diff` 명령 신규
**이슈**: codex axis-3 "Own-code divergence HIGH severity". spec.md:150-153 가 "CLI update 명령은 diff 표시 + 사용자 승인 후만 변경" 명시하지만 spec.md §4 Commands 사양에 update 명령 자체 없음. shadcn-style copy 가 rots.
**선택**: spec §4 신규 §4-5 `update/diff` 명령 + registry version metadata.

### 2A — `docs/PRODUCTION-CHECKLIST.md` 신규
**이슈**: codex axis-3 3 HIGH — Liability (AI/CLI mutates auth + breach blame), Solo-maintainer drag (Firebase API breaking changes), Clerk/Supabase/Auth.js 이탈.
**선택**: 신규 1 doc 통합 — setup verify + server enforce gate + recovery + liability boundary + support policy + version matrix + Firebase-only disclaimer + sustainability note.

### 3A — Passkey roadmap + "Use only if staying on Firebase" disclaimer
**이슈**: codex axis-3 Passkey displacement HIGH (TOTP-only 24개월 내 legacy). + Auth.js → Better Auth 추세. + Lucia (March 2025 deprecated) 경고.
**선택**: spec §12 + README + PRODUCTION-CHECKLIST 단정 명시. spec §14 결정 사항에 Lucia-style sustainability statement 추가.

## 3. Phase 2 — Must Items (6, ship-blocking)

| # | 항목 | 위치 | 소요 (human / CC) |
|---|---|---|---|
| 1 | "30s" headline 교체 → "Firebase TOTP MFA in 10 minutes — with auditable diffs" | `README:3`, `spec:4,24,407` | 30min / 5min |
| 2 | AdSense 를 internal/business-plan core BM 영역에서 제거 (note 만 유지) | `internal/business-plan:28-114` 재구성 | 1h / 15min |
| 3 | Phase 3 RN 근시 commitment 제거 (조건부 trajectory 로 reframe) | `spec:452` | 30min / 10min |
| 4 | `firebase-totp-mfa update/diff` 명령 spec §4-5 신규 + registry version metadata | `spec §4` | 2h / 30min |
| 5 | `docs/PRODUCTION-CHECKLIST.md` 신규 7-section | 신규 file | 6-8h / 1-2h |
| 6 | "Use only if staying on Firebase Auth" disclaimer | README hero + PRODUCTION-CHECKLIST §6 + spec §12 | 30min / 10min |

소소한 ADD:
- npm `firebase-totp-mfa` stub publish (이름 확보)
- Passkey roadmap mention spec §12
- Lucia-style sustainability note spec §14
- README + business-plan 의 KPI 를 codex honest forecast 로 down-revise

총 Must 소요: human ~12-15h / CC ~3-5h.

## 4. Phase 2 — Nice Items (validation artifact, ship-after)

| # | 항목 | 소요 | 가치 |
|---|---|---|---|
| 1 | Hosted demo site (Firebase Hosting + custom domain) | human ~6h / CC ~1.5h | HN/r/* 노출 시 conversion |
| 2 | 90s orchestration screen video | human ~3h | Twitter/X / HN inline |
| 3 | 1-3 case studies — real Firebase app 적용 + timestamps | human 1-2주 (real users 필요) | demand validation |
| 4 | SEO long-tail pain pages 3-5 (`403 enable`, `auth/requires-recent-login`, `recovery codes`) | human ~2-3일 | inbound discovery |
| 5 | $299 fixed-fee "Firebase MFA integration review" 서비스 launch | human ~1주 (page + Stripe + 운영) | Pro tier 대신 BM 검증 |
| 6 | 15 founder/agency demand 인터뷰 (codex $50k plan) | human ~2-3주 | demand qualification |
| 7 | 5 hands-on installs in real repos (codex $50k plan) | human ~1-2주 | install validation |
| 8 | Show HN with live demo + production checklist | human ~1주 prep | endpoint launch |

## 5. File-Level 수정 명세

### 5-1. spec.md (현재 683 lines)

| § | 변경 | 영향 line |
|---|---|---|
| Header | tagline 교체. "Add it in 30 seconds. Own the code." → "Firebase TOTP MFA in 10 minutes — with auditable diffs. CLI primary · Own the code · Agent-compatible" | 4 |
| §0 TL;DR | "약 10분" → "10-minute install + 30-second code insertion. AI assistants can drive the CLI via CLAUDE.md/AGENTS.md (agent-compatible)" | 24 |
| §1 목적 | HOW 행: "(1) CLI deterministic primary. (2) AI agent-compatible — Claude/Codex can call the CLI. (3) Own the code." (AI hero 격하, agent-compatible 으로 표현) | 34-35 |
| §4 Commands | 신규 §4-5 `update/diff` 추가. registry version metadata 명세 | 220 부근 신규 |
| §7 Claude/Codex | **header 만** "Fallback Layer" → "Agent Compatibility Layer". §7-1 본문 ("CLI 가 primary, AI 는 fallback") 그대로 유지 — codex 결론 = CLI primary 가 정답. brainstorming 결정 D3 (AI primary) 가 reverse 됐으므로 본문 reaffirm | 333-381 |
| §10 Phase 분할 | Phase 3 RN 행 — "조건부: Phase 2 traction 검증 (5 case studies + 3 Pro pay willing) 시" 명시 | 452 |
| §11 검증 체크리스트 | Phase 1 Task 8-2 의 "real mode 검증" 항목 stub 상태 명시 (memory feedback 반영) | 462-510 |
| §12 한계 | 신규 행: "TOTP-only 24-month horizon — Passkey/WebAuthn adoption 가속 (FIDO/Google/Apple). 본 kit 의 Phase 5 = TOTP backup factor + passkey first-class adapter" | 515-528 신규 |
| §12 한계 | 신규 행: "Use only if staying on Firebase Auth. Migrating to Clerk / Supabase / Auth.js → use native MFA" | 동 |
| §14 결정 사항 | 신규 행: "Sustainability — 1-person operator. Lucia (March 2025 deprecated) 경고 모델. Phase 4 Pro tier launch 는 3명 paying 요청 검증 후 — 미리 build 금지" | 560-579 부근 신규 |
| 부록 B docs index | PRODUCTION-CHECKLIST.md 행 추가. `2026-05-11-firebase-totp-mfa-guide.md` 행 추가 (현재 부록 미등록 — memory feedback 반영) | 628-642 |

### 5-2. README.md (현재 52 lines)

- Hero (`:3`): `> Firebase TOTP MFA in 10 minutes — with auditable diffs.` + sub-text 줄: `shadcn-style CLI · Own the code · Agent-compatible (Claude Code / Codex)`
- "Why" 섹션 (`:36-41`): 첫 줄 "SMS cost = 0" 유지. 마지막 줄에 disclaimer 추가: `Built for teams staying on Firebase Auth. Migrating? Use Clerk/Supabase/Auth.js native MFA.`
- "Status" 섹션 (`:43-47`): `🚧 Phase 1 (CLI alpha) — published as stub on npm. Production checklist + update command shipping in Phase 2.` 로 갱신

### 5-3. internal/business-plan.md (현재 ~190 lines)

- §2-1 (현실적 가설) — 가장 위에 한 줄 강조 추가: "**AdSense 는 BM 아님 — 도메인비 회수 수준. 진짜 수익원 = $299 audit service + GitHub Sponsors. Pro tier 는 3명 paying 검증 후만 build.**"
- §2-2 표 — Pro tier 행 우선순위 2 → 3 down. $299 audit service 행 신규 추가 (우선순위 2, 소요 1주 page+Stripe, MVP 1년 목표 = $3K-$8K)
- §7 마케팅 채널 — Tier 1 채널 별 codex $50k 30-day plan task 맵핑 추가
- §9 KPI — codex honest forecast 로 갱신:
  - GitHub stars 12개월: 500-1500 → **150-600**
  - npm 주간 DL: 200-500 → **40-250**
  - Pro tier 유료 사용자 (Phase 4): 5-20 → **0-3 (가설, validation 후 build)**
  - $299 audit service: 신규 행, **분기 2-5건 × $299 = $2.4K-$6K/년**

### 5-4. docs/PRODUCTION-CHECKLIST.md (신규)

```markdown
# Production Checklist

Required reading before deploying firebase-totp-mfa to production.

## 1. Pre-flight Setup Verification

- [ ] gcloud auth correct project (`gcloud config get-value project`)
- [ ] `npx firebase-totp-mfa doctor` 모든 항목 green
- [ ] Firebase Web App config 6값 in `.env.local` (NOT committed)
- [ ] At least 1 test user with `emailVerified=true` (CLI sets via admin API)
- [ ] `npx firebase-totp-mfa verify` scenarios 5/5 통과

## 2. Server Enforcement Gate

⚠️ Client-side guard (`<MfaGuard>`) is NOT a security boundary. Mandatory:

```ts
import { admin } from './firebase-admin';
const decoded = await admin.auth().verifyIdToken(idToken);
if (!decoded.firebase?.sign_in_attributes?.mfa_factor_uid) {
  throw new AppError(403, 'MFA required');
}
```

`docs/SERVER-MFA-VERIFY.md` 의 4 framework snippets 중 본인 stack 적용.

## 3. Recovery / Lockout

- 10 backup codes (hash 저장) → 사용자 download
- Admin reset SOP — 2명 합의 (multisig 패턴) 또는 단순 `admin.deleteUser` + 재초대
- `docs/RECOVERY-CODES.md` 참조

## 4. Liability Boundary

본 kit 은 MIT 라이센스로 제공되며 **no warranty**. 다음을 명시 인지:

- shadcn-style source copy → 사용자 코드로 owned. 보안 audit 책임은 사용자
- Firebase API breaking change 시 본 kit 의 update 가 지연 가능. `update/diff` 명령으로 사용자 통제
- LLM (Claude / Codex) 가 본 kit 호출 시 deterministic CLI 만 mutation — 단 사용자 환경 변화는 사용자 책임

## 5. Support Policy + Version Matrix

| Kit version | Firebase SDK | Firebase Admin SDK | Identity Platform |
|---|---|---|---|
| 0.x (alpha) | >=10.6 <12 | >=11.6 <13 | TOTP enabled |

- GitHub issues: best-effort 응답 7-14일 (1-person operator)
- 보안 issue: GitHub Security advisory + 5일 내 응답 약속
- $299 fixed-fee integration review service — 우선 지원

## 6. "Use Only If" Disclaimer

본 kit 의 적합한 사용자:

✅ Firebase Auth 의 email/password (or OAuth) 사용 중
✅ Identity Platform upgrade 결정 또는 이미 활성
✅ Next.js / Vite / CRA / Expo (Phase 3) React 프로젝트
✅ TOTP MFA 로 충분 (Phase 5 까지 Passkey 안 기다림)

부적합한 사용자:

❌ Auth.js / Clerk / Supabase / Stack Auth / Better Auth → native MFA 사용
❌ Custom auth (Firebase 아님) → 본 kit 미적용
❌ Passkey-only 정책 → Phase 5 대기 또는 다른 솔루션

## 7. Sustainability Statement

본 kit 은 1-person operator (운영자: 본 README footer 참조) 가 maintain. Lucia (March 2025 deprecated) 와 같은 abandonment 위험을 인지:

- Phase 4 Pro tier launch = 3명 paying user 명시 요청 후만 build
- 본 kit fork 권장 — MIT 라이센스. 운영 중단 시 사용자가 자가 maintain 가능
- `update/diff` 명령으로 사용자 own copy 가 upstream 와 diverge 해도 사용자 통제

## Sign-off

| Checked | Reviewer | Date |
|---|---|---|
| □ | | |
```

(이 outline 이 Phase 2 작성 시 채워질 doc 의 초안. 7 sections 약 80-100 lines 본문 예상)

### 5-5. AGENTS.md / CLAUDE.md (현재 ~40 lines, 동일 내용)

변경 미세:
- header "fallback playbook" → "**agent-compatible playbook** (CLI primary; AI 가 CLI 호출)"
- "절대 금지" 5개 그대로 유지 (codex 가 LLM trust 장벽 우려 — 정확히 5개 hard rule 가 그 대응)

## 6. Acceptance Criteria

Phase 2 launch 전 통과 필수:

- [ ] spec.md / README.md / business-plan.md / AGENTS.md / CLAUDE.md hero + KPI 갱신 완료
- [ ] `firebase-totp-mfa update/diff` 명령 spec §4-5 명세 완료 (코드 구현은 Phase 2 plan 의 별도 task)
- [ ] `docs/PRODUCTION-CHECKLIST.md` 7-section 완성
- [ ] Passkey roadmap spec §12 추가
- [ ] Sustainability note spec §14 추가
- [ ] "Staying on Firebase only" disclaimer README + PRODUCTION-CHECKLIST + spec §12 명시
- [ ] npm `firebase-totp-mfa` stub publish (이름 확보)
- [ ] 부록 B docs index 에 `2026-05-11-firebase-totp-mfa-guide.md` 추가
- [ ] 기존 spec §11 검증 체크리스트 의 playground real mode 항목에 stub 상태 명시 (memory feedback 반영)

Phase 2 launch 후 (validation artifact 카테고리):

- [ ] hosted demo site 활성
- [ ] 90s video
- [ ] 1-3 case study
- [ ] SEO 3-5 pages
- [ ] $299 audit service page + Stripe
- [ ] 15 founder/agency 인터뷰 진행
- [ ] 5 hands-on installs in real repos
- [ ] Show HN endpoint

## 7. NOT in Scope (defer / reject)

| 항목 | 이유 |
|---|---|
| AI orchestration hero reframe | codex: LLM trust 장벽 악화. CLI primary 유지가 정답 |
| Mobile/Desktop visual QA side-by-side dual | codex: overbuilt for wedge. shipped example screenshot regression 만 |
| Pro tier Phase 3 accelerate | codex: 3명 paying 명시 요청 전까지 build 금지. $299 audit service 가 BM validation 도구 |
| 3 new docs (AI-FIRST/VISUAL/MOBILE) | codex: bloat before proof. 1 PRODUCTION-CHECKLIST 만 |
| Phase 3 RN 근시 (현재 spec:452) | codex: Firebase web credibility 먼저 |
| AdSense core BM 영역 | codex v2 결정 강화. note 만 유지 |
| Passkey adapter Phase 2 구현 | mention only. Phase 5 |

## 8. What Already Exists (leverage)

- shadcn-style registry pattern ✓ (사용자 owns code)
- Firebase IDP Admin REST API ✓ (CLI wraps)
- otplib RFC 6238 ✓ (Demo + Real 동일 알고리즘)
- 운영자의 prior production codebase 의 admin TOTP 경험 ✓ (origin 격리 isolation 유지)
- shadcn-ui CLI v4 (agents support, dry-run, diff) — pattern leverage
- Phase 1 자산 (CLI alpha 코드 / registry 12 source files / docs 11개) — 90% 그대로 유지

## 9. Failure Modes (codex axis-3, 10 items)

| # | Axis | Severity | 1-day fix | Phase |
|---|---|---|---|---|
| 1 | Liability (AI mutates auth + breach blame) | HIGH | PRODUCTION-CHECKLIST §4 + no warranty | 2 must |
| 2 | Honest onboarding time (30s vs 10min) | HIGH | hero + tagline 교체 | 2 must |
| 3 | Solo-maintainer drag (Firebase breaking) | HIGH | PRODUCTION-CHECKLIST §5 version matrix | 2 must |
| 4 | Own-code divergence (copy rots) | HIGH | `update/diff` 명령 신규 | 2 must |
| 5 | Passkey displacement (24mo dating) | HIGH | spec §12 roadmap + README | 2 must |
| 6 | Clerk/Supabase/Auth.js 경쟁 | HIGH | "Staying on Firebase only" disclaimer | 2 must |
| 7 | Search dominance (Firebase docs #1) | MEDIUM | SEO long-tail pain pages 3-5 | 2 nice |
| 8 | Demo abuse / phishing template | MEDIUM | watermark + abuse note + fixed creds | (이미 spec:304-318 처리됨) |
| 9 | Origin branding leakage (manual grep only) | MEDIUM | CI brand denylist gate | 2 nice |
| 10 | npm package-name risk | MEDIUM | stub publish (이름 확보) | 2 must (소소한 ADD) |

## 10. Dream State Delta (12-month)

| Current (2026-05-12) | Phase 1 ✓ | Phase 2 endpoint | 12-month ideal |
|---|---|---|---|
| spec v2 + CLI alpha 코드 | GCP project 활성 검증 ✓ | spec v3 (이 doc 반영) + 6 must + npm stub + audit service | 150-600 stars / 40-250 wk DL / 2-5 audit service 분기 / passkey adapter Phase 5 시작 / 1 case study / Show HN done |

## 11. 의사결정 자취 (외부 검증)

1. **사용자 메타 피드백 (2026-05-12)** — "추천이 incremental + conservative bias. ultrathink 정신 못 살림" — 자가 비판 + 외부 시선 2차 도입 결정
2. **codex high (gpt-5.5, 136K tokens, web_search_cached)** — 5 axes 답. brainstorming 5 결정 모두 reverse 권고. forecast 1/3-1/2 down-revise. `.superpowers/brainstorm/1085-1778579273/codex-axis-review.md`
3. **plan-ceo-review SCOPE REDUCTION** — Approach A 확정. update/diff (1A) + PRODUCTION-CHECKLIST (2A) + Passkey+disclaimer (3A) 3 actionable add

## 12. 다음 step

1. ✓ Design doc 작성 (이 file)
2. → Spec self-review (brainstorming skill Step 7) — placeholder / consistency / scope / ambiguity inline check
3. → 사용자 design 검토 + approval (Step 8)
4. → writing-plans skill 호출 (Step 9) — 본 design 의 Phase 2 must 6 + nice 8 을 task-level execution plan 으로 분해
