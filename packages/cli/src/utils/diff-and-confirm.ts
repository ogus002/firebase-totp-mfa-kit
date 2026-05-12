import { createPatch } from 'diff';
import pc from 'picocolors';
import prompts from 'prompts';

export interface FileChange {
  path: string;             // 사용자 프로젝트 cwd 기준 상대 경로
  kind: 'create' | 'modify' | 'skip';
  oldContent?: string;      // modify 시 기존 내용
  newContent: string;       // create / modify 시 새 내용
  reason?: string;          // skip 시 사유
}

export function printFileChange(change: FileChange): void {
  if (change.kind === 'create') {
    console.log(pc.green(`+ create ${change.path}`));
    return;
  }
  if (change.kind === 'skip') {
    console.log(pc.dim(`= skip   ${change.path}${change.reason ? ` (${change.reason})` : ''}`));
    return;
  }
  console.log(pc.yellow(`~ modify ${change.path}`));
  const patch = createPatch(change.path, change.oldContent ?? '', change.newContent, '', '');
  for (const line of patch.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) console.log(pc.green(line));
    else if (line.startsWith('-') && !line.startsWith('---')) console.log(pc.red(line));
    else if (line.startsWith('@@')) console.log(pc.cyan(line));
    else if (line.startsWith('---') || line.startsWith('+++')) continue;
    else console.log(pc.dim(line));
  }
}

export function summarize(changes: FileChange[]): {
  creates: number;
  modifies: number;
  skips: number;
} {
  return {
    creates: changes.filter((c) => c.kind === 'create').length,
    modifies: changes.filter((c) => c.kind === 'modify').length,
    skips: changes.filter((c) => c.kind === 'skip').length,
  };
}

export async function confirm(message: string, defaultValue = true): Promise<boolean> {
  const res = await prompts({
    type: 'confirm',
    name: 'ok',
    message,
    initial: defaultValue,
  });
  return res.ok === true;
}
