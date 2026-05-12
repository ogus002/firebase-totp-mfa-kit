# Phase 2 Strategy Rollout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 1 alpha (현재 상태) → Phase 2 public launch 준비. codex high + plan-ceo-review SCOPE REDUCTION 으로 도출된 spec v3 의 6 must items + Phase 1 발견 1 must-fix 를 ship.

**Architecture:** 본 plan 은 strategic redesign 의 implementation 단계. (1) CLI 코드 변경 3건 (must-fix 1 + 신규 명령 + version metadata), (2) 신규 docs 1 + 기존 docs 5 수정, (3) npm stub publish + memory 동기화. TDD applicable 한 코드 작업은 standard 5-step. docs/operation 작업은 명시적 edit step.

**Tech Stack:** TypeScript 5.4 / tsup / commander / vitest / Node 20 / Firebase JS 10.6+ / Firebase Admin 11.6+. npm + git + gcloud + Firebase CLI.

**Source design doc:** `docs/superpowers/specs/2026-05-12-strategy-redesign-v3-design.md`

**Reference inputs:**
- `.superpowers/brainstorm/1085-1778579273/codex-axis-review.md` (codex high 답)
- `internal/codex-review-2026-05-12.md` (1차 codex review)
- `docs/2026-05-11-firebase-totp-mfa-guide.md` (rosetta-stone)

---

## File Structure

### Created (new files)
- `docs/PRODUCTION-CHECKLIST.md` — 7-section production readiness doc (Must #5)
- `packages/cli/src/commands/update.ts` — `update/diff` 명령 신규 (Must #2)
- `packages/cli/src/utils/registry-version.ts` — version metadata 유틸 (Must #3)
- `packages/cli/test/commands/update.test.ts` — TDD
- `packages/cli/test/utils/registry-version.test.ts` — TDD

### Modified (existing files)
- `packages/cli/src/commands/enable.ts:53` — GET 404 fix (must-fix from Phase 1)
- `packages/cli/src/commands/add.ts` — version metadata 작성 통합
- `packages/cli/src/index.ts` — update subcommand 등록
- `spec.md` — header / §0 / §1 / §4 / §7 / §10 / §11 / §12 / §14 / 부록 B
- `README.md` — hero / Why / Status / disclaimer
- `internal/business-plan.md` — §2-1 / §2-2 / §7 / §9
- `AGENTS.md` + `CLAUDE.md` — header label reframe
- `packages/cli/package.json` — version `0.1.0-alpha.0` → publish 준비
- 메모리: `MEMORY.md` + `project_phase1_status.md` + `.claude/session-handoff.md`

### Operational (no file changes)
- `git init` + first commit (Task 0)
- `npm publish --tag alpha` (Task 10)

---

## Task 0: Repo Initial Commit Setup

**Files:**
- Modify: `.gitignore` (확인)
- Operation: git init + initial commit

- [ ] **Step 1: Verify .gitignore covers secrets + brainstorm artifacts**

Check `.gitignore` contains:
```
internal/
.env.local
.env*.local
node_modules
dist
.next
.turbo
.superpowers/
```

If `.superpowers/` 누락 → Edit `.gitignore` to add it.

- [ ] **Step 2: git init + initial commit**

Run:
```bash
git init
git add .
git status  # verify internal/ + .env* + .superpowers/ excluded
git commit -m "chore: initial commit — Phase 1 CLI alpha complete + spec v2"
```

Expected: 약 50-80 files staged (packages/cli source, examples/nextjs-playground source, docs, plans, spec, README, LICENSE, package.json files).

⚠️ git status 에 `.env.local` / `internal/*` / `.superpowers/` 가 보이면 STOP — `.gitignore` 누락. Step 1 으로 돌아감.

- [ ] **Step 3: Verify clean state**

Run:
```bash
git log --oneline -1
git status
```

Expected:
- 1 commit visible
- `nothing to commit, working tree clean`

---

## Task 1: CLI `enable.ts` GET 404 Fix (must-fix from Phase 1)

**Background:** memory `project_cli_get_404_bug` — `packages/cli/src/commands/enable.ts:53` 의 `getProjectConfig` 가 admin/v2/config 404 (`CONFIGURATION_NOT_FOUND`) 시 return 2. 하지만 첫 PATCH 전 lazy state 가 정상 — `docs/2026-05-11-firebase-totp-mfa-guide.md` §3-1 GET-then-PATCH 흐름과 충돌. 첫 onboarding 깨짐.

**Files:**
- Modify: `packages/cli/src/commands/enable.ts:53-62`
- Test: `packages/cli/test/commands/enable.test.ts` (없으면 create)

- [ ] **Step 1: Write failing test for 404 first-init handling**

Create `packages/cli/test/commands/enable.test.ts` (or extend existing):

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runEnable } from '../../src/commands/enable';
import * as identityPlatform from '../../src/utils/identity-platform';
import * as execGcloud from '../../src/utils/exec-gcloud';

describe('enable — first-init (404 CONFIGURATION_NOT_FOUND)', () => {
  beforeEach(() => {
    vi.spyOn(execGcloud, 'gcloudActiveAccount').mockResolvedValue('test@example.com');
    vi.spyOn(execGcloud, 'gcloudCurrentProject').mockResolvedValue('test-project');
  });

  it('treats 404 CONFIGURATION_NOT_FOUND as empty config (first-PATCH lazy state) and proceeds in dry-run', async () => {
    const get404 = new Error('GET config failed (404): {"error":{"code":404,"message":"CONFIGURATION_NOT_FOUND","status":"NOT_FOUND"}}');
    vi.spyOn(identityPlatform, 'getProjectConfig').mockRejectedValue(get404);

    const exitCode = await runEnable({
      project: 'test-project',
      adjacentIntervals: 1,
      dryRun: true,
      yes: false,
    });

    expect(exitCode).toBe(0);  // dry-run with empty mfa context, NOT return 2
  });

  it('still returns 2 for non-CONFIGURATION_NOT_FOUND errors (auth, permission, etc)', async () => {
    const get403 = new Error('GET config failed (403): permission denied');
    vi.spyOn(identityPlatform, 'getProjectConfig').mockRejectedValue(get403);

    const exitCode = await runEnable({
      project: 'test-project',
      adjacentIntervals: 1,
      dryRun: true,
      yes: false,
    });

    expect(exitCode).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd packages/cli
npm test -- enable
```

Expected: FAIL — test 1 returns 2 instead of 0 (현재 코드는 404 catch 시 return 2).

- [ ] **Step 3: Implement fix in enable.ts:53-62**

Open `packages/cli/src/commands/enable.ts`. Find lines 49-62:

```typescript
  // Step 2 — GET current config
  console.log('');
  console.log(pc.dim('→ Fetching current Identity Platform config…'));
  let currentCfg;
  try {
    currentCfg = await getProjectConfig(opts.project);
  } catch (e) {
    console.log(pc.red(`✗ ${(e as Error).message}`));
    console.log('');
    console.log('Common causes:');
    console.log(`  · Project ${pc.cyan(opts.project)} does not exist or has no Identity Platform`);
    console.log(`  · Active account ${pc.cyan(account)} lacks ${pc.cyan('roles/identityplatform.admin')}`);
    console.log(`  · Identity Platform not upgraded — see https://console.firebase.google.com/project/${opts.project}/authentication`);
    return 2;
  }
```

Replace with:

```typescript
  // Step 2 — GET current config
  console.log('');
  console.log(pc.dim('→ Fetching current Identity Platform config…'));
  let currentCfg: { mfa?: any } = {};
  try {
    currentCfg = await getProjectConfig(opts.project);
  } catch (e) {
    const msg = (e as Error).message;
    // 404 CONFIGURATION_NOT_FOUND = first-PATCH lazy state (admin/v2 not yet initialized)
    // Treat as empty mfa config and continue — PATCH will be first-init
    if (msg.includes('404') && msg.includes('CONFIGURATION_NOT_FOUND')) {
      console.log(pc.yellow('⚠ MFA config not yet initialized — first PATCH will create it.'));
      currentCfg = {};
    } else {
      console.log(pc.red(`✗ ${msg}`));
      console.log('');
      console.log('Common causes:');
      console.log(`  · Project ${pc.cyan(opts.project)} does not exist or has no Identity Platform`);
      console.log(`  · Active account ${pc.cyan(account)} lacks ${pc.cyan('roles/identityplatform.admin')}`);
      console.log(`  · Identity Platform not upgraded — see https://console.firebase.google.com/project/${opts.project}/authentication`);
      return 2;
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd packages/cli
npm test -- enable
```

Expected: PASS — both tests green.

Also typecheck:
```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands/enable.ts packages/cli/test/commands/enable.test.ts
git commit -m "fix(cli): enable command handles first-PATCH 404 CONFIGURATION_NOT_FOUND as empty config"
```

---

## Task 2: CLI `update/diff` 명령 신규

**Background:** codex axis-3 의 own-code divergence HIGH severity. `spec.md:150-153` 가 명시했지만 §4 Commands 에 update 명령 자체 없음. shadcn-style copy 가 rots.

**Files:**
- Create: `packages/cli/src/commands/update.ts`
- Modify: `packages/cli/src/index.ts` (subcommand 등록)
- Test: `packages/cli/test/commands/update.test.ts`

- [ ] **Step 1: Write failing test for update command — detects local divergence**

Create `packages/cli/test/commands/update.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runUpdate } from '../../src/commands/update';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('update — registry version diff', () => {
  it('detects local source file diverged from registry (different version)', async () => {
    // Mock setup: local file version 0.0.1, registry version 0.0.2
    const mockProjectDir = '/tmp/test-project';
    vi.spyOn(fs, 'existsSync').mockImplementation((p) => {
      return String(p).endsWith('.firebase-totp-mfa.json') || String(p).endsWith('TotpEnroll.tsx');
    });
    vi.spyOn(fs, 'readFileSync').mockImplementation((p) => {
      if (String(p).endsWith('.firebase-totp-mfa.json')) {
        return JSON.stringify({
          version: '0.0.1',
          installed: [{ source: 'components/TotpEnroll.source.tsx', dest: 'src/components/TotpEnroll.tsx' }],
        });
      }
      return 'old content';
    });

    // Mock registry side: latest version 0.0.2
    const result = await runUpdate({
      projectRoot: mockProjectDir,
      dryRun: true,
      registryVersion: '0.0.2',
    });

    expect(result.diverged).toHaveLength(1);
    expect(result.diverged[0].file).toContain('TotpEnroll.tsx');
    expect(result.exitCode).toBe(0);  // dry-run reports but doesn't fail
  });

  it('reports clean state when local matches registry', async () => {
    vi.spyOn(fs, 'existsSync').mockImplementation((p) =>
      String(p).endsWith('.firebase-totp-mfa.json')
    );
    vi.spyOn(fs, 'readFileSync').mockImplementation(() =>
      JSON.stringify({ version: '0.0.2', installed: [] })
    );

    const result = await runUpdate({
      projectRoot: '/tmp/test-project',
      dryRun: true,
      registryVersion: '0.0.2',
    });

    expect(result.diverged).toHaveLength(0);
    expect(result.exitCode).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/cli
npm test -- update
```

Expected: FAIL — `runUpdate` not exported (file does not exist).

- [ ] **Step 3: Create `packages/cli/src/commands/update.ts`**

```typescript
import pc from 'picocolors';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface UpdateOptions {
  projectRoot: string;
  dryRun: boolean;
  registryVersion: string;
}

export interface UpdateResult {
  diverged: { file: string; localVer: string; registryVer: string }[];
  exitCode: number;
}

export async function runUpdate(opts: UpdateOptions): Promise<UpdateResult> {
  console.log(pc.bold('firebase-totp-mfa update'));
  console.log('');

  const metadataPath = path.join(opts.projectRoot, '.firebase-totp-mfa.json');
  if (!fs.existsSync(metadataPath)) {
    console.log(pc.red('✗ No .firebase-totp-mfa.json found. Run `firebase-totp-mfa add` first.'));
    return { diverged: [], exitCode: 2 };
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) as {
    version: string;
    installed: { source: string; dest: string }[];
  };

  const localVer = metadata.version;
  const registryVer = opts.registryVersion;

  console.log(`Local registry version  : ${pc.cyan(localVer)}`);
  console.log(`Latest registry version : ${pc.cyan(registryVer)}`);
  console.log('');

  if (localVer === registryVer) {
    console.log(pc.green('✓ Local source matches registry. No update needed.'));
    return { diverged: [], exitCode: 0 };
  }

  const diverged = metadata.installed.map((entry) => ({
    file: entry.dest,
    localVer,
    registryVer,
  }));

  console.log(pc.yellow(`⚠ ${diverged.length} file(s) diverged from registry:`));
  for (const d of diverged) {
    console.log(`  · ${pc.cyan(d.file)} (${d.localVer} → ${d.registryVer})`);
  }
  console.log('');

  if (opts.dryRun) {
    console.log(pc.dim('--dry-run: no files modified.'));
    console.log(pc.dim('Run without --dry-run to see per-file diff + confirm before overwrite.'));
    return { diverged, exitCode: 0 };
  }

  // Real update flow: per-file diff + confirm + overwrite
  // (Phase 2.1 — full apply implementation. Phase 2.0 dry-run only for now.)
  console.log(pc.yellow('Update apply not yet implemented in alpha. Use --dry-run to inspect.'));
  return { diverged, exitCode: 0 };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/cli
npm test -- update
```

Expected: PASS — both tests green.

- [ ] **Step 5: Register subcommand in `packages/cli/src/index.ts`**

Open `packages/cli/src/index.ts`. After the existing `enable` subcommand registration (around the bottom of the commander chain), add:

```typescript
program
  .command('update')
  .description('Check if local registry source files diverged from the kit (diff only in alpha)')
  .option('--dry-run', 'Print diff, do not modify files', true)
  .action(async (opts) => {
    const { runUpdate } = await import('./commands/update.js');
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, join } = await import('node:path');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const pkgJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

    const result = await runUpdate({
      projectRoot: process.cwd(),
      dryRun: opts.dryRun !== false,
      registryVersion: pkgJson.version,
    });
    process.exit(result.exitCode);
  });
```

- [ ] **Step 6: Build + smoke test**

```bash
cd packages/cli
npm run build
node dist/index.js update --help
```

Expected:
```
Usage: firebase-totp-mfa update [options]

Check if local registry source files diverged from the kit (diff only in alpha)

Options:
  --dry-run  Print diff, do not modify files (default: true)
  -h, --help display help for command
```

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/commands/update.ts packages/cli/src/index.ts packages/cli/test/commands/update.test.ts
git commit -m "feat(cli): add update/diff command — detect local registry source divergence"
```

---

## Task 3: CLI Registry Version Metadata

**Background:** Task 2 의 `update` 가 `.firebase-totp-mfa.json` metadata 에 의존. 현재 `add` 명령은 이 file 을 작성 안 함. 통합 필요.

**Files:**
- Create: `packages/cli/src/utils/registry-version.ts`
- Modify: `packages/cli/src/commands/add.ts` (마지막 apply step 에 metadata 작성 추가)
- Test: `packages/cli/test/utils/registry-version.test.ts`

- [ ] **Step 1: Write failing test for metadata writer**

Create `packages/cli/test/utils/registry-version.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import * as fs from 'node:fs';
import { writeRegistryMetadata, readRegistryMetadata } from '../../src/utils/registry-version';

describe('registry-version metadata', () => {
  it('writes .firebase-totp-mfa.json with version + installed list', () => {
    let written = '';
    vi.spyOn(fs, 'writeFileSync').mockImplementation((_p, content) => {
      written = String(content);
    });

    writeRegistryMetadata('/tmp/proj', '0.0.1', [
      { source: 'components/TotpEnroll.source.tsx', dest: 'src/components/TotpEnroll.tsx' },
    ]);

    expect(written).toContain('"version": "0.0.1"');
    expect(written).toContain('"dest": "src/components/TotpEnroll.tsx"');
  });

  it('reads .firebase-totp-mfa.json and returns parsed metadata', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ version: '0.0.2', installed: [{ source: 'a.tsx', dest: 'b.tsx' }] })
    );

    const metadata = readRegistryMetadata('/tmp/proj');
    expect(metadata?.version).toBe('0.0.2');
    expect(metadata?.installed).toHaveLength(1);
  });

  it('returns null if metadata file does not exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    const metadata = readRegistryMetadata('/tmp/proj');
    expect(metadata).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/cli
npm test -- registry-version
```

Expected: FAIL — `writeRegistryMetadata` not exported.

- [ ] **Step 3: Implement `packages/cli/src/utils/registry-version.ts`**

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface RegistryMetadata {
  version: string;
  installed: { source: string; dest: string }[];
  installedAt: string;
}

const METADATA_FILENAME = '.firebase-totp-mfa.json';

export function writeRegistryMetadata(
  projectRoot: string,
  version: string,
  installed: { source: string; dest: string }[],
): void {
  const metadata: RegistryMetadata = {
    version,
    installed,
    installedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(projectRoot, METADATA_FILENAME),
    JSON.stringify(metadata, null, 2),
    'utf-8',
  );
}

export function readRegistryMetadata(projectRoot: string): RegistryMetadata | null {
  const p = path.join(projectRoot, METADATA_FILENAME);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/cli
npm test -- registry-version
```

Expected: PASS — 3 tests green.

- [ ] **Step 5: Integrate metadata writing into `add.ts`**

Open `packages/cli/src/commands/add.ts`. Find the apply step (after user confirms, files are copied). At the end of successful apply, add:

```typescript
import { writeRegistryMetadata } from '../utils/registry-version.js';
// ... after existing apply logic ...

// Record metadata for future update/diff
const cliPkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));
writeRegistryMetadata(
  opts.projectRoot,
  cliPkg.version,
  copiedFiles.map((f) => ({ source: f.registrySource, dest: f.projectDest })),
);
console.log(pc.dim(`✓ Wrote .firebase-totp-mfa.json (registry version ${cliPkg.version})`));
```

(The exact integration point depends on the current `add.ts` structure — locate the loop that copies files and `copiedFiles` array.)

- [ ] **Step 6: Build + verify add writes metadata**

```bash
cd packages/cli
npm run build
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/utils/registry-version.ts packages/cli/src/commands/add.ts packages/cli/test/utils/registry-version.test.ts
git commit -m "feat(cli): write .firebase-totp-mfa.json metadata on add for update/diff tracking"
```

---

## Task 4: `docs/PRODUCTION-CHECKLIST.md` 신규 (7 sections)

**Background:** codex axis-3 의 Liability HIGH + Solo-maintainer drag HIGH + Clerk 경쟁 HIGH + Passkey displacement HIGH 통합 1 doc.

**Files:**
- Create: `docs/PRODUCTION-CHECKLIST.md`

- [ ] **Step 1: Create `docs/PRODUCTION-CHECKLIST.md` with full 7-section content**

Use the outline from design doc §5-4. Full content:

```markdown
# Production Checklist

> Required reading before deploying firebase-totp-mfa to production.

본 kit 은 alpha 단계 (Phase 2 launch 시점). 본 checklist 는 ship 전 통과 의무.

## 1. Pre-flight Setup Verification

- [ ] gcloud auth correct project: `gcloud config get-value project` 가 의도된 project 명
- [ ] `npx firebase-totp-mfa doctor` 모든 항목 green
- [ ] Firebase Web App config 6 values in `.env.local` (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) — NOT committed to git
- [ ] At least 1 test user with `emailVerified=true` (CLI sets via admin REST `accounts:update`)
- [ ] `npx firebase-totp-mfa verify` 시나리오 5/5 manual 검증 통과

## 2. Server Enforcement Gate (REQUIRED)

⚠️ Client-side guard (`<MfaGuard>`) 는 **보안 경계 아님**. 다음 코드 server-side 에 강제 — 의무:

```ts
import { admin } from './firebase-admin';

const decoded = await admin.auth().verifyIdToken(idToken);
if (!decoded.firebase?.sign_in_attributes?.mfa_factor_uid) {
  throw new AppError(403, 'MFA required');
}
```

본 kit 의 `docs/SERVER-MFA-VERIFY.md` 의 4 framework snippets (Express / Cloud Functions / Cloud Run / Next Route Handler) 중 본인 stack 적용.

## 3. Recovery / Lockout

- 10 backup codes (hash 저장) → 사용자 download 또는 print
- Admin reset SOP — 2명 합의 (multisig 패턴) 또는 단순 `admin.deleteUser` + 재초대
- 자세히는 `docs/RECOVERY-CODES.md`

⚠️ Recovery codes 분실 + Authenticator 분실 = account permanent lock. 사용자 download 강제 UX 필수.

## 4. Liability Boundary

본 kit 은 **MIT 라이센스** + **NO WARRANTY**. 다음 인지 사항 명시:

- **shadcn-style source copy** → 사용자 코드로 owned. 보안 audit 책임 = 사용자
- **Firebase API breaking change** 시 본 kit 의 update 지연 가능. `firebase-totp-mfa update --dry-run` 명령으로 사용자 통제
- **LLM (Claude / Codex) 가 본 kit 호출 시** deterministic CLI 만 mutation — 단 사용자 환경 변화는 사용자 책임. `CLAUDE.md` / `AGENTS.md` 의 "절대 금지" 5개 hard rule 강제
- **breach 시 책임** — 본 kit 운영자 (1인) 는 사용자의 production breach 에 대한 법적 책임 없음. 사용자 책임

## 5. Support Policy + Version Matrix

| Kit version | Firebase JS SDK | Firebase Admin SDK | Identity Platform | 상태 |
|---|---|---|---|---|
| 0.x (alpha) | >=10.6 <12 | >=11.6 <13 | TOTP enabled (REST) | 현재 |
| 1.x (planned) | >=11 <13 | >=12 <14 | TOTP + Passkey adapter | Phase 5 |

- **GitHub issues**: best-effort 응답 7-14일 (1-person operator)
- **보안 issue**: GitHub Security advisory + 5일 내 응답 약속
- **상용 우선 지원**: `$299 fixed-fee Firebase MFA integration review` 서비스 (별도 page)

## 6. "Use Only If" Disclaimer

본 kit 의 적합한 사용자:

- ✅ Firebase Auth 의 email/password (or OAuth) 사용 중
- ✅ Identity Platform upgrade 결정 또는 이미 활성
- ✅ Next.js / Vite / CRA / Expo (Phase 3) React 프로젝트
- ✅ TOTP MFA 로 충분 (Phase 5 까지 Passkey 안 기다림)

부적합한 사용자:

- ❌ **Auth.js / NextAuth / Clerk / Supabase / Stack Auth / Better Auth** → native MFA 사용
- ❌ Custom auth (Firebase 아님) → 본 kit 미적용
- ❌ Passkey-only 정책 → Phase 5 대기 또는 Hanko / Stack Auth 등

## 7. Sustainability Statement

본 kit 은 **1-person operator** 가 maintain. **Lucia** (March 2025 deprecated — 4년 운영 후 burn-out) 와 같은 abandonment 위험을 인지:

- **Phase 4 Pro tier launch** = 최소 **3명 paying user 명시 요청** 후만 build. 미리 build 금지.
- **본 kit fork 권장** — MIT 라이센스. 운영 중단 시 사용자가 자가 maintain 가능.
- **`update/diff` 명령** 으로 사용자 own copy 가 upstream 와 diverge 해도 사용자 통제.

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
```

- [ ] **Step 2: Verify the file**

```bash
wc -l docs/PRODUCTION-CHECKLIST.md
head -20 docs/PRODUCTION-CHECKLIST.md
```

Expected: ~110-130 lines.

- [ ] **Step 3: Commit**

```bash
git add docs/PRODUCTION-CHECKLIST.md
git commit -m "docs: add PRODUCTION-CHECKLIST.md (liability + threat model + support policy + sustainability)"
```

---

## Task 5: spec.md 수정 (9 영역)

**Background:** design doc §5-1 — 9 sections 변경.

**Files:**
- Modify: `spec.md` (header / §0 / §1 / §4 / §7 / §10 / §11 / §12 / §14 / 부록 B)

이 task 는 sequential 9 edit step. 각 step 은 specific edit.

- [ ] **Step 1: Header tagline 교체**

Edit `spec.md:3-5`:

```diff
- > Firebase Auth + Identity Platform TOTP MFA, drop-in for any React project.
- > **Add it in 30 seconds. Own the code.**
- > shadcn-style CLI + registry source install. Claude/Codex = fallback orchestration.
+ > Firebase Auth + Identity Platform TOTP MFA, drop-in for any React project.
+ > **Firebase TOTP MFA in 10 minutes — with auditable diffs.**
+ > shadcn-style CLI · Own the code · Agent-compatible (Claude Code / Codex).
```

- [ ] **Step 2: §0 TL;DR — "약 10분" 명세 강화 + AI = agent-compatible**

Edit `spec.md:24`:

```diff
- → **약 10분**. AI 사용자는 Claude/Codex 에게 "이 kit 으로 TOTP MFA 설치해줘" 한 줄로 위 흐름을 트리거 (단 CLI 가 모든 deterministic 작업 수행).
+ → **약 10-minute install + 30-second code insertion**. CLI 가 모든 deterministic 작업 수행. AI 사용자 (Claude Code / Codex) 가 본 kit 의 `CLAUDE.md` / `AGENTS.md` agent-compatibility playbook 을 따라 CLI 호출 — AI 가 직접 코드 작성 X (LLM trust 장벽 대응).
```

- [ ] **Step 3: §1 목적 HOW — AI hero 격하**

Edit `spec.md:34` HOW 행:

```diff
- | **HOW (핵심 UX)** | (1) `npx firebase-totp-mfa add` CLI 가 deterministic 으로 framework detect + source 파일 복사 + diff. (2) Claude/Codex 는 CLI 호출 + 사용자 안내 + edge case fallback. (3) 사용자가 자기 프로젝트의 코드 소유 = 디버깅 + 커스터마이즈 가능. |
+ | **HOW (핵심 UX)** | (1) **CLI deterministic primary** — `npx firebase-totp-mfa add` 가 framework detect + source 파일 복사 + diff. (2) **Agent-compatible** — Claude/Codex 등 AI agent 가 CLI 호출 (직접 코드 작성 X, deterministic mutation 만). (3) **Own the code** — shadcn-style 사용자 프로젝트 source 소유 = 디버깅·커스터마이즈·audit. |
```

- [ ] **Step 4: §4 Commands — §4-5 update/diff 신규**

Find the end of §4-4 in `spec.md` (after `verify` command, around line 219). Insert new §4-5:

```markdown
### 4-5. `firebase-totp-mfa update`

**용도**: 본 kit 의 registry source 가 사용자 프로젝트의 local copy 와 diverge 했는지 확인 (shadcn-style copy 의 own-code divergence 대응)

**flags**:
- `--dry-run` — diff 만 출력, 파일 변경 X. default = true (alpha 단계)
- (Phase 2.1 이후) `--apply <files>` — 명시적 file 만 overwrite (사용자 승인 후)

**흐름**:
1. **Read** — 사용자 프로젝트의 `.firebase-totp-mfa.json` metadata (CLI add 시 작성됨)
2. **Compare** — local version ↔ CLI 의 registry version
3. **Diff** — 각 file 별 변경 사항 표시
4. **Report** — divergence list + 향후 apply 흐름 안내

**registry version metadata** (`.firebase-totp-mfa.json`):
```json
{
  "version": "0.0.1",
  "installed": [
    { "source": "components/TotpEnroll.source.tsx", "dest": "src/components/TotpEnroll.tsx" }
  ],
  "installedAt": "2026-05-12T12:00:00.000Z"
}
```

본 metadata 가 update workflow 의 기반.
```

- [ ] **Step 5: §7 Claude/Codex — header rename 만 (본문 유지)**

Edit `spec.md:333`:

```diff
- ## 7. Claude / Codex Orchestration — **Fallback Layer** (codex §2 #2)
+ ## 7. Claude / Codex Orchestration — **Agent Compatibility Layer** (codex §2 #2)
```

§7-1 의 본문 ("CLI 가 primary, AI 는 fallback") 그대로 유지 — codex 결론 = CLI primary 가 정답. brainstorming 결정 D3 (AI primary) 가 reverse 됐으므로 본문 reaffirm.

- [ ] **Step 6: §10 Phase 분할 — Phase 3 RN conditional**

Edit `spec.md:452`:

```diff
- | **3 — RN adapter** | RN registry source + Expo playground + RN-specific docs | 2-3일 |
+ | **3 — RN adapter (conditional)** | RN registry source + Expo playground + RN-specific docs. **조건: Phase 2 traction 검증 후 (5 case studies + 3 Pro pay willing user)** | 2-3일 |
```

- [ ] **Step 7: §11 검증 체크리스트 — Real mode stub 명시 (memory feedback)**

Find `spec.md:482-489` (11-3. Real mode 검증). Insert at the top of section 11-3:

```markdown
> ⚠️ **alpha 단계 한계** (Phase 1 발견): `examples/nextjs-playground` 의 `login/page.tsx` / `mfa-enroll/page.tsx` / `recovery/page.tsx` 의 **real mode 분기는 stub 상태**. 코드 comment "see Task 8 dogfood" 가 implementation gap 흔적. Real flow 검증은 **Phase 3 의 dogfood path** (빈 Next.js + CLI registry copy) 가 흡수. Phase 2 launch 까지 playground real mode 보완은 NOT in scope (codex SCOPE REDUCTION).
```

- [ ] **Step 8: §12 한계 — Passkey roadmap + Firebase-only disclaimer**

Add two rows at the end of §12 table (after line ~528):

```markdown
| **Passkey/WebAuthn displacement (24-month horizon)** | FIDO/Google/Apple passkey 도입 가속 (Google passkey-first for own accounts). TOTP-only 가 24개월 내 legacy 인식 가능성. **본 kit 의 Phase 5 = TOTP backup factor 유지 + passkey first-class adapter**. |
| **Use only if staying on Firebase Auth** | Auth.js / NextAuth / Clerk / Supabase / Stack Auth / Better Auth 사용자 → native MFA 사용. 본 kit 은 Firebase Auth 잔존자 (또는 Firebase Identity Platform 신규 사용자) 용. |
```

- [ ] **Step 9: §14 결정 사항 + 부록 B docs index**

§14 table 끝에 추가 (after line 579):

```markdown
| Sustainability statement | 1-person operator. Lucia (March 2025 deprecated, 4년 운영 후 burn-out) 경고 모델. Phase 4 Pro tier launch = 최소 3명 paying user 명시 요청 후만 build. fork 권장. |
| AI orchestration 정체성 | Hero = CLI deterministic. AI (Claude/Codex) = agent-compatible sub-claim (직접 코드 작성 X, CLI 호출만). LLM trust 장벽 대응. |
```

부록 B docs index (around line 628-642) 에 추가:

```diff
  | `docs/setup-gcp.md` | 사용자 직접 작업 6단계 (Console UI) |
+ | `docs/PRODUCTION-CHECKLIST.md` | **신규 Phase 2** — production 검증 7 sections (setup verify / server enforce / recovery / liability / support / Firebase-only / sustainability) |
+ | `docs/2026-05-11-firebase-totp-mfa-guide.md` | Rosetta-stone 기술 가이드 — Identity Platform 활성 + TOTP REST PATCH + FE 구현 모든 흐름 |
```

- [ ] **Step 10: Verify + Commit**

```bash
git diff spec.md  # review all 9 edits
git add spec.md
git commit -m "docs(spec): v3 rollout — hero reframe, update cmd §4-5, AI agent-compatible header, Phase 3 RN conditional, passkey roadmap, Firebase-only disclaimer, sustainability note"
```

---

## Task 6: README.md 수정

**Background:** design doc §5-2.

**Files:**
- Modify: `README.md` (hero / Why / Status / disclaimer)

- [ ] **Step 1: Edit README header (lines 1-5)**

Replace:
```markdown
# Firebase TOTP MFA Kit

> Firebase Auth + Identity Platform TOTP MFA. **Add it in 30 seconds. Own the code.**

shadcn-style CLI + registry source install for Next.js / Vite / CRA. AI-friendly (Claude Code / Codex fallback playbook).
```

With:
```markdown
# Firebase TOTP MFA Kit

> **Firebase TOTP MFA in 10 minutes — with auditable diffs.**

shadcn-style CLI + registry source install for Next.js / Vite / CRA.
**CLI primary · Own the code · Agent-compatible (Claude Code / Codex).**
```

- [ ] **Step 2: Update Why section + add Firebase-only disclaimer**

Replace lines 36-41 (Why section):

```markdown
## Why

- **SMS cost = 0** — official Firebase TOTP, free up to 3,000 DAU on Spark plan
- **Own the code** — shadcn-style source install. Debug / customize / audit yourself. `firebase-totp-mfa update --dry-run` to track upstream drift.
- **Officially backed** — Identity Platform, not custom auth
- **Recovery codes + server enforcement** — Phase 1 includes both
- **Agent-compatible** — Claude Code / Codex follow `CLAUDE.md` / `AGENTS.md` playbook; CLI is the deterministic mutation layer (LLM trust boundary)

**Use this only if you are staying on Firebase Auth.** Migrating to Clerk / Supabase / Auth.js / Stack Auth → use their native MFA. See [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) §6.
```

- [ ] **Step 3: Update Status section**

Replace lines 43-47:

```markdown
## Status

- 🚧 **Phase 1 (CLI alpha) complete** — code + GCP integration verified
- 🚧 **Phase 2 (public launch readiness) in progress** — `update/diff` command, PRODUCTION-CHECKLIST, npm stub publish, validation artifact
- See [`spec.md`](spec.md) for full design (v3, 2026-05-12)
- See [`docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md`](docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md) for current Phase 2 plan
- See [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) for production readiness
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): v3 hero — 10-minute Firebase TOTP MFA, agent-compatible, Firebase-only disclaimer"
```

---

## Task 7: internal/business-plan.md 수정

**Background:** design doc §5-3.

**Files:**
- Modify: `internal/business-plan.md` (§2-1 강조 / §2-2 표 / §7 / §9 KPI)

- [ ] **Step 1: §2-1 강조 추가**

Find `internal/business-plan.md:28-32` (§2-1 현실적 가설). Add a strong header line at the top:

```markdown
### 2-1. 현실적 가설 (codex §6)

> **결론 (2026-05-12 v3 reframe)**: AdSense 는 BM 아님 — 도메인비 회수 수준. 진짜 수익원 = **$299 audit service + GitHub Sponsors**. Pro tier 는 **3명 paying user 명시 요청 검증 후만 build**.

월 5,000 demo pageview × $1-$5 RPM = **$5-$25 / 월**. 개발자 audience 의 ad blocker 비율 30-50% 감안 시 실제 더 낮음.
```

(rest of §2-1 unchanged.)

- [ ] **Step 2: §2-2 표 — $299 audit service 행 추가**

Find `internal/business-plan.md:38-44` (§2-2 표). Insert a new row between "AdSense" (priority 1) and "Pro tier" (currently priority 2):

```markdown
| **$299 fixed-fee "Firebase MFA integration audit" service** | 2 | 1-2 hour Zoom 검토 + written report + production checklist 적용 도움. Pro tier 의 BM validation 도구. 분기 2-5건 = $2.4K-$6K/년 | Phase 2 직후 — landing page + Stripe 1주 |
```

Adjust Pro tier (currently priority 2) → priority 3.

- [ ] **Step 3: §7 마케팅 채널 — $50k 30-day plan 반영**

Find `internal/business-plan.md:117-145` (§7 마케팅 채널). After Tier 1 list (line ~135), add a sub-section:

```markdown
### Phase 2 launch playbook (codex high $50k 30-day plan, 2026-05-12 채택)

순차 진행:

1. **Week 1**: npm `firebase-totp-mfa` stub publish + landing page (hero 교체 — "10-minute Firebase TOTP MFA with auditable diffs")
2. **Week 1-2**: 3 SEO long-tail pain pages 작성 (`Firebase TOTP REST enable 403` / `auth/requires-recent-login` / `Firebase TOTP recovery codes`)
3. **Week 2-3**: **15 founder/agency demand 인터뷰** (Twitter DM / r/Firebase / LinkedIn) — demand qualification, not promotion
4. **Week 3**: **5 hands-on installs in real repos** (인터뷰 후 willing repo owners 와 pair install)
5. **Week 4**: Show HN live demo + production checklist endpoint. r/Firebase, r/nextjs, r/SideProject 동시 게시.

성공 bar: 10 qualified repo owners + 3 live pairing calls + 1 user 가 본 kit 을 own repo 에서 사용 willing. 미달성 시 Phase 4 Pro tier build 진입 차단.
```

- [ ] **Step 4: §9 KPI — codex honest forecast 로 down-revise**

Find `internal/business-plan.md:164-177` (§9 KPI 표). Edit values:

```diff
- | GitHub stars | 500-1,500 | HN 1회 + r/Firebase + shadcn 커뮤니티 노출로 도달 가능 |
+ | GitHub stars | **150-600** (codex honest forecast 2026-05-12) | Better Auth (28.2k), Stack Auth (6.6k), Lucia (deprecated) 비교군. HN front-page 도달 시 +200-400 spike 가능. 본 kit = narrow add-on, not platform |
- | npm 주간 다운로드 | 200-500 | CLI 패키지 — `firebase-totp-mfa` |
+ | npm 주간 다운로드 | **40-250** (codex honest forecast) | firebase 3.06M wk / @clerk 353-423K wk / next-auth 3.6M wk 와 비교. 본 kit = narrow add-on, 도달 어려움 |
  | Demo 사이트 월 pageview | 5,000-10,000 | HN traffic + 검색 inbound |
  | AdSense 월 수익 | $5-$25 | 도메인비 회수 |
  | GitHub Sponsors | $20-$100 / 월 | trust 기반 인디 reciprocity |
  | buildwithclaude.com 사용 | 월 10-50건 | Claude orchestration 채택률 |
- | Pro tier 유료 사용자 | Phase 4 후 5-20명 | 평균 $30/월 = $150-600 |
+ | Pro tier 유료 사용자 | **0-3 (Phase 4 후, 가설 — 3명 paying 명시 요청 시만 build)** | codex forecast: 매우 낮음. 검증 후 결정 |
+ | **$299 audit service** | 분기 2-5건 = $2.4K-$6K/년 | Pro tier 대체 BM validation 도구. Phase 2 직후 launch |
  | Consulting inbound | Phase 4 후 1-3건 / 분기 | $1K-$5K / 건 |
```

Update line 177:
```diff
- → **MVP 1년 수익 목표 = $1,500-$3,000** (대부분 Pro tier + Consulting 의존). AdSense 는 운영비 회수.
+ → **MVP 1년 수익 목표 = $3,000-$8,000** (대부분 $299 audit service + GitHub Sponsors + Consulting). AdSense 는 도메인비 회수. Pro tier 는 validation 통과 후 build (현재 = 0).
```

- [ ] **Step 5: Commit**

```bash
git add internal/business-plan.md
git commit -m "docs(internal): business-plan v3 — \$299 audit service, KPI down-revise, \$50k 30-day plan"
```

---

## Task 8: AGENTS.md + CLAUDE.md header reframe

**Files:**
- Modify: `AGENTS.md` (header label)
- Modify: `CLAUDE.md` (header label)

(Body 의 "절대 금지 5개 hard rule" 유지 — codex 의 LLM trust 장벽 대응)

- [ ] **Step 1: Update AGENTS.md header**

Open `AGENTS.md`. Find the first header line (after `# Claude Code Orchestration` or similar). Update to:

```markdown
# AI Agent Compatibility Playbook — firebase-totp-mfa-kit

> **CLI is primary. AI agents (Claude Code / Codex) call the deterministic CLI.** This file is the agent fallback for edge cases the CLI cannot handle alone.
```

Then keep all "절대 금지" 5 hard rules unchanged.

- [ ] **Step 2: Update CLAUDE.md header (same content)**

Sync `CLAUDE.md` to match `AGENTS.md`. If the project policy is "CLAUDE.md = AGENTS.md verbatim", just copy.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md CLAUDE.md
git commit -m "docs(agents): rename 'fallback' to 'agent compatibility' — CLI primary remains explicit"
```

---

## Task 9: 메모리 동기화

**Files:**
- Modify: `C:\Users\Dev_jaeyoun\.claude\projects\C--Dev-firebase-totp-mfa-kit\memory\MEMORY.md`
- Modify: `C:\Users\Dev_jaeyoun\.claude\projects\C--Dev-firebase-totp-mfa-kit\memory\project_phase1_status.md`
- Modify: `C:\Dev\firebase-totp-mfa-kit\.claude\session-handoff.md`
- Create: `C:\Users\Dev_jaeyoun\.claude\projects\C--Dev-firebase-totp-mfa-kit\memory\project_strategy_redesign_v3.md` (new memory)

- [ ] **Step 1: Create new memory file**

Create `project_strategy_redesign_v3.md`:

```markdown
---
name: project-strategy-redesign-v3
description: 2026-05-12 strategic reframe. codex high + plan-ceo-review SCOPE REDUCTION 으로 brainstorming 5 결정 모두 reverse. Approach A (codex focus + audit service).
metadata:
  type: project
---

5 결정 (D1-3A) 확정:
- D1: Approach A (codex focus + $299 audit service)
- D2: SCOPE REDUCTION
- 1A: update/diff cmd 신규
- 2A: docs/PRODUCTION-CHECKLIST.md 신규
- 3A: Passkey roadmap + Firebase-only disclaimer

**Why:** brainstorming 의 5 결정 (AI hero / Mobile QA dual / AI primary / 3 docs / Pro Phase 4) 모두 외부 시선 reverse. codex web-searched evidence — Firebase npm 3.06M vs 본 kit narrow add-on. AI hero 가 LLM trust 장벽 악화. Pro tier unvalidated. Lucia (March 2025 deprecated) 경고.

**How to apply:**
- Spec v3 reframe 진행 중 — design doc `docs/superpowers/specs/2026-05-12-strategy-redesign-v3-design.md`
- Phase 2 plan `docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md`
- Phase 2 must items 7개 (3 DELETE + 3 ADD + 1 must-fix) ship-blocking
- Phase 2 nice items 8개 (validation artifact) ship-after
- KPI 갱신: stars 150-600, npm DL 40-250, Pro 0-3 (codex honest forecast)
- Pro tier build = 3명 paying 명시 요청 후만
- [[reference-codex-axis-review]] 와 연결 (.superpowers/brainstorm/.../codex-axis-review.md)
```

- [ ] **Step 2: Update MEMORY.md (add new entry)**

Edit `MEMORY.md`. Add after existing entries:

```markdown
- [Strategy Redesign v3](project_strategy_redesign_v3.md) — 2026-05-12. codex high + plan-ceo-review SCOPE REDUCTION 으로 brainstorming 5 결정 reverse. Approach A confirmed.
```

- [ ] **Step 3: Update project_phase1_status.md description**

Edit the front-matter description:
```diff
- description: 2026-05-12 업데이트. Task 1-7 코드 + Task 8-1 자동 검증 + Task 8-2 (B 옵션 스코프 축소) 완료. 잔여: Task 8-3 Claude dogfood + Phase 2 진입.
+ description: 2026-05-12 업데이트. Phase 1 완료 + Phase 2 진입. design doc + plan 작성됨 (`docs/superpowers/specs|plans/2026-05-12-*`). [[project-strategy-redesign-v3]] 참조.
```

- [ ] **Step 4: Update session-handoff.md**

Edit `.claude/session-handoff.md`. Update header section:

```markdown
## 마지막 세션 종료 시점 (2026-05-12 야간 — strategic reframe v3)

**Phase 1 완료 + Phase 2 design + plan 작성 완료**. codex high + plan-ceo-review SCOPE REDUCTION 외부 시선으로 brainstorming 5 결정 reverse. Approach A 확정.

다음 step: `docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md` Task 1-10 실행 (Phase 2 must items ship-blocking).
```

- [ ] **Step 5: Commit (memory 는 user-level 이라 본 repo commit 대상 아님)**

본 repo 의 변경 file 만:
```bash
git add .claude/session-handoff.md
git commit -m "chore(handoff): update session note — Phase 2 design + plan ready"
```

User-level memory file 들은 `C:\Users\Dev_jaeyoun\.claude\projects\...` 의 .git 영역 (있다면) 에 별도 commit, 또는 그냥 file 변경만.

---

## Task 10: npm Stub Package Publish (운영 — 사용자 직접)

**Background:** codex axis-3 "Package-name risk MEDIUM". `firebase-totp-mfa` 이름 확보.

**Files:**
- Modify: `packages/cli/package.json` (version, repository, keywords, license 등)

이 task 는 **사용자 직접 수행** (운영자 본인의 npm 계정으로 publish).

- [ ] **Step 1: Verify package.json metadata**

Open `packages/cli/package.json`. Verify:
- `name`: `"firebase-totp-mfa"`
- `version`: `"0.1.0-alpha.0"` (or current)
- `description`: 짧고 명확한 한 문장 (예: `"Firebase TOTP MFA in 10 minutes — shadcn-style CLI + registry source install"`)
- `license`: `"MIT"`
- `repository`: GitHub URL (사용자가 결정 — 현재 `<gh-user>` placeholder)
- `keywords`: `["firebase", "totp", "mfa", "2fa", "identity-platform", "shadcn-style", "cli", "nextjs", "react"]`
- `homepage`: GitHub URL
- `bugs`: GitHub Issues URL

If `<gh-user>` placeholder 남아있으면 → 사용자 확정 GitHub username 으로 일괄 치환 (Phase 2 의 가장 첫 작업, plan 외부 결정).

- [ ] **Step 2: Build + dry-run publish**

```bash
cd packages/cli
npm run build
npm publish --dry-run --tag alpha
```

Expected:
- `npm notice` 으로 publish 될 file list 표시
- `node_modules`, `test`, `src` 포함 X (built `dist/` + `package.json` + `README.md` + `LICENSE` 만)
- `package.json` 의 `files` field 또는 `.npmignore` 확인 필요

If unwanted files 포함되면 → `packages/cli/.npmignore` 또는 `package.json` `"files"` field 정리.

- [ ] **Step 3: Real publish (사용자 직접)**

```bash
cd packages/cli
npm login  # 사용자의 npm 계정
npm publish --tag alpha
```

Expected:
- `+ firebase-totp-mfa@0.1.0-alpha.0`
- npm registry 에 패키지 등장: https://www.npmjs.com/package/firebase-totp-mfa

⚠️ **destructive operation** — publish 는 retract 가능 (72시간 내 unpublish) 하지만 이름 확보가 목표라 alpha tag 로 publish OK. 단 사용자 명시 확인 후만 실행.

- [ ] **Step 4: Verify**

```bash
npx firebase-totp-mfa@alpha --version
```

Expected: `0.1.0-alpha.0` (or current).

- [ ] **Step 5: Commit + tag**

```bash
git add packages/cli/package.json packages/cli/.npmignore
git commit -m "chore(cli): publish firebase-totp-mfa@0.1.0-alpha.0 (name reservation)"
git tag v0.1.0-alpha.0
git push origin v0.1.0-alpha.0   # if remote origin 설정됨, 아니면 skip
```

---

## Phase 2-B (Nice Items) — Reference Only

본 plan 은 Phase 2-A Must (Task 0-10) 완료 후 별도 plan 으로 작성. Nice items 8개:

1. Hosted demo site (Firebase Hosting + custom domain — operator GCP project 재사용)
2. 90s orchestration screen video (Twitter/X / HN inline)
3. 1-3 case studies — real Firebase app 적용 + timestamps
4. SEO long-tail pain pages 3-5 (`Firebase TOTP REST 403`, `auth/requires-recent-login`, `Firebase TOTP recovery codes`)
5. `$299 fixed-fee` audit service launch (landing page + Stripe)
6. 15 founder/agency demand 인터뷰 (Twitter DM / r/Firebase / LinkedIn)
7. 5 hands-on installs in real repos
8. Show HN endpoint (live demo + production checklist)

가이드: `docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md` Phase 2-A 완료 후 새 plan 시작 — Phase 2-B 의 단위는 운영/content/마케팅 위주라 별도 사이클.

---

## Self-Review

본 plan 의 self-review (writing-plans skill Step "Self-Review"):

**1. Spec coverage** — design doc §3 Phase 2 Must 6 + 1 must-fix (CLI GET 404 from Phase 1):

| Must item | Task | 상태 |
|---|---|---|
| "30s" headline 교체 | Task 5 Step 1 + Task 6 Step 1 | ✓ |
| AdSense core BM 제거 | Task 7 Step 1-2 | ✓ |
| Phase 3 RN 근시 commitment 제거 | Task 5 Step 6 | ✓ |
| update/diff cmd 신규 | Task 2 + Task 3 | ✓ |
| PRODUCTION-CHECKLIST.md 신규 | Task 4 | ✓ |
| "Use only if staying on Firebase" disclaimer | Task 4 §6 + Task 5 Step 8 + Task 6 Step 2 | ✓ |
| CLI GET 404 must-fix (Phase 1 발견) | Task 1 | ✓ |
| npm stub publish | Task 10 | ✓ |
| Passkey roadmap | Task 5 Step 8 | ✓ |
| Sustainability note + Lucia 모델 | Task 4 §7 + Task 5 Step 9 | ✓ |
| KPI down-revise | Task 7 Step 4 | ✓ |
| 부록 B docs index (2026-05-11 가이드) | Task 5 Step 9 | ✓ |
| §11 검증 체크리스트 real mode stub 명시 | Task 5 Step 7 | ✓ |
| 메모리 동기화 | Task 9 | ✓ |
| AGENTS/CLAUDE header reframe | Task 8 | ✓ |

→ 모든 must covered.

**2. Placeholder scan** — "TBD" / "TODO" inline 없음. 모든 step 에 actual code 또는 actual edit.

**3. Type consistency** — `UpdateOptions`, `UpdateResult`, `RegistryMetadata` 일관. Task 2 의 `runUpdate` ↔ Task 3 의 `writeRegistryMetadata` ↔ Task 5 Step 4 의 spec §4-5 metadata schema 모두 일치.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-12-phase2-strategy-rollout.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration. 10 task = ~10 subagent dispatch. 사용자가 task 별 review 후 다음 진행.

**2. Inline Execution** — 본 session 에서 task 순차 실행. batch checkpoint 마다 사용자 review. 한 session 으로 끝남 (단 context 큼).

Which approach?
