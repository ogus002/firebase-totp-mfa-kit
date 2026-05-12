import pc from 'picocolors';
import { gcloudActiveAccount, gcloudCurrentProject } from '../utils/exec-gcloud.js';
import {
  getProjectConfig,
  patchMfaConfig,
  mergeTotpIntoMfa,
  hasTotpEnabled,
  type MfaConfig,
  type ProjectConfig,
} from '../utils/identity-platform.js';
import { confirm } from '../utils/diff-and-confirm.js';

export interface EnableOptions {
  project: string;
  adjacentIntervals: number;
  dryRun: boolean;
  yes: boolean;
}

export async function runEnable(opts: EnableOptions): Promise<number> {
  console.log(pc.bold('firebase-totp-mfa enable'));
  console.log('');

  // Step 1 — auth + project check
  const account = await gcloudActiveAccount();
  const currentProject = await gcloudCurrentProject();

  if (!account) {
    console.log(pc.red('✗ gcloud not authenticated.'));
    console.log(`  Run ${pc.cyan('gcloud auth login')} and try again.`);
    return 2;
  }
  console.log(`gcloud account: ${pc.cyan(account)}`);
  console.log(`gcloud project: ${pc.cyan(currentProject ?? '(unset)')}`);
  console.log(`target project: ${pc.cyan(opts.project)}`);

  if (currentProject && currentProject !== opts.project) {
    console.log(
      pc.yellow(
        `⚠ gcloud current project is "${currentProject}" but enable target is "${opts.project}".`,
      ),
    );
    if (!opts.yes && !opts.dryRun) {
      const ok = await confirm('Continue with target project?', false);
      if (!ok) return 1;
    }
  }

  // Step 2 — GET current config
  console.log('');
  console.log(pc.dim('→ Fetching current Identity Platform config…'));
  let currentCfg: ProjectConfig = {};
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
  const currentMfa = currentCfg.mfa;
  console.log(pc.green('✓ current config fetched'));

  // Step 3 — Diff
  const newMfa = mergeTotpIntoMfa(currentMfa, opts.adjacentIntervals);
  console.log('');
  console.log(pc.bold('Diff:'));
  printMfaDiff(currentMfa, newMfa);

  if (hasTotpEnabled(currentMfa)) {
    console.log(pc.dim('TOTP already enabled. PATCH will refresh adjacentIntervals.'));
  }

  if (opts.dryRun) {
    console.log(pc.dim('\n--dry-run: no PATCH performed.'));
    return 0;
  }

  // Step 4 — Confirm
  if (!opts.yes) {
    const ok = await confirm('Apply this change?', true);
    if (!ok) {
      console.log(pc.dim('Aborted.'));
      return 0;
    }
  }

  // Step 5 — PATCH
  console.log('');
  console.log(pc.dim('→ PATCHing config…'));
  try {
    await patchMfaConfig(opts.project, newMfa);
  } catch (e) {
    console.log(pc.red(`✗ PATCH failed: ${(e as Error).message}`));
    return 2;
  }
  console.log(pc.green('✓ PATCH applied'));

  // Step 6 — Read-back verify
  console.log(pc.dim('→ Read-back verify…'));
  try {
    const after = await getProjectConfig(opts.project);
    if (!hasTotpEnabled(after.mfa)) {
      console.log(pc.red('✗ Read-back: TOTP not enabled. Inspect config manually.'));
      return 2;
    }
    console.log(pc.green('✓ TOTP MFA enabled and verified.'));
  } catch (e) {
    console.log(pc.yellow(`⚠ Read-back failed: ${(e as Error).message}`));
    console.log(pc.yellow('  PATCH succeeded but verification could not be performed.'));
    return 0;
  }

  console.log('');
  console.log(pc.bold('Next steps:'));
  console.log(`  · Fill ${pc.cyan('.env.local')} with Firebase config`);
  console.log(`  · Test enrollment in your app`);

  return 0;
}

function printMfaDiff(current: MfaConfig | undefined, next: MfaConfig): void {
  const before = JSON.stringify(current ?? {}, null, 2);
  const after = JSON.stringify(next, null, 2);
  console.log(pc.dim('--- before'));
  for (const line of before.split('\n')) console.log(pc.dim(line));
  console.log(pc.dim('+++ after'));
  for (const line of after.split('\n')) console.log(pc.green(line));
}
