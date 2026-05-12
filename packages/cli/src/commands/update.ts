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
