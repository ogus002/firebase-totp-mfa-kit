import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type PackageManager = 'pnpm' | 'yarn' | 'bun' | 'npm';

export function detectPackageManager(cwd: string): PackageManager {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) return 'bun';
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

export const installCmd: Record<PackageManager, string> = {
  pnpm: 'pnpm add',
  yarn: 'yarn add',
  bun: 'bun add',
  npm: 'npm install',
};

export const runCmd: Record<PackageManager, string> = {
  pnpm: 'pnpm',
  yarn: 'yarn',
  bun: 'bun',
  npm: 'npm run',
};
