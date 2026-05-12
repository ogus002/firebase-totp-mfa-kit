import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import fg from 'fast-glob';

export interface FirebaseExportDetection {
  importPath: string | null;       // 사용자 코드에 들어갈 import path (예: '@/lib/firebase')
  filePath: string | null;          // 실제 파일 경로 (cwd 기준 상대)
  exportName: string | null;        // 'auth' 등
  evidence: string[];
}

const CANDIDATE_PATTERNS = [
  'src/lib/firebase.{ts,tsx,js,jsx}',
  'src/firebase/{config,index,client}.{ts,tsx,js,jsx}',
  'src/config/firebase.{ts,tsx,js,jsx}',
  'lib/firebase.{ts,tsx,js,jsx}',
  'firebase/{config,index,client}.{ts,tsx,js,jsx}',
  'app/firebase.{ts,tsx,js,jsx}',
  'app/lib/firebase.{ts,tsx,js,jsx}',
];

// `export const auth = ...` 또는 `export { auth }` 또는 `export default { auth }` 등 찾음
const EXPORT_RE = /export\s+(?:const|let|var)\s+(auth|firebaseAuth)\b|export\s*\{\s*([^}]*\bauth\b[^}]*)\s*\}/;

export async function detectFirebaseExport(cwd: string): Promise<FirebaseExportDetection> {
  const evidence: string[] = [];
  const matches = await fg(CANDIDATE_PATTERNS, {
    cwd,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    onlyFiles: true,
  });

  for (const rel of matches) {
    const full = join(cwd, rel);
    if (!existsSync(full)) continue;
    let body: string;
    try {
      body = readFileSync(full, 'utf-8');
    } catch {
      continue;
    }
    const m = body.match(EXPORT_RE);
    if (!m) {
      evidence.push(`found ${rel} but no \`export const auth\``);
      continue;
    }
    const exportName = m[1] ?? 'auth';
    const noExt = rel.replace(/\.(tsx?|jsx?)$/, '');
    // alias 가정 우선 (src/* → @/* 또는 ~/*)
    const importPath = noExt.startsWith('src/')
      ? `@/${noExt.slice(4)}`
      : `./${noExt}`;
    evidence.push(`detected \`${exportName}\` in ${rel}`);
    return {
      importPath,
      filePath: rel,
      exportName,
      evidence,
    };
  }

  evidence.push(`no firebase auth export found in: ${CANDIDATE_PATTERNS.join(', ')}`);
  return { importPath: null, filePath: null, exportName: null, evidence };
}
