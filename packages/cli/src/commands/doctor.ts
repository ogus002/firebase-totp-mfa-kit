import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pc from 'picocolors';
import { detectFramework } from '../utils/detect-framework.js';
import { detectPackageManager } from '../utils/detect-package-manager.js';
import { detectFirebaseExport } from '../utils/detect-firebase-export.js';
import {
  gcloudActiveAccount,
  gcloudCurrentProject,
  gcloudVersion,
} from '../utils/exec-gcloud.js';

export interface DoctorOptions {
  cwd: string;
  project?: string;
}

export async function runDoctor(opts: DoctorOptions): Promise<number> {
  console.log(pc.bold('firebase-totp-mfa doctor'));
  console.log('');

  // Project env
  const fw = detectFramework(opts.cwd);
  const pm = detectPackageManager(opts.cwd);
  const fb = await detectFirebaseExport(opts.cwd);
  const { firebaseVer, firebaseAdminVer } = readFirebaseVersions(opts.cwd);

  console.log(pc.bold('Project:'));
  console.log(`  framework: ${fmt(fw.framework, fw.framework !== 'unknown')}`);
  console.log(`  package manager: ${pc.cyan(pm)}`);
  console.log(`  firebase: ${fmtVer(firebaseVer, '>=10.6.0')}`);
  console.log(`  firebase-admin: ${fmtVer(firebaseAdminVer, '>=11.6.0')}`);
  console.log(`  firebase auth export: ${fb.importPath ? pc.green(fb.importPath) : pc.yellow('not detected')}`);
  if (!fb.importPath) {
    for (const e of fb.evidence) console.log(pc.dim(`    · ${e}`));
  }
  console.log('');

  // gcloud
  const ver = await gcloudVersion();
  const account = await gcloudActiveAccount();
  const project = await gcloudCurrentProject();

  console.log(pc.bold('gcloud:'));
  console.log(`  installed: ${ver ? pc.green(ver) : pc.red('not installed')}`);
  console.log(`  authenticated: ${account ? pc.green(account) : pc.red('no — run `gcloud auth login`')}`);
  console.log(`  current project: ${project ? pc.cyan(project) : pc.dim('(unset)')}`);
  console.log('');

  // .env.local key check (값은 안 읽음)
  console.log(pc.bold('Env:'));
  const envInfo = inspectEnvLocal(opts.cwd);
  for (const line of envInfo) console.log(`  ${line}`);
  console.log('');

  // 권고
  console.log(pc.bold('Suggestions:'));
  const tips: string[] = [];
  if (!ver) tips.push('Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
  if (!account) tips.push(`Run ${pc.cyan('gcloud auth login')}`);
  if (!fb.importPath) tips.push(`Pass ${pc.cyan('--firebase-export <path>')} to \`add\``);
  if (firebaseVer && !meetsMin(firebaseVer, [10, 6, 0])) tips.push(`Upgrade firebase to >=10.6`);
  if (tips.length === 0) console.log(pc.green('  All checks passed.'));
  else for (const t of tips) console.log(`  · ${t}`);

  return 0;
}

function fmt(v: string, ok: boolean): string {
  return ok ? pc.green(v) : pc.yellow(v);
}

function fmtVer(v: string | null, required: string): string {
  if (!v) return pc.yellow(`not installed (need ${required})`);
  return pc.green(v);
}

function readFirebaseVersions(cwd: string): {
  firebaseVer: string | null;
  firebaseAdminVer: string | null;
} {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return { firebaseVer: null, firebaseAdminVer: null };
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    return {
      firebaseVer: typeof deps.firebase === 'string' ? deps.firebase : null,
      firebaseAdminVer: typeof deps['firebase-admin'] === 'string' ? deps['firebase-admin'] : null,
    };
  } catch {
    return { firebaseVer: null, firebaseAdminVer: null };
  }
}

function meetsMin(spec: string, min: [number, number, number]): boolean {
  const m = spec.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return true; // 알 수 없으면 통과
  const v: [number, number, number] = [Number(m[1]), Number(m[2]), Number(m[3])];
  for (let i = 0; i < 3; i++) {
    if (v[i]! > min[i]!) return true;
    if (v[i]! < min[i]!) return false;
  }
  return true;
}

function inspectEnvLocal(cwd: string): string[] {
  const path = join(cwd, '.env.local');
  if (!existsSync(path)) return [pc.yellow('.env.local not found — copy .env.example')];
  // 보안: 값은 절대 읽지 않음. 키 이름만 enumerate.
  let body: string;
  try {
    body = readFileSync(path, 'utf-8');
  } catch {
    return [pc.yellow('.env.local exists but cannot read')];
  }
  const expectedKeys = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];
  const present = new Set<string>();
  for (const line of body.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=/);
    if (m && m[1]) present.add(m[1]);
  }
  return expectedKeys.map((k) =>
    present.has(k) ? pc.green(`  ${k}: present`) : pc.yellow(`  ${k}: missing`),
  );
}
