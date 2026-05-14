# 설계: Phase 2-B 검증 전략 — 자동화 dogfooding + 시장 도구 (v3 lock)

생성: 2026-05-14 (office-hours + codex review + 사용자 항목별 결정)
브랜치: main
저장소: ogus002/firebase-totp-mfa-kit
상태: DRAFT v3 (사용자 검토 대기 → commit → writing-plans)
이전 설계: `2026-05-12-strategy-redesign-v3-design.md`

진행 기록:
- **v1** (자동화 dogfooding base) — D7=C 로 선택
- **v2** (codex 5항목 전면 수용) — D9=A. 자세히 안 읽고 승인된 잘못된 결정. 폐기.
- **v3** (현재) — codex 5항목 항목별 재검토. ①②③④ 거부, ⑤만 수용. v1 base 유지 + codex 의 actionable 도구만 추가.

---

## 1. 문제 정의

`firebase-totp-mfa-kit` alpha publish 직후 (2026-05-14). Phase 2-B 진입 시점에 8가지 일 (시연 호스팅 / 90초 영상 / 사례 연구 / 검색 페이지 / 보안 점검 유료 서비스 / 사용자 인터뷰 15건 / hands-on 설치 5건 / Show HN) 의 우선순위와 실행 방식을 결정해야 함.

제약:
- 운영자 1인
- iUPPITER 본업 병행
- 6-12개월 검증 window (단일)

## 2. 수요 증거 (없음 인정)

- 운영자가 실제 사용자를 관찰한 적 없음 → 직접 측정된 수요 신호 0
- firebase 사용자 다수가 MFA 없이 운영 중 (현재 우회법 = "아무것도 안 한다")
- 시장이 firebase MFA 를 절실히 필요하다고 느끼지 않음

**결론**: 검증된 수요가 아니라 미래 가설에 거는 early-mover 베팅.

## 3. 사용자 동기 (정직)

운영자 본인 명시:
> "향후 AI 기반 firebase 프로젝트가 많이 생겨나고 그 중 SaaS 가 필수 요소로 자리잡으면 2차 인증이 필요해진다고 생각함. 정보 제공의 선점함으로써 1인 개발자 시대에 도움이 되고 필요한 인기를 얻어 나의 포트폴리오를 적립한다는 계획."

분해:
- 미래 가설 1: AI 기반 firebase 프로젝트 증가 (verify 안 됨)
- 미래 가설 2: 그 중 SaaS 가 보안상 MFA 필요해질 것 (verify 안 됨)
- 운영자 동기: 이력 쌓기 + 검색 결과 선점 + 인기
- 수익은 부수 (조건부 추구)

codex 정의: 본 프로젝트는 순수 SaaS 사업이 아니라 **"개발자 평판 자산 (developer reputation asset)"** — 미래 수요가 생길 때 검색·npm·GitHub 에 이미 자리잡아 신뢰와 이력을 확보하려는 선점 베팅.

## 4. 확정 전제 (4개, v1 그대로 유지 — codex ② 거부)

1. **진짜 목표 = 이력 쌓기 + 검색 결과 선점** (돈은 부수). 메모리의 수익 4가지 (시연 호스팅 + 광고 + 유료 등급 + 컨설팅) 는 우선순위 재정렬만 — 종결 X.
2. **시장은 현재 절실히 안 찾음 → 미래 베팅 프로젝트**. 검증된 수요가 아닌 가설에 거는 선점.
3. **첫 시작 = 검색 페이지 1-2개 + 보안 점검 결제 1건** (v1 그대로). 자동화 dogfooding 으로 셋업.
4. **검증 window = 6-12개월 단일**. wedge 검증 신호 (검색 1페이지 노출 또는 결제 1건 또는 npm DL 1K+ 또는 stars 50+) 나오면 다음 일 확장. 안 나오면 재설계 or 중단. (codex ② 거부 — 자동화 셋업 시간 고려 시 2-4주 비현실)

## 5. 비교한 실행 방식 (v1 의 A/B/C + v2 의 D)

### A) 정공법 — 검색 페이지 + 결제 1건 (수동)
- 약 15일 공수 / 위험 중

### B) 소극적 — 검색 페이지만
- 약 10일 공수 / 위험 낮음 / 결제 신호 빠짐

### C) ⭐ AI 자동화 dogfooding — 본 kit 자체를 도구로 (v3 선택)
- 검색 페이지 + 보안 점검 + Claude/AI 자동화로 1인 시간 한계 보완
- 자동화 셋업 ~10일 + 매주 1일
- 위험: 중 (자동화 셋업 추가 공수, 실패 시 일정 지연)
- 핵심 장점:
  - 본 kit 셀링 포인트 (AI orchestration 친화) 자체 검증
  - 1인 시간 한계를 본인 도구로 해결 → 살아있는 case study
  - 자동화 셋업 자체가 콘텐츠 (블로그 포스트, 영상 시나리오)
  - 8개국어 i18n 자산을 자동 생성/번역 파이프라인으로 활용 (시너지)

### D) 가장 작은 판매 실험 — codex 권장 (v2, 폐기됨)
- 정적 페이지 + 결제 + outreach, 자동화 skip
- 거부 이유: 운영자 motivation (셀링 포인트 검증) 과 충돌. 자동화는 본 kit 의 brand story.

## 6. 선택된 접근: C (자동화 dogfooding) + codex ⑤ 도구 흡수

### 선택 이유
- 본 kit 의 핵심 셀링 포인트 ("AI orchestration friendly") 를 본인이 직접 검증
- 1인 운영자 시간 한계를 본인 도구로 해결 → 그 자체가 살아있는 case study
- 자동화 셋업 과정이 콘텐츠 (검색 페이지의 원료, 영상 시나리오)
- 8개국어 i18n 자산을 자동 생성/번역 파이프라인으로 활용 → long-tail SEO 선점
- dogfooding 실패 시에도 그게 정직한 시장 신호 — 브랜드 메시지에 반영 가능
- 사용자가 "1인 개발자 시대" 동기를 명시한 것과 일치

### 실행 단계 (구체)

**1개월 안 — 자동화 dogfooding 셋업**
1. Claude Code + GitHub Actions + Claude API 로 검색 페이지 자동 생성/업데이트 파이프라인 구축
2. 본 kit + 자동화 셋업 자체를 첫 콘텐츠로 (블로그 포스트 1, "How I built X with Claude Code in N days")
3. 8개국어 docs 자산 (메모리 [[reference-paths]] 의 i18n) 을 자동 검색 페이지로 변환 — 영어 + 한국어 + 일본어 + 중국어 + 스페인어 + 포르투갈어 + 독일어 + 프랑스어 (long-tail SEO 선점)

**2개월 안 — 검색 페이지 + 보안 점검 서비스 출시**
1. 검색 페이지 1-2개 우선 (자동 생성 파이프라인의 첫 산출물)
   - 페이지 1: `Firebase TOTP MFA setup for Next.js` (영어) + 한국어 보조 페이지
   - 페이지 2: `Firebase MFA security check for indie SaaS` (영어) — CTA = **$19 보안 점검**
2. 보안 점검 서비스 (**$19**, Claude/Codex $20 anchor 보다 싸게)
   - 결과물: 1-page report + auth flow review + env/config checklist + 48h 응답
   - 결제: Lemon Squeezy 또는 Tally + 수동 인보이스
   - GitHub issue template: "MFA audit request"

**3-6개월 — outreach + funnel 측정 (codex ⑤ 수용)**
1. **outreach 채널 구체 (수동 + 자동화 보조)**:
   - Reddit: `r/Firebase`, `r/nextjs`, `r/SaaS` — 각 게시물 1-2건 (가치 제공 + 도구 언급)
   - Twitter/X: "Firebase SaaS" / "Next.js Firebase" 검색 → 직접 댓글/DM
   - GitHub: Firebase + Next.js public SaaS template repo 20개 찾기 → maintainer 프로필/이메일로 짧게 연락 (issue 가 아니라 직접 메일)
2. **funnel 4단계 진단 (Plausible 또는 Vercel Analytics)**:
   - 방문 → CTA 클릭 → 문의 → 결제
   - 각 단계 0 일 때 진단:

**6-12개월 — 신호 측정 + 확장/중단 결정**
- 신호 양호 시 나머지 6 items (영상 / 사례 / 인터뷰 / hands-on / Show HN) 중 선택 확장
- 신호 0 시 재설계 (포지셔닝 변경) 또는 중단

## 7. funnel 진단 도구 (codex ⑤ 수용)

| 단계 | 측정 | 0 일 때 진단 | 액션 |
|---|---|---|---|
| 방문 | Plausible 또는 Vercel Analytics | 채널 문제 | outreach 채널 교체 또는 추가 |
| CTA 클릭 | 페이지 분석 | 메시지 문제 | 페이지 copy 재작성 (영어/한국어 둘 다) |
| 문의 / 시작 | GitHub issue + Tally form | 신뢰 문제 | 사회적 증명 추가 (testimonial, 사례, GitHub stars) |
| 결제 | Lemon Squeezy | 가격 문제 | $19 → $9 조정 또는 결과물 명확화 |

이 4단계 분리가 "재설계 vs 중단" 단순 이분법보다 actionable.

## 8. 가격 정책 ($19 — 사용자 결정)

- **anchor**: Claude Code / Codex 구독 $20 시작
- **본 kit 결제 $19** = anchor 보다 싸게 → 1차 결제 검증 가능성 ↑
- codex 가 권장한 $49 거부 이유: 신규 서비스 + 1인 운영자 + 1차 검증 단계 = 시장 진입 가격 anchor 가 낮아야 함
- 신호 누적 + 사례 1-2건 확보 후 $29 / $49 단계적 인상 가능 (3차 단계)

## 9. 열린 질문 (Phase 2-B plan 작성 시 결정)

- 자동화 도구 stack 세부 (Claude Code + GitHub Actions + Claude API + 무엇 더?)
- 검색 페이지 호스팅 위치 (Vercel / GitHub Pages / Cloudflare Pages / 본 kit npm README)
- 8개국어 자동 번역 파이프라인 구현 방식 (Claude API 직접 호출 vs Crowdin / Lokalise 등 i18n SaaS)
- 결제 처리 (Lemon Squeezy 추천, Tally + 수동 인보이스 대안)
- outreach 첫 채널 1-2개 우선순위 (r/Firebase vs Twitter vs GitHub maintainer)
- 메모리의 reference_business_model 갱신 — "수익 4가지" 의 우선순위 재정렬 명시

## 10. 성공 기준 (6-12개월 단일 window, v1 기준)

다음 중 하나 이상 도달:
- 검색 결과 "firebase totp mfa" 구글 1페이지 노출 (영어)
- 다국어 long-tail SEO 노출 (한국어 / 일본어 / 중국어 등)
- 보안 점검 서비스 결제 1건 (금액 무관)
- npm 다운로드 누적 1,000+
- GitHub stars 50+ 또는 recruiter inbound 1건

위 신호 모두 없으면 재설계 or 중단.

## 11. 배포 방식

- 검색 페이지: Vercel 또는 GitHub Pages (비용 0)
- 보안 점검 서비스: 본 kit 의 별도 docs 페이지 + Lemon Squeezy 결제 링크
- 자동화: Claude Code + GitHub Actions + Claude API 로 콘텐츠 생성/번역/업데이트
- 분석: Plausible 또는 Vercel Analytics

## 12. 의존성

- `firebase-totp-mfa@0.0.0` npm (완료)
- GitHub public repo (완료)
- 본 kit 의 docs/ 8개국어 i18n (이미 완료, 자동화 파이프라인의 input asset)
- Claude API 키 (자동화 파이프라인용)
- 메모리 [[project-strategy-redesign-v3]], [[project-alpha-release-2026-05-14]], [[feedback-korean-terminology]], [[feedback-external-review-cherry-pick]]

## 13. 다음 행동 (구체적 1건)

writing-plans 스킬로 **Phase 2-B 자동화 dogfooding 실행 계획서** 작성. 첫 task = "Claude Code + GitHub Actions 자동화 파이프라인 셋업 + 첫 검색 페이지 (영어) 자동 생성 — 2주 안에 ship target."

## 14. v1 → v2 → v3 진행 기록 (학습)

- **v1 (D7=C)**: 자동화 dogfooding base 선택. 운영자 motivation 직접 반영.
- **v2 (D9=A)**: codex 5항목 전면 수용. 사용자가 codex prompt 와 review 결과를 자세히 안 읽고 승인. v1 의 자동화 dogfooding 폐기 + 가격 $49 + 영어 우선 + 2-4주 window 등 운영자 의도와 충돌하는 결정 다수.
- **v3 (D10-D12)**: codex 5항목 항목별 재검토. ①②③④ 거부, ⑤만 수용 (outreach + funnel). v1 base 복귀 + actionable 도구만 추가.

**학습 (메모리 [[feedback-external-review-cherry-pick]] 신규)**:
- 외부 시선 (codex / plan-ceo-review 등) 수용 시 "all or nothing" 옵션 금지. 항목별 한국어 풀이 + 항목별 결정.
- 가격 결정 시 시장 anchor (Claude Code / Codex $20) 우선. 외부 권장 가격 (codex $49) 무비판 수용 금지.

## 15. 운영자에 대해 관찰한 점

- "필요한 인기를 얻어 나의 포트폴리오를 적립" 직접 명시 — 동기가 매우 정직.
- "둘 다 동등" 답 → 이력과 수익 둘 다 추구하는 hybrid 를 명확히 인정. self-deception 없음.
- 미래 가설 ("AI 기반 firebase SaaS 가 많아지면") 을 사실이 아닌 가설로 인정.
- v1 에서 자동화 dogfooding 선택 → 본 kit 셀링 포인트 검증 본능. v3 에서도 같은 선택 유지.
- 진행 중 영어 전문용어가 많아 "핵심 요지를 이해 못한다" 즉시 중단 요청 → 신호를 정직하게 보냄. 메모리 [[feedback-korean-terminology]] 신규.
- v2 (codex 전면 수용) 후 "자세히 안 읽고 승인한 잘못" 인정 + "다시 판단" 요청 → 외부 시선 무비판 수용 거부 본능. 메모리 [[feedback-external-review-cherry-pick]] 신규.
- 가격 $49 거부 + Claude/Codex $20 anchor 명시 → 시장 가격 감각이 매우 구체적. 이건 v3 의 가격 정책 (8번 섹션) 의 핵심 input.
