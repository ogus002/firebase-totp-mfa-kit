import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Schema of `.firebase-totp-mfa.json`. Extra fields are permitted for forward compatibility —
 * older CLI versions reading newer metadata files MUST NOT reject them. Add new optional fields,
 * never remove existing ones.
 */
export interface RegistryMetadata {
  version: string;
  installed: { source: string; dest: string }[];
  installedAt: string;
}

const METADATA_FILENAME = '.firebase-totp-mfa.json';

function isValidMetadata(value: unknown): value is RegistryMetadata {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v['version'] !== 'string') return false;
  if (typeof v['installedAt'] !== 'string') return false;
  if (!Array.isArray(v['installed'])) return false;
  for (const entry of v['installed']) {
    if (!entry || typeof entry !== 'object') return false;
    const e = entry as Record<string, unknown>;
    if (typeof e['source'] !== 'string' || typeof e['dest'] !== 'string') return false;
  }
  return true;
}

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

/**
 * Returns parsed metadata, or null if:
 *   - the file does not exist
 *   - JSON parsing fails (corrupted or hand-edited file)
 *   - the parsed object does not match the required schema
 *
 * Defensive by design — `update` reads from this file, and users may manually edit it. A null
 * return forces the caller to surface a friendly error rather than crashing on raw exceptions.
 */
export function readRegistryMetadata(projectRoot: string): RegistryMetadata | null {
  const p = path.join(projectRoot, METADATA_FILENAME);
  if (!fs.existsSync(p)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
  return isValidMetadata(parsed) ? parsed : null;
}
