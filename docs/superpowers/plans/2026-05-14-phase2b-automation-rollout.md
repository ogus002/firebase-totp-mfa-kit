# Phase 2-B 자동화 dogfooding + 판매 실험 실행 계획서

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** firebase-totp-mfa-kit 의 시장 신호 검증 — 자동화 dogfooding (콘텐츠 + 본 kit CLI 자동 데모) + $19 보안 점검 서비스 + funnel 측정으로 6-12개월 안에 확장/재설계/중단 결정.

**Architecture:** Cloudflare Pages + GitHub Actions cron + Claude API 의 단순 stack. Public repo + 보안 가드 8가지 적용. 두 갈래의 자동화 — (a) 검색 페이지 콘텐츠 자동 갱신, (b) 본 kit CLI 가 sample 프로젝트에 자동 설치하는 dogfooding 데모.

**Tech Stack:** Cloudflare Pages / Next.js 정적 export / GitHub Actions / Anthropic Claude API (Sonnet 4.6) / Lemon Squeezy / Plausible Analytics 또는 Cloudflare Web Analytics / Tailwind CSS (기존 본 kit 일관성)

**Source 설계서:** `docs/superpowers/specs/2026-05-14-phase2b-validation-strategy-design.md` (v3, commit eb678fc)

---

## 진행 단계 (Milestone 분리)

| # | 기간 | 산출물 | 본 plan |
|---|---|---|---|
| **Milestone 1** | 2주 | 자동화 파이프라인 + 영어 검색 페이지 1개 + Cloudflare Pages 배포 | ✅ Detailed |
| **Milestone 2** | 4-6주 | 본 kit CLI 자동 데모 (dogfood-test repo) + 한국어/일본어 페이지 추가 | ⏳ Outline |
| **Milestone 3** | 6-8주 | $19 보안 점검 서비스 (Lemon Squeezy) 출시 + outreach 채널 결정 (별도 plan) | ⏳ Outline |

각 milestone 종료 시 사용자 검토 + 별도 plan 작성.

---

## 보안 가드 8가지 (전 milestone 적용 — D15.1)

| # | 가드 | 적용 task |
|---|---|---|
| 1 | Anthropic API key → GitHub Secrets `ANTHROPIC_API_KEY`. workflow 에서 `${{ secrets.XXX }}` 만 사용. echo/print 금지 | Task 6, 9 |
| 2 | Cloudflare API token → GitHub Secrets. **scope = Pages deploy 만**. account-wide 금지 | Task 5 |
| 3 | Workflow trigger = cron + main push 만. `pull_request_target` **금지** | Task 6, 9 |
| 4 | 자동 생성 콘텐츠 → PR 로 제안 (cron 이 main 직접 push 금지) | Task 6 |
| 5 | Anthropic monthly budget alert ($20-50). cron 간격 매주 1회. `max_tokens` 2000 제한 | Task 6 |
| 6 | `npm install --ignore-scripts` (lifecycle script 보호, 본 kit hard rules) | Task 1, Task 7 |
| 7 | main branch protection: force push 금지, 직접 push 금지 (PR 필수) | Task 9 |
| 8 | GitHub secret scanning + Dependabot security alerts 활성화 | Task 9 |

---

## File Structure (Milestone 1)

- Create: `website/` — Cloudflare Pages 정적 사이트 workspace
  - `website/package.json` — Next.js 14 + Tailwind + TypeScript
  - `website/next.config.js` — 정적 export 설정
  - `website/pages/index.tsx` — 홈
  - `website/pages/firebase-totp-mfa-setup.tsx` — 영어 검색 페이지 1
  - `website/components/Layout.tsx`
  - `website/styles/globals.css`
  - `website/tsconfig.json`
  - `website/.gitignore`
- Create: `website/scripts/generate-content.ts` — Claude API 호출 (수동/cron 양쪽 사용 가능)
- Create: `.github/workflows/website-deploy.yml` — main push 시 Cloudflare Pages 배포
- Create: `.github/workflows/content-cron.yml` — 매주 1회 콘텐츠 자동 갱신 (PR 생성)
- Modify: `README.md` — website link 추가 (1줄)
- Modify: `CLAUDE.md` — Phase 2-B 보안 가드 8가지 + outreach TBD 메모 (5줄)

---

## Milestone 1 Tasks (총 9개)

### Task 1: website/ workspace scaffold

**Files:**
- Create: `website/package.json`, `website/.gitignore`, `website/tsconfig.json`

- [ ] **Step 1.1: website/ 디렉토리 생성**

```bash
cd C:/Dev/firebase-totp-mfa-kit
mkdir website
```

- [ ] **Step 1.2: package.json 작성**

`website/package.json`:
```json
{
  "name": "firebase-totp-mfa-website",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "export": "next build && next export",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.x",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "autoprefixer": "^10",
    "postcss": "^8",
    "tailwindcss": "^3",
    "typescript": "^5"
  }
}
```

- [ ] **Step 1.3: 의존성 설치 (lifecycle script 보호)**

```bash
cd website
npm install --ignore-scripts
```

Expected: package-lock.json 생성, node_modules/ 생성, lifecycle scripts 미실행.

- [ ] **Step 1.4: .gitignore 추가**

`website/.gitignore`:
```
node_modules/
.next/
out/
.env*
.vercel
```

- [ ] **Step 1.5: tsconfig.json 작성**

`website/tsconfig.json`: Next.js 표준 + `"strict": true`.

- [ ] **Step 1.6: commit**

```bash
cd C:/Dev/firebase-totp-mfa-kit
git add website/package.json website/.gitignore website/tsconfig.json
git commit -m "chore(website): scaffold Cloudflare Pages workspace"
```

---

### Task 2: Next.js 정적 export 설정

**Files:**
- Create: `website/next.config.js`, `website/postcss.config.js`, `website/tailwind.config.js`

- [ ] **Step 2.1: Next.js 정적 export 설정**

`website/next.config.js`:
```js
/** @type {import('next').NextConfig} */
module.exports = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};
```

- [ ] **Step 2.2: Tailwind 설정**

`website/tailwind.config.js`:
```js
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

`website/postcss.config.js`:
```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`website/styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2.3: commit**

```bash
git add website/next.config.js website/postcss.config.js website/tailwind.config.js website/styles/
git commit -m "chore(website): next.js static export + tailwind"
```

---

### Task 3: Layout 컴포넌트 + 홈 페이지

**Files:**
- Create: `website/components/Layout.tsx`, `website/pages/index.tsx`, `website/pages/_app.tsx`

- [ ] **Step 3.1: _app.tsx**

`website/pages/_app.tsx`:
```tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

- [ ] **Step 3.2: Layout 컴포넌트**

`website/components/Layout.tsx`:
```tsx
import Head from 'next/head';
import Link from 'next/link';
import { ReactNode } from 'react';

type Props = { title: string; description: string; children: ReactNode };

export default function Layout({ title, description, children }: Props) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-white text-slate-900">
        <header className="border-b">
          <nav className="max-w-4xl mx-auto px-6 py-4 flex justify-between">
            <Link href="/" className="font-semibold">firebase-totp-mfa</Link>
            <a href="https://github.com/ogus002/firebase-totp-mfa-kit" className="text-sm">GitHub</a>
          </nav>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-12">{children}</main>
        <footer className="border-t mt-16">
          <div className="max-w-4xl mx-auto px-6 py-6 text-sm text-slate-500">
            MIT &mdash; ogus002 &mdash; <a href="https://www.npmjs.com/package/firebase-totp-mfa">npm</a>
          </div>
        </footer>
      </div>
    </>
  );
}
```

- [ ] **Step 3.3: 홈 페이지**

`website/pages/index.tsx`:
```tsx
import Layout from '../components/Layout';
export default function Home() {
  return (
    <Layout
      title="firebase-totp-mfa &mdash; Add Firebase TOTP MFA in 30 seconds"
      description="shadcn-style CLI to add Firebase TOTP 2FA to Next.js apps in one command. AI-friendly orchestration."
    >
      <h1 className="text-4xl font-bold mb-4">Add Firebase TOTP MFA in 30 seconds</h1>
      <p className="text-lg mb-6">
        One-command CLI to wire up Firebase Identity Platform TOTP 2FA in your Next.js app.
        Owns the source. AI-orchestration friendly.
      </p>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded text-sm overflow-x-auto">
        npx firebase-totp-mfa add next --area /admin --issuer "MyApp"
      </pre>
    </Layout>
  );
}
```

- [ ] **Step 3.4: 로컬 빌드 검증**

```bash
cd website
npm run build
```

Expected: `out/` 디렉토리 생성, `out/index.html` 존재.

- [ ] **Step 3.5: commit**

```bash
git add website/pages/_app.tsx website/components/Layout.tsx website/pages/index.tsx
git commit -m "feat(website): home page + Layout component"
```

---

### Task 4: 영어 검색 페이지 1 — firebase-totp-mfa-setup

**Files:**
- Create: `website/pages/firebase-totp-mfa-setup.tsx`

- [ ] **Step 4.1: 영어 검색 페이지 작성**

target 키워드: "firebase totp mfa setup", "firebase 2fa next.js"

`website/pages/firebase-totp-mfa-setup.tsx`:
```tsx
import Layout from '../components/Layout';
export default function Setup() {
  return (
    <Layout
      title="Firebase TOTP MFA Setup for Next.js (2026 Guide)"
      description="Complete guide to enable Firebase Identity Platform TOTP 2-factor authentication in a Next.js app. CLI installs everything in one command."
    >
      <h1 className="text-3xl font-bold mb-4">Firebase TOTP MFA Setup for Next.js</h1>
      <p className="mb-6">
        Add TOTP-based 2FA to your Firebase + Next.js app without writing auth boilerplate.
        Uses Firebase Identity Platform under the hood.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-3">1. Install</h2>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded text-sm overflow-x-auto">
        npx firebase-totp-mfa add next --area /admin --issuer "MyApp"
      </pre>
      <h2 className="text-2xl font-semibold mt-8 mb-3">2. Enable Identity Platform</h2>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded text-sm overflow-x-auto">
        npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run
      </pre>
      <p className="mt-4">
        Then run without <code>--dry-run</code> to apply.
        Sets <code>adjacentIntervals=5</code> on Identity Platform config.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-3">3. Verify</h2>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded text-sm overflow-x-auto">
        npx firebase-totp-mfa verify
      </pre>
      <p className="mt-4">
        Walks through manual verification scenarios.
        Source: <a href="https://github.com/ogus002/firebase-totp-mfa-kit/blob/main/docs/manual-setup.md">manual-setup.md</a>
      </p>
    </Layout>
  );
}
```

- [ ] **Step 4.2: 로컬 빌드 검증**

```bash
cd website
npm run build
ls out/firebase-totp-mfa-setup/
```

Expected: `out/firebase-totp-mfa-setup/index.html` 존재.

- [ ] **Step 4.3: commit**

```bash
git add website/pages/firebase-totp-mfa-setup.tsx
git commit -m "feat(website): english search page — firebase-totp-mfa-setup"
```

---

### Task 5: Cloudflare Pages 배포 셋업

**Files:**
- (Cloudflare 콘솔 작업) — `wrangler.toml` 만들지 여부는 Pages 셋업 후 결정
- Create: `.github/workflows/website-deploy.yml`

- [ ] **Step 5.1: Cloudflare 계정 + Pages 프로젝트 생성**

Cloudflare 콘솔 (cloudflare.com) → Workers & Pages → Create application → Pages → Connect to Git → `ogus002/firebase-totp-mfa-kit` 선택.

Build settings:
- Framework preset: Next.js (Static HTML Export)
- Build command: `cd website && npm install --ignore-scripts && npm run build`
- Build output directory: `website/out`
- Root directory: (비워둠 = repo root)

Production branch: `main`

- [ ] **Step 5.2: Cloudflare API token 생성 (보안 가드 #2)**

Cloudflare → My Profile → API Tokens → Create Token.

template: "Edit Cloudflare Workers" — 다음 권한만 남기고 나머지 제거:
- Account: `Cloudflare Pages: Edit` (해당 account 만)
- Zone: (없음)

생성된 token 복사 (한 번만 표시됨).

⚠️ **scope = Pages deploy 만**. account-wide 권한 절대 금지.

- [ ] **Step 5.3: GitHub Secrets 등록**

GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
- `CLOUDFLARE_API_TOKEN` = (Step 5.2 token)
- `CLOUDFLARE_ACCOUNT_ID` = Cloudflare 콘솔 우측 사이드바의 Account ID

- [ ] **Step 5.4: GitHub Actions workflow 작성 (보안 가드 #3)**

`.github/workflows/website-deploy.yml`:
```yaml
name: Deploy website to Cloudflare Pages
on:
  push:
    branches: [main]
    paths:
      - 'website/**'
      - '.github/workflows/website-deploy.yml'
  workflow_dispatch:

permissions:
  contents: read
  deployments: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies (no lifecycle scripts)
        working-directory: website
        run: npm install --ignore-scripts
      - name: Build static site
        working-directory: website
        run: npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy website/out --project-name=firebase-totp-mfa-kit
```

⚠️ Trigger 가 `push` (main) + `workflow_dispatch` 만. `pull_request_target` 절대 사용 안 함 (보안 가드 #3).

- [ ] **Step 5.5: commit + push → Cloudflare 자동 배포 확인**

```bash
git add .github/workflows/website-deploy.yml
git commit -m "ci(website): cloudflare pages deploy on main push"
git push origin main
```

Expected:
- GitHub Actions → Deploy workflow 실행 → Cloudflare Pages 배포 완료
- Cloudflare 콘솔에서 deployment 확인
- 도메인 (예: `firebase-totp-mfa-kit.pages.dev`) 에서 홈 + setup 페이지 노출

- [ ] **Step 5.6: 커스텀 도메인 (선택)**

별도 도메인 (예: `firebase-totp-mfa.com`) 보유 시 Cloudflare Pages → Custom domains 추가. 도메인 없으면 `.pages.dev` subdomain 유지.

---

### Task 6: Claude API 콘텐츠 자동 갱신 workflow

**Files:**
- Create: `website/scripts/generate-content.ts`
- Create: `.github/workflows/content-cron.yml`

- [ ] **Step 6.1: Claude API 호출 스크립트 작성**

`website/scripts/generate-content.ts`:
```typescript
// 영어 검색 페이지 콘텐츠를 Claude API 로 갱신 제안 받는 스크립트
// 결과는 stdout 으로 출력 → workflow 가 PR 생성
import { Anthropic } from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT = `You are a technical writer reviewing a developer documentation page.

Current page: Firebase TOTP MFA Setup for Next.js
Existing content (1-3 sentence summary): [will be filled by CI step]

Suggest a single concrete improvement: clarify wording, add a missing edge case, update an outdated reference, or add a useful code snippet. Output the improvement as a unified diff against the source TSX file. Be specific. Be terse. Max 30 lines of diff.

Constraints:
- Keep all existing JSX structure
- English only (this page is English)
- Reference firebase-totp-mfa CLI commands accurately (npx firebase-totp-mfa add/enable/verify)
- No marketing fluff
`;

async function main() {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: PROMPT }],
  });
  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { text: string }).text)
    .join('\n');
  console.log(text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 6.2: 의존성 추가**

```bash
cd website
npm install --ignore-scripts --save-dev @anthropic-ai/sdk tsx
```

- [ ] **Step 6.3: GitHub Secret `ANTHROPIC_API_KEY` 등록 (보안 가드 #1)**

GitHub repo → Settings → Secrets and variables → Actions → New secret:
- `ANTHROPIC_API_KEY` = Anthropic 콘솔에서 발급

⚠️ 절대 코드에 hardcode 금지. workflow 에서 `${{ secrets.ANTHROPIC_API_KEY }}` 만 사용. echo/print 절대 금지.

- [ ] **Step 6.4: cron workflow 작성 (보안 가드 #3, #4, #5)**

`.github/workflows/content-cron.yml`:
```yaml
name: Content automation (weekly suggestion)
on:
  schedule:
    - cron: '0 0 * * 1'  # 매주 월요일 00:00 UTC
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  suggest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        working-directory: website
        run: npm install --ignore-scripts
      - name: Generate content suggestion
        working-directory: website
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: npx tsx scripts/generate-content.ts > /tmp/suggestion.md
      - name: Create PR with suggestion
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'content: weekly automation suggestion'
          title: 'content: weekly automation suggestion (cron)'
          body-path: /tmp/suggestion.md
          branch: bot/content-cron-${{ github.run_id }}
          base: main
```

⚠️ cron 결과는 PR 로 생성 (직접 main push 금지 — 보안 가드 #4). 사용자가 review 후 merge.

⚠️ Anthropic monthly budget alert 설정 필수 (Anthropic 콘솔 → Plans & billing → Budget alerts → $20-$50, 보안 가드 #5).

- [ ] **Step 6.5: commit**

```bash
git add website/scripts/generate-content.ts website/package.json website/package-lock.json .github/workflows/content-cron.yml
git commit -m "feat(automation): weekly content suggestion via Claude API (PR-based)"
```

- [ ] **Step 6.6: 첫 cron 수동 trigger 로 테스트**

GitHub → Actions → "Content automation" → Run workflow → 수동 trigger.

Expected: 새 PR 생성 (`bot/content-cron-XXXX` branch), Claude 가 suggested diff 본문에 포함. PR review 후 merge 또는 close.

---

### Task 7: Analytics 셋업 (Cloudflare Web Analytics)

**Files:**
- Modify: `website/components/Layout.tsx` (analytics 스크립트 추가)

- [ ] **Step 7.1: Cloudflare Web Analytics 활성화**

Cloudflare 콘솔 → Analytics & Logs → Web Analytics → Add a site → `firebase-totp-mfa-kit.pages.dev` (또는 커스텀 도메인). 발급된 `token` 복사.

- [ ] **Step 7.2: Layout 에 스크립트 추가**

`website/components/Layout.tsx` 의 `<Head>` 안에:
```tsx
<script
  defer
  src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token": "YOUR_CF_ANALYTICS_TOKEN"}'
/>
```

(token 은 client-side 공개 가능 — 비밀 아님)

- [ ] **Step 7.3: 빌드 + 배포 + 검증**

```bash
cd website && npm run build
cd ..
git add website/components/Layout.tsx
git commit -m "feat(website): cloudflare web analytics"
git push origin main
```

Expected: Cloudflare Web Analytics 대시보드에서 방문 수치 등장 (수 분 ~ 수 시간 lag).

---

### Task 8: README + CLAUDE.md 업데이트

**Files:**
- Modify: `README.md`, `CLAUDE.md`

- [ ] **Step 8.1: README 에 website link 추가**

`README.md` 상단에 1줄:
```markdown
> 🌐 **Website**: https://firebase-totp-mfa-kit.pages.dev (또는 커스텀 도메인)
```

- [ ] **Step 8.2: CLAUDE.md 에 Phase 2-B 보안 가드 + outreach TBD 메모 추가**

`CLAUDE.md` 의 hard rules 섹션 다음에:
```markdown
## Phase 2-B 자동화 운영 가드

- `.github/workflows/*.yml` 의 trigger 는 `push` (main) 또는 `schedule` (cron) 또는 `workflow_dispatch` 만. `pull_request_target` 절대 사용 금지.
- 자동 생성 콘텐츠는 PR 로만. cron 이 main 직접 push 금지.
- Anthropic / Cloudflare API token 은 GitHub Secrets 만. workflow 에서 echo/print 금지.
- outreach 채널 (Reddit / Twitter / GitHub maintainer) = TBD. Milestone 3 에서 별도 plan.
```

- [ ] **Step 8.3: commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: link website + phase 2-b automation guards"
```

---

### Task 9: 보안 가드 마무리 (branch protection + secret scanning)

**Files:** (GitHub 콘솔 작업)

- [ ] **Step 9.1: main branch protection 활성화 (보안 가드 #7)**

GitHub repo → Settings → Branches → Add branch protection rule:
- Branch name pattern: `main`
- ✅ Require a pull request before merging (1 approval, 또는 본인이라면 0 approval)
- ✅ Require status checks to pass before merging (Deploy workflow 추가)
- ✅ Do not allow bypassing the above settings
- ❌ Allow force pushes (체크 해제)
- ❌ Allow deletions (체크 해제)

⚠️ 1인 운영자이므로 "Require approvals" 는 0 으로 두되, force push / 직접 push 차단은 필수.

- [ ] **Step 9.2: Secret scanning + Dependabot 활성화 (보안 가드 #8)**

GitHub repo → Settings → Code security and analysis:
- ✅ Secret scanning
- ✅ Push protection (secret scanning)
- ✅ Dependabot alerts
- ✅ Dependabot security updates

- [ ] **Step 9.3: Anthropic budget alert (보안 가드 #5)**

Anthropic 콘솔 (console.anthropic.com) → Plans & billing → Budget alerts → $30 (또는 적절한 값) 으로 monthly alert 설정.

- [ ] **Step 9.4: Milestone 1 완료 commit (보안 가드 적용 완료 명시)**

```bash
git commit --allow-empty -m "chore(milestone-1): security guards applied (branch protection / scanning / budget)"
git push origin main
```

---

## Milestone 1 검증 체크리스트

각 항목 ✅ 후 Milestone 2 진입:

- [ ] Cloudflare Pages 에서 영어 페이지 2개 (홈 + setup) 정상 노출
- [ ] GitHub Actions Deploy workflow 가 main push 시 자동 실행 + Cloudflare 배포
- [ ] Content cron workflow 수동 trigger 시 PR 생성 + Claude suggestion 본문 포함
- [ ] Cloudflare Web Analytics 대시보드에서 방문 수치 노출
- [ ] main branch protection 활성 (force push 차단)
- [ ] Secret scanning + Dependabot alerts 활성
- [ ] Anthropic monthly budget alert $30 활성
- [ ] 보안 가드 8가지 모두 적용 완료

---

## Milestone 2 Outline (별도 plan, 4-6주)

**Goal:** 본 kit CLI 자동 데모 (진짜 dogfooding) + 한국어/일본어 페이지 추가.

**핵심 산출물:**
1. **dogfood-test repo** (새 GitHub repo, public) — Next.js 14 빈 프로젝트
2. **본 kit CLI 자동 설치 workflow** — dogfood-test repo 에서 매주 cron 으로 `npx firebase-totp-mfa add next ...` 실행 → 결과 commit
3. **자동 영상/스크린샷 캡처** — Playwright + GitHub Actions 로 dogfood-test 의 설치 후 결과를 영상 / 스크린샷 로 저장
4. **본 kit website 의 "Live Demo" 섹션** — dogfood-test 영상/스크린샷 embed
5. **한국어 페이지** — `website/pages/ko/firebase-totp-mfa-setup.tsx` (수동 번역 + 검수)
6. **일본어 페이지** — `website/pages/ja/firebase-totp-mfa-setup.tsx` (DeepL 또는 Claude 한번 번역 후 검수)
7. **Phase 1 Task 8-3 (Claude dogfood) 흡수** — dogfood-test 가 그 역할 수행

**의존성:** Milestone 1 완료, Cloudflare Pages 배포 정상.

**별도 plan 위치:** `docs/superpowers/plans/2026-MM-DD-phase2b-cli-dogfooding.md` (Milestone 1 완료 후 작성)

---

## Milestone 3 Outline (별도 plan, 6-8주)

**Goal:** $19 보안 점검 서비스 (Lemon Squeezy) 출시 + outreach 채널 결정.

**핵심 산출물:**
1. **Lemon Squeezy 계정 + 제품 등록** ($19, "Firebase MFA security check")
2. **결제 페이지 + CTA** — website 의 setup 페이지에 결제 링크 추가
3. **GitHub issue template** — "MFA audit request" + 결제 confirmation 흐름
4. **결과물 템플릿** — 1-page report + auth flow review + env/config checklist (Markdown)
5. **48h 응답 SLA** — 운영자 schedule 명시
6. **outreach 채널 결정** (사용자 검토 + 별도 plan):
   - Reddit / Twitter / GitHub maintainer / dev.to / Hashnode 중 1-2개 선택
   - funnel 신호 (방문 0 = 채널 문제) 측정 후 결정 가능

**의존성:** Milestone 2 완료, dogfood-test 영상 1개 이상 (CTA 근거).

**별도 plan 위치:** `docs/superpowers/plans/2026-MM-DD-phase2b-audit-launch.md` (Milestone 2 완료 후 작성)

---

## Self-Review (writing-plans 가이드 따른 inline 점검)

**1. 설계서 v3 의 모든 섹션 cover 여부:**
- ✅ 자동화 dogfooding (Milestone 1 + 2)
- ✅ 검색 페이지 (Milestone 1 영어 + Milestone 2 한국어/일본어)
- ✅ $19 보안 점검 (Milestone 3)
- ✅ Cloudflare Pages 호스팅 (D14)
- ✅ Claude API + GitHub Actions stack (D15)
- ✅ 보안 가드 8가지 (D15.1)
- ✅ funnel 진단 (Cloudflare Web Analytics 가 방문 측정. CTA/문의/결제 측정은 Milestone 3 에서 결제 흐름 갖춰진 후)
- ✅ outreach (Milestone 3 별도 plan)
- ✅ SKIP 명시 항목 (90초 영상 / Show HN / 대시보드 / 무료 컨설팅) — Milestone 3 에도 등장 안 함

**2. Placeholder scan:**
- ✅ TBD 1건 = "outreach 채널 = TBD, Milestone 3 별도 plan" (의도적, 사용자 D19 결정)
- ✅ 다른 TBD / TODO / fill in details 없음

**3. Type / 명령 일관성:**
- ✅ `firebase-totp-mfa` package 이름 일관
- ✅ Cloudflare Pages project name `firebase-totp-mfa-kit` 일관
- ✅ GitHub Secrets 이름 (`ANTHROPIC_API_KEY` / `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`) 일관

**4. Scope:**
- ✅ Milestone 1 만 fully detailed (9개 task / 2주 ship). Milestone 2/3 outline. plan 길이 적정.
- ✅ 단일 plan 으로 scope 명확.

issue 없음. plan 그대로 진행 가능.

---

## 관련 메모리

- [[phase2b-design-lock]] — v3 설계 lock (본 plan 의 source)
- [[project-alpha-release-2026-05-14]] — alpha publish 결과
- [[feedback-korean-terminology]] — 한국어 위주 원칙
- [[external-review-cherry-pick]] — 외부 시선 cherry-pick 원칙
- [[project-strategy-redesign-v3]] — history reference
