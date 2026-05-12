import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import pc from 'picocolors';
import fg from 'fast-glob';
import { detectFramework, type Framework } from '../utils/detect-framework.js';
import { detectPackageManager, installCmd } from '../utils/detect-package-manager.js';
import { detectFirebaseExport } from '../utils/detect-firebase-export.js';
import {
  type FileChange,
  confirm,
  printFileChange,
  summarize,
} from '../utils/diff-and-confirm.js';
import { findRegistryRoot } from '../utils/registry-paths.js';
import { writeRegistryMetadata } from '../utils/registry-version.js';
import { planNextAppRouter } from '../codemods/next-app-router.js';
import { planNextPagesRouter } from '../codemods/next-pages-router.js';
import { planViteReact } from '../codemods/vite-react.js';
import { planCra } from '../codemods/cra.js';

export type AddServer = 'express' | 'cloud-functions' | 'cloud-run' | 'next-route-handler' | 'none';

export interface AddOptions {
  area: string;
  issuer: string;
  firebaseExport: string | undefined;
  includeRecovery: boolean;
  server: AddServer;
  dryRun: boolean;
  yes: boolean;
  cwd: string;
  /** CLI's own version, supplied by the index.ts entry point. Stamped into .firebase-totp-mfa.json metadata. */
  cliVersion: string;
}

const DEST_COMPONENTS_DIR = 'src/components/totp-mfa';

export async function runAdd(framework: string | undefined, opts: AddOptions): Promise<number> {
  console.log(pc.bold('firebase-totp-mfa add'));
  console.log(pc.dim(`cwd: ${opts.cwd}`));
  console.log('');

  // 1. Detect
  const fwDetect = detectFramework(opts.cwd);
  const pm = detectPackageManager(opts.cwd);
  const fbDetect = await detectFirebaseExport(opts.cwd);

  const requestedFw = normalizeFramework(framework ?? fwDetect.framework);
  console.log(`Framework: ${pc.cyan(requestedFw)} ${pc.dim(`(detected: ${fwDetect.framework})`)}`);
  console.log(`Package manager: ${pc.cyan(pm)}`);

  const firebaseImportPath = opts.firebaseExport ?? fbDetect.importPath;
  if (!firebaseImportPath) {
    console.log(pc.red('✗ Firebase auth export not found.'));
    for (const e of fbDetect.evidence) console.log(pc.dim(`  · ${e}`));
    console.log('');
    console.log(
      `Use ${pc.cyan('--firebase-export <path>')} (e.g. ${pc.cyan('--firebase-export @/lib/firebase')}).`,
    );
    return 2;
  }
  console.log(`Firebase auth: ${pc.green(firebaseImportPath)}`);
  console.log(`MFA area: ${pc.cyan(opts.area)}`);
  console.log(`Issuer: ${pc.cyan(opts.issuer)}`);
  console.log(`Recovery codes: ${opts.includeRecovery ? pc.green('yes') : pc.dim('no')}`);
  console.log(`Server snippet: ${pc.cyan(opts.server)}`);
  console.log('');

  // 2. Plan
  const componentsImportPath = '@/components/totp-mfa';
  const changes: FileChange[] = [];

  // 2a. Registry files (components / hooks / lib)
  const registryPlan = planRegistryCopy(opts);
  changes.push(...registryPlan.changes);

  // 2b. Codemod (framework-specific)
  changes.push(
    ...planCodemod(requestedFw, {
      cwd: opts.cwd,
      area: opts.area,
      firebaseImportPath,
      componentsImportPath,
    }),
  );

  // 2c. Server snippet (선택)
  if (opts.server !== 'none') {
    changes.push(...planServerSnippet(opts.server));
  }

  // 2d. peer 의존성 안내
  changes.push({
    path: '(no file change)',
    kind: 'skip',
    newContent: '',
    reason: `Run \`${installCmd[pm]} firebase qrcode\` to install peer deps`,
  });

  // 3. Diff + Summary
  console.log(pc.bold('Plan:'));
  for (const c of changes) printFileChange(c);
  const sum = summarize(changes);
  console.log('');
  console.log(
    pc.bold(
      `Summary: ${pc.green(`+${sum.creates}`)} create, ${pc.yellow(`~${sum.modifies}`)} modify, ${pc.dim(`${sum.skips} skip`)}`,
    ),
  );

  if (opts.dryRun) {
    console.log(pc.dim('\n--dry-run: no files written.'));
    return 0;
  }

  // 4. Confirm
  if (!opts.yes) {
    const ok = await confirm('Apply these changes?', true);
    if (!ok) {
      console.log(pc.dim('Aborted.'));
      return 0;
    }
  }

  // 5. Apply
  for (const c of changes) {
    if (c.kind === 'skip') continue;
    const fullPath = join(opts.cwd, c.path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, c.newContent, 'utf-8');
    console.log(pc.green(`  ✓ ${c.path}`));
  }

  // 5b. Write .firebase-totp-mfa.json metadata (registry source → dest mapping for `update`)
  try {
    writeRegistryMetadata(opts.cwd, opts.cliVersion, registryPlan.installed);
    console.log(pc.dim(`  ✓ Wrote .firebase-totp-mfa.json (registry version ${opts.cliVersion})`));
  } catch (e) {
    console.log(pc.yellow(`  ⚠ Could not write .firebase-totp-mfa.json: ${(e as Error).message}`));
    console.log(pc.yellow('    Registry files were copied successfully, but `update` will not work until metadata is recovered.'));
    console.log(pc.dim('    Recover by re-running `firebase-totp-mfa add` once the underlying issue is fixed.'));
  }

  // 6. Postscript
  console.log('');
  console.log(pc.bold('Next steps:'));
  console.log(`  1. ${pc.cyan(`${installCmd[pm]} firebase qrcode`)}`);
  console.log(`  2. ${pc.cyan('npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run')}`);
  console.log(`  3. Fill ${pc.cyan('.env.local')} with Firebase config`);
  console.log(`  4. ${pc.cyan(pmRun(pm, 'dev'))} → test ${opts.area}/login → enroll → dashboard`);

  return 0;
}

function pmRun(pm: ReturnType<typeof detectPackageManager>, script: string): string {
  return pm === 'npm' ? `npm run ${script}` : `${pm} ${script}`;
}

function normalizeFramework(fw: string | Framework): Framework {
  const map: Record<string, Framework> = {
    next: 'next-app-router',
    'next-app': 'next-app-router',
    'next-pages': 'next-pages-router',
    vite: 'vite-react',
    'vite-react': 'vite-react',
    cra: 'cra',
    expo: 'expo',
  };
  return (map[fw] ?? fw) as Framework;
}

interface RegistryPlan {
  changes: FileChange[];
  installed: { source: string; dest: string }[];
}

function planRegistryCopy(opts: AddOptions): RegistryPlan {
  const registry = findRegistryRoot();
  const changes: FileChange[] = [];
  const installed: { source: string; dest: string }[] = [];

  // copy components + css
  const components = fg.sync(['components/**/*'], { cwd: registry, onlyFiles: true });
  // copy hooks
  const hooks = fg.sync(['hooks/**/*'], { cwd: registry, onlyFiles: true });
  // copy lib (recovery 는 opts.includeRecovery 일 때만)
  const lib = fg
    .sync(['lib/**/*'], { cwd: registry, onlyFiles: true })
    .filter((f) => opts.includeRecovery || !f.includes('recovery'));

  for (const rel of [...components, ...hooks, ...lib]) {
    if (!opts.includeRecovery && rel.toLowerCase().includes('recovery')) continue;
    const src = join(registry, rel);
    const body = readFileSync(src, 'utf-8');
    // .source.ts → .ts, .source.tsx → .tsx
    const destRel = rel.replace(/\.source\.(tsx?|css)$/, '.$1');
    const destPath = join(DEST_COMPONENTS_DIR, destRel).replace(/\\/g, '/');
    const fullDestPath = join(opts.cwd, destPath);
    const existing = existsSync(fullDestPath) ? readFileSync(fullDestPath, 'utf-8') : null;
    if (existing && existing === body) {
      changes.push({ path: destPath, kind: 'skip', newContent: body, reason: 'identical' });
    } else if (existing) {
      changes.push({ path: destPath, kind: 'modify', oldContent: existing, newContent: body });
    } else {
      changes.push({ path: destPath, kind: 'create', newContent: body });
    }
    // Track every registry file in the installed manifest — even 'skip' (identical) entries —
    // because `update` needs the full source→dest mapping regardless of current diff state.
    installed.push({ source: rel.replace(/\\/g, '/'), dest: destPath });
  }

  return { changes, installed };
}

function planCodemod(
  fw: Framework,
  input: { cwd: string; area: string; firebaseImportPath: string; componentsImportPath: string },
): FileChange[] {
  switch (fw) {
    case 'next-app-router':
      return planNextAppRouter(input);
    case 'next-pages-router':
      return planNextPagesRouter(input);
    case 'vite-react':
      return planViteReact(input);
    case 'cra':
      return planCra(input);
    default:
      return [
        {
          path: '(codemod skipped)',
          kind: 'skip',
          newContent: '',
          reason: `framework=${fw} not yet supported — see docs/manual-setup.md`,
        },
      ];
  }
}

function planServerSnippet(server: AddServer): FileChange[] {
  if (server === 'none') return [];
  const registry = findRegistryRoot();
  const map: Record<Exclude<AddServer, 'none'>, string> = {
    express: 'express-mfa-middleware.source.ts',
    'cloud-functions': 'cloud-functions-mfa.source.ts',
    'cloud-run': 'cloud-run-mfa.source.ts',
    'next-route-handler': 'next-route-handler-mfa.source.ts',
  };
  const src = join(registry, 'server', map[server]);
  if (!existsSync(src)) {
    return [{ path: `(server: ${server})`, kind: 'skip', newContent: '', reason: 'snippet missing' }];
  }
  const body = readFileSync(src, 'utf-8');
  const destPath = `src/server/${map[server].replace('.source.ts', '.ts')}`;
  return [{ path: destPath, kind: 'create', newContent: body }];
}
