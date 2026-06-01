# AI 컨시에지 + 리드 funnel + Telegram 운영자 어시스트 설계서

**Status:** Approved (brainstorming 2026-06-02)
**Goal:** totp.antmon.kr 방문자를 **AI 챗 컨시에지 → 자격 판단된 문의 → 협의 후 후결제(Stripe Invoices) 컨설팅** 으로 전환한다. 공개 챗은 최소 비용(FAQ $0 + Haiku), 운영자는 모바일(Telegram)에서 외부 어디서든 처리.

**전략 프레이밍:** 저가 진입 = funnel, 수익 = Consulting (business-plan v3). 본 kit 의 trust hazard 준수 — **컨시에지는 auth 코드 생성·수정 절대 안 함**. 통합 도움은 사람($19 점검/컨설팅)으로 라우팅. 운영자 어시스트는 human-gated (AI 가 초안, 운영자가 승인·발송).

---

## 1. 범위 (Scope)

### In scope (SP1 + SP2 + SP3 operator-assist)
- **SP1 위젯**: FAB(플로팅 마스코트 버튼) → Anthropic 스타일 챗 다이얼로그. FAQ 칩 + 직접 질문 + 견적 요청. Claude풍 로딩.
- **SP2 티어형 컨시에지 백엔드**:
  - 티어0 **정적 FAQ ($0, LLM 미사용)**
  - 티어1 **Haiku 4.5** (직접 질문만, 가드 적용)
  - 티어2 **견적 요청** → triage
- **SP3 운영자 어시스트**: 견적 → **Claude(Sonnet 4.6) 한글 triage** → **Telegram 푸시** → 운영자 한글 지시 → Claude 초안 → **고객 답변 메일(Resend) + 후결제 인보이스(Stripe Invoices)**.

### Out of scope (별도/추후)
- **SP4 유료 딜리버 자동화** (harness 파이프라인 plan→implement→test→deploy) — **창업 명제 결정 + 건당 비용·수익률 테스트(SP0) 선행 게이트** 후 별도 spec. 본 spec 미포함.
- 자가서비스 $19 결제(Lemon Squeezy checkout) — Phase 2-B Milestone 3 별도.
- 컨시에지가 사용자 코드/auth 를 직접 수정·생성 (trust hazard, 영구 금지).

---

## 2. 아키텍처

전부 **CF Pages Functions** 로 co-located (정적 사이트와 동일 프로젝트·도메인). 별도 Worker 불필요.

```
website/
├── components/concierge/
│   ├── ChatFab.tsx            # 플로팅 마스코트 버튼 (Layout 에 마운트)
│   ├── ChatDialog.tsx         # Anthropic 스타일 다이얼로그 shell
│   ├── ChatMessages.tsx       # 메시지 목록 + Claude풍 로딩(점→타이핑)
│   ├── FaqChips.tsx           # 티어0 FAQ 칩
│   ├── ChatInput.tsx          # 직접 질문 입력
│   ├── QuoteForm.tsx          # 견적 요청 (이메일+맥락)
│   └── mascot.tsx             # 인라인 SVG 마스코트 (placeholder, 추후 교체)
├── lib/concierge/
│   ├── faq.ts                 # 티어0 정적 Q&A 데이터
│   ├── knowledge.ts           # 티어1 시스템 prefix 지식 digest (docs 발췌, 캐시됨)
│   ├── prompts.ts             # 컨시에지/triage/draft 시스템 프롬프트
│   └── types.ts
├── functions/
│   ├── api/chat.ts            # 티어1 Haiku 엔드포인트
│   ├── api/quote.ts           # 티어2 견적 → triage(Sonnet) → Telegram + KV 저장
│   ├── api/telegram.ts        # Telegram webhook: 운영자 지시 → 초안 → 발송
│   └── api/_shared/           # turnstile/rate/budget/anthropic/resend/stripe/telegram 헬퍼
└── (Layout.tsx 에 <ChatFab/> 마운트)
```

**런타임 시크릿 (CF Pages 암호화 env — GitHub Secrets 아님, build-time 과 구분):**
`ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `STRIPE_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_OPERATOR_CHAT_ID`, `OPERATOR_EMAIL`, `TELEGRAM_WEBHOOK_SECRET`
**공개 env:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
**KV namespace** 바인딩 (`CONCIERGE_KV`) — rate limit + 일일 budget + lead 임시 저장

**외부 계정:** Cloudflare Turnstile, Resend, Stripe, Telegram Bot(BotFather).

**모델 분담:** 공개 컨시에지 = **claude-haiku-4-5** (고볼륨·저가) / 운영자 triage·초안 = **claude-sonnet-4-6** (드물고 품질 중요). API 호출은 **raw fetch** (Workers 런타임 호환, SDK 미사용). 시스템 prefix **prompt caching**.

---

## 3. 데이터 흐름

### 티어0 — FAQ ($0)
방문자가 FAQ 칩 클릭 → `lib/concierge/faq.ts` 의 정적 답변을 **클라이언트에서** Claude풍 로딩(점 애니메이션 → 타이핑 reveal)으로 표시. **네트워크·LLM 호출 없음.**

### 티어1 — 직접 질문 (Haiku)
```
ChatInput → POST /api/chat { messages, turnstileToken }
  functions/api/chat.ts:
    1. Turnstile 검증 → 실패 403
    2. rate limit (KV: per-IP, 예 20/시간) → 초과 429 + 안내
    3. budget 체크 (KV: 일일 토큰 spend cap) → 초과 시 "지금 혼잡, FAQ 또는 견적 요청" fallback
    4. Anthropic(Haiku, 캐시된 knowledge digest 시스템 + messages, max_tokens 600)
    5. KV 에 사용 토큰 누적
    6. { reply } 반환 (스트리밍 or 단발)
```
시스템 프롬프트(prompts.ts): **MFA/본 kit 주제만 답변. 주제 외 거부(무료 Claude 프록시 악용 차단). auth 코드 생성·붙여넣기용 코드 출력 금지 — 통합 도움은 "견적 요청" 으로 유도.**

### 티어2 — 견적 요청 + 운영자 어시스트
```
QuoteForm → POST /api/quote { email, context, conversation, turnstileToken }
  functions/api/quote.ts:
    1. Turnstile 검증 + rate limit
    2. Claude(Sonnet) 로 한글 triage 생성:
       요구 요약 / 적합 서비스($19 vs 컨설팅) / 제안 견적·범위 / 처리방법 리뷰(체크포인트·위험)
    3. lead 를 KV 에 저장 (leadId, email, context, triage, status=new)
    4. Telegram sendMessage → 운영자 chat 에 한글 triage + inline 버튼/leadId
    5. 방문자에겐 "협의 후 연락드립니다 (선결제 없음)" 확인

운영자 (모바일 Telegram):
  triage 보고 한글로 지시 — 예: "이 고객 컨설팅 2시간 $300 으로, 이렇게 답하고 인보이스 보내줘"
    → Telegram → POST /api/telegram (webhook, secret 검증)
  functions/api/telegram.ts:
    1. webhook secret + chat_id allowlist(TELEGRAM_OPERATOR_CHAT_ID) 검증 → 아니면 무시
    2. 메시지에서 leadId 맥락 + 운영자 지시 파싱 (KV 에서 lead 로드)
    3. Claude(Sonnet) 로 고객 답변 메일 초안(한글/영어) 작성
    4. 운영자 지시에 금액 있으면 → Stripe Invoice 생성·발송 (후결제: send_invoice, 호스팅 인보이스 URL)
    5. Resend 로 고객에게 답변 메일 (+ 인보이스 링크)
    6. KV lead status=quoted/sent, Telegram 으로 운영자에게 "발송 완료" 확인
```
**Stripe Invoices (후결제):** `collection_method=send_invoice`, 협의된 금액·설명으로 invoice 생성 → finalize → 고객이 호스팅 인보이스 페이지에서 결제. 선결제·구독 아님.

---

## 4. 남용·비용 가드 (필수)

| 가드 | 구현 |
|---|---|
| 봇 차단 | **Cloudflare Turnstile** — 첫 메시지/견적 제출 시 토큰 서버 검증 |
| per-IP rate limit | KV 카운터 (예: chat 20/시간, quote 3/시간) → 429 |
| 일일 budget kill-switch | KV 일일 토큰 spend 누적. cap 초과 → 티어1 비활성("FAQ/견적만"), 운영자 Telegram 경고 |
| 모델 비용 | 공개 = Haiku(저가) / triage·draft = Sonnet(드뭄). prompt caching 으로 prefix 비용↓. max_tokens(chat 600, triage 1200, draft 1500) |
| 주제 한정 | 시스템 프롬프트가 MFA/kit 외 거부 → 무료 LLM 프록시 악용 차단 |
| 운영자 엔드포인트 | Telegram webhook secret + chat_id allowlist. 제3자 호출 무시 |
| 비밀·PII | 키·시크릿·고객 PII 절대 로그 출력 금지. lead 는 KV 에 TTL 후 만료 |
| trust hazard | 컨시에지 시스템 프롬프트에 "auth 코드 생성 금지" 명시. 통합은 사람으로 라우팅 |

**비용 추정:** FAQ $0 / Haiku ~$0.004 per chat / triage Sonnet ~$0.02-0.05 per quote(드뭄) / draft ~$0.03 per send. 견적·발송은 매출 동반이라 마진 무관. 공개 chat 은 budget kill-switch 로 상한.

---

## 5. 에러 처리 / 엣지

- Turnstile/네트워크 실패 → 사용자에게 "잠시 후 재시도 또는 견적 요청" 안내, 크래시 없음
- budget 초과 → 티어1 graceful degrade (FAQ + 견적은 계속 동작)
- Anthropic 5xx/429 → 재시도 1회 후 fallback 메시지
- Telegram 발송 실패 → 운영자 이메일(Resend)로 fallback 알림 + KV 에 pending 표시
- Stripe 인보이스 생성 실패 → 운영자에게 Telegram 에러 회신, 고객 메일은 보류
- 운영자 지시 모호(금액·의도 불명) → 봇이 Telegram 으로 한글 재질문(보내기 전 확인)
- 중복 제출/leadId 재처리 방지 (KV status 멱등 체크)

---

## 6. 보안 / 스코프 노트

- 키는 **CF Pages 런타임 암호화 env** 에만. 클라이언트 노출 0, 로그 0
- **Phase 2-B 가드 확장 필요**: 기존 가드 #1("ANTHROPIC_API_KEY = GitHub Secrets 만")은 build-time(cron) 기준. 본 런타임 엔드포인트용으로 CLAUDE.md 에 **"런타임 시크릿 = CF Pages 암호화 env, Turnstile+rate-limit+budget kill-switch 필수, 주제한정·no-auth-code 시스템 프롬프트, PII/시크릿 로그 금지, Telegram chat allowlist"** 가드 추가
- 컨시에지는 **개념 답변 + CLI/문서 안내 + 사람 라우팅** 만. auth 코드 생성 영구 금지 (본 kit 존재 이유)
- 운영자 어시스트는 **human-in-the-loop**: AI 초안, 발송은 운영자 명시 지시 후에만

---

## 7. 테스트

- **단위(vitest)**: `faq.ts`(데이터 무결성), `_shared` 가드 로직 — turnstile 실패, rate limit 초과, budget cap, telegram secret 검증, lead 멱등성. Anthropic/Stripe/Resend/Telegram 호출은 fetch mock
- **함수 통합**: chat 정상/거부(주제외)/budget초과, quote→triage→telegram(mock), telegram→draft→invoice(mock) 경로
- **UI**: 빌드(정적 export) 통과 + 수동/browse QA — FAB 열림, FAQ 로딩, 직접질문, 견적 폼
- **수동 end-to-end (배포 후, 테스트 키)**: 견적 1건 → 본인 Telegram 수신 → 지시 → 본인에게 테스트 인보이스/메일 도달 확인
- **비용 계측**: chat/quote/draft 각 1회 실제 토큰·비용 측정해 추정치 검증 (배포 전)

---

## 8. 향후 (별도 spec)
- **SP0 비용·수익률 테스트 하네스** → **SP4 유료 딜리버 자동화**(harness-engineering 파이프라인, 운영자 내부도구+사람게이트). 창업 명제 결정 + SP0 통과가 선행 게이트.
- 자가서비스 $19 (Lemon Squeezy) — Milestone 3.

---

## 관련 메모리·문서
- [[project-demo-playground]] — 같은 website/ 패턴
- [[project-phase2b-deploy-choice]] — CF Pages / totp.antmon.kr / 런타임 env
- `internal/business-plan.md` (가격 v3 $19, 수익=Consulting funnel)
- `docs/superpowers/specs/2026-05-14-phase2b-validation-strategy-design.md` (funnel 진단)
- `C:/Dev/harness_engineering_v2` (SP4 참조 — 추후)
