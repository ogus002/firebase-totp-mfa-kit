# 인터랙티브 TOTP 데모 (라이브 플레이그라운드) 설계서

**Status:** Approved (brainstorming 2026-06-01)
**Goal:** totp.antmon.kr 방문자가 **실제 TOTP MFA 전체 라이프사이클** (등록 → 로그인 challenge → 복구 코드)을 브라우저에서 직접 체험하게 한다. 컨버전(npm 설치/설치 가이드 유입)을 높이고, "이렇게 설정된다"를 말이 아닌 경험으로 보여준다.

**핵심 결정:** 100% **client-side**. 실제 RFC-6238 TOTP (mock 아님) 이지만 Firebase·계정·백엔드 **persist 는 없음**. 따라서 남용 방지(IP 추적/rate-limit) 불필요 — 악용할 백엔드·비용·인증 상태가 없음.

---

## 1. 범위 (Scope)

### In scope
- `website/` 내 self-contained 단일 데모 페이지 `/demo`
- per-session 랜덤 TOTP 시크릿 → 진짜 QR → authenticator 앱으로 실제 스캔/검증
- 3단계 라이프사이클:
  1. **Enroll** — QR + 수동 키 + 6자리 검증 → 성공 시 복구 코드 8개 발급(복사)
  2. **Sign-in challenge** — "다음 로그인" 시뮬레이션. 탭 2개: [Authenticator 코드] / [복구 코드 사용] → 검증 → 로그인 성공
  3. **Done** — 완료 + CTA (설치 가이드 링크 + `npx firebase-totp-mfa add next ...`)
- 앱 없는 방문자용 "유효 코드 보기" 보조 링크 (이탈 방지/접근성)
- 영어 (현재 사이트와 일관). 다국어는 범위 외

### Out of scope (명시)
- Firebase 연동 / 실제 계정 / enrollment persist
- 남용 방지(App Check / Turnstile / rate-limit / IP 추적) — client-side 라 표면 자체가 없음
- 다국어(i18n)
- CLI 의 실제 auth 레지스트리(`packages/cli/src/registry/hooks/useTotpEnroll.source.ts`) 수정 — **건드리지 않음** (kit hard rule: auth 코드는 CLI 경유만). 데모는 website 자체 구현

---

## 2. 아키텍처 (Approach A)

```
website/
├── pages/demo.tsx              # 상태머신 오케스트레이션, 현재 step 렌더
├── lib/demo-totp.ts            # 순수 함수 (otpauth 기반) — 단위테스트 대상
├── lib/demo-totp.test.ts       # RFC-6238 벡터 + 고정 timestamp 결정적 테스트
└── components/demo/
    ├── Stepper.tsx             # 진행 표시 shell
    ├── EnrollStep.tsx          # QR + 검증 + 복구코드 발급
    ├── ChallengeStep.tsx       # authenticator/복구 코드 탭 + 검증
    ├── DoneStep.tsx            # 완료 + CTA
    ├── CodeInput.tsx           # 공용 6자리 입력
    └── RecoveryCodes.tsx       # 복구 코드 표시 + 복사
```

- 정적 export 호환: `demo.tsx` 는 client component. Next 가 shell 을 prerender, 브라우저에서 hydrate. otpauth/qrcode 전부 브라우저 실행. 서버 API 없음 → `output: 'export'` 그대로
- 라우트: `/demo` (trailingSlash → `/demo/`). Layout 의 title/description/canonical = `https://totp.antmon.kr/demo/`
- 진입점: 홈 CTA "Try the live demo" + 헤더 nav "Demo" + setup 가이드 페이지 링크

---

## 3. 데이터 흐름 / 상태머신

`demo.tsx` 상태:
- `step: 'enroll' | 'challenge' | 'done'`
- `secret`: per-session 랜덤 (otpauth Secret) — **React ref 에 보관, 전송·저장 0, reset/unmount 시 폐기**
- `recoveryCodes: string[]`, `usedRecovery: Set<string>`

흐름:
1. mount/enroll: `createSecret()` → `buildOtpauthUrl(secret, label='demo@totp.antmon.kr', issuer='firebase-totp-mfa (demo)')` → `qrcode` 로 data URL → 표시. 수동 키(Base32) 펼치기
2. enroll 검증: 6자리 입력 → `verifyCode(secret, code, window=1)` → 성공 시 `generateRecoveryCodes(8)` 후 복구코드 공개 → `step='challenge'`
3. challenge: [Authenticator] 탭 → `verifyCode` / [복구] 탭 → `recoveryCodes` 매칭 & `usedRecovery` 에 추가 → 성공 시 `step='done'`
4. done: CTA. "Start over" 시 reset

---

## 4. 기술 / 의존성

- **신규 deps (website/ 한정, `npm install --ignore-scripts`)**:
  - `otpauth` — 브라우저 안전 RFC-6238 TOTP 생성/검증
  - `qrcode` + `@types/qrcode` (devDep)
  - `vitest` (devDep) — 순수 lib 단위테스트
- TOTP 파라미터: **SHA1 / 6 digits / 30s period** (authenticator 앱 + Firebase 표준과 일치)
- 검증 window: **±1 step** (시계 드리프트 허용. Firebase 의 adjacentIntervals 개념을 데모용으로 축소)
- 복구 코드: 8개, `xxxx-xxxx` 형식(영숫자), 브라우저에서 랜덤 생성

---

## 5. 에러 처리 / 엣지

- 오답 코드 → 인라인 에러 + 해당 step 유지, 재시도
- 시계 드리프트 → window ±1 로 흡수
- 클립보드 복사 실패 → fallback (textarea select)
- 카메라/앱 없음 → 수동 키 노출 + "유효 코드 보기" 보조 링크 (`currentCode(secret)`)
- "Start over" 재시작 (secret 폐기 후 새 시크릿)
- a11y: 입력 label, `inputMode=numeric`, `autocomplete=one-time-code`, reduced-motion 존중, QR `alt`

---

## 6. 보안 / 스코프 노트

- **100% client-side.** 시크릿은 브라우저 메모리(ref)에만 존재, 네트워크 전송·localStorage 저장 없음, reset/페이지 이탈 시 폐기
- Firebase·계정·env·서버 없음 → **남용 표면 0** (요청당 비용·영속 상태 없음)
- 상단 배너: "Demo — 실제 계정/Firebase 아님. 설치 시 생성되는 UX 그대로"
- kit 의 #1 신뢰 위험(LLM 이 auth 코드 수정)과 분리: 본 데모는 마케팅 사이트의 self-contained 코드이며 CLI 레지스트리 auth 코드를 수정하지 않음. TOTP 는 RFC-6238 표준 구현
- Phase 2-B 자동화 가드와 무관 (cron/secret 안 씀)

---

## 7. 테스트

- `lib/demo-totp.test.ts` (vitest):
  - `verifyCode` — RFC-6238 표준 테스트 벡터 + 고정 timestamp(otpauth `validate({timestamp})`)로 정답/오답/드리프트(±1) 결정적 검증
  - `generateRecoveryCodes` — 개수/형식/유일성
  - 복구 코드 소비 로직(매칭 + 중복 사용 거부)
- UI: `npm run build` 정적 export 통과 + 수동/browse QA (enroll→challenge→done 시각 확인, 오답 에러 표시)
- website 에 `"test": "vitest run"` 스크립트 추가

---

## 8. 기존 자산과의 관계

- `examples/nextjs-playground` 의 demo-mode(고정 DEMO_SECRET, App Router, i18n)는 **참고만** 하고 이식하지 않음 (Pages Router·Tailwind·정적·per-session 시크릿으로 새로 구현하는 게 더 작은 작업 — brainstorming 에서 접근법 B 기각)
- `useTotpEnroll.source.ts` 의 UX 패턴(QR→검증→done, secret 폐기 규율)은 데모 UX 의 레퍼런스

---

## 관련 메모리
- [[project-playground-real-mode-stub]] — 기존 playground real-mode stub (이식 안 하는 근거)
- [[project-phase2b-deploy-choice]] — website 배포/도메인(totp.antmon.kr)
- [[reference-operator-gcp-artifacts]] — 데모 Firebase 프로젝트(이번 범위 밖이지만 향후 real-Firebase 데모 시 참조)
