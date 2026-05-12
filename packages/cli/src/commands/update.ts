import pc from 'picocolors';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface UpdateOptions {
  projectRoot: string;
  /** When true, the placeholder apply path runs (Phase 2.1). When false (default), dry-run reports only. */
  apply: boolean;
  registryVersion: string;
}

export type DivergedStatus = 'modified' | 'missing' | 'added';

export interface DivergedFile {
  file: string;
  status: DivergedStatus;
  localVer: string;
  registryVer: string;
}

export interface UpdateResult {
  diverged: DivergedFile[];
  exitCode: number;
}

interface RegistryMetadataShape {
  version: string;
  installed: { source: string; dest: string }[];
}

function validateMetadata(parsed: unknown): RegistryMetadataShape | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const m = parsed as Record<string, unknown>;
  if (typeof m['version'] !== 'string') return null;
  if (!Array.isArray(m['installed'])) return null;
  for (const entry of m['installed']) {
    if (!entry || typeof entry !== 'object') return null;
    const e = entry as Record<string, unknown>;
    if (typeof e['source'] !== 'string' || typeof e['dest'] !== 'string') return null;
  }
  return m as unknown as RegistryMetadataShape;
}

export async function runUpdate(opts: UpdateOptions): Promise<UpdateResult> {
  console.log(pc.bold('firebase-totp-mfa update'));
  console.log('');

  const metadataPath = path.join(opts.projectRoot, '.firebase-totp-mfa.json');
  if (!fs.existsSync(metadataPath)) {
    console.log(pc.red('✗ No .firebase-totp-mfa.json found. Run `firebase-totp-mfa add` first.'));
    return { diverged: [], exitCode: 2 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  } catch (e) {
    console.log(pc.red('✗ .firebase-totp-mfa.json is malformed JSON.'));
    console.log(pc.dim(`  ${(e as Error).message}`));
    console.log(pc.dim('  Fix manually or re-run `firebase-totp-mfa add` to regenerate.'));
    return { diverged: [], exitCode: 2 };
  }

  const metadata = validateMetadata(parsed);
  if (!metadata) {
    console.log(pc.red('✗ .firebase-totp-mfa.json has invalid shape (expected { version, installed: [{source, dest}] }).'));
    return { diverged: [], exitCode: 2 };
  }

  const localVer = metadata.version;
  const registryVer = opts.registryVersion;

  console.log(`Local registry version  : ${pc.cyan(localVer)}`);
  console.log(`Latest registry version : ${pc.cyan(registryVer)}`);
  console.log('');

  if (localVer === registryVer) {
    console.log(pc.green('✓ Local source matches registry. No update needed.'));
    return { diverged: [], exitCode: 0 };
  }

  // Phase 2.0 — coarse divergence signal: if metadata.version != registryVer, treat all installed files as 'modified'.
  // Phase 2.1 — per-file content hash comparison (status can also be 'missing' or 'added').
  const diverged: DivergedFile[] = metadata.installed.map((entry) => ({
    file: entry.dest,
    status: 'modified',
    localVer,
    registryVer,
  }));

  console.log(pc.yellow(`⚠ ${diverged.length} file(s) diverged from registry:`));
  for (const d of diverged) {
    console.log(`  · ${pc.cyan(d.file)} [${d.status}] (${d.localVer} → ${d.registryVer})`);
  }
  console.log('');

  if (!opts.apply) {
    console.log(pc.dim('dry-run (default): no files modified.'));
    console.log(pc.dim('Run with --apply (Phase 2.1) to overwrite after per-file diff + confirm.'));
    return { diverged, exitCode: 0 };
  }

  // Phase 2.1 placeholder — per-file diff + confirm + overwrite not yet implemented.
  // Exit code 2 so CI / automation scripts surface the unimplemented state loudly.
  console.log(pc.red('✗ --apply not yet implemented in alpha (Phase 2.1).'));
  console.log(pc.dim('  Re-run without --apply to inspect divergence in the meantime.'));
  return { diverged, exitCode: 2 };
}
