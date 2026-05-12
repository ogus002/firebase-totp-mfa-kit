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
