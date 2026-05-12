// Next.js App Router codemod
// 입력: cwd, area (예 '/admin'), firebase import path
// 출력: FileChange[] — `app/<area>/layout.tsx` 생성 또는 기존 layout 에 MfaGuard wrap

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FileChange } from '../utils/diff-and-confirm.js';

export interface NextAppRouterCodemodInput {
  cwd: string;
  area: string;          // 예 '/admin' (앞에 / 있음)
  firebaseImportPath: string;  // 예 '@/lib/firebase'
  componentsImportPath: string; // 예 '@/components/totp-mfa'
}

function normalizeArea(area: string): string {
  return area.replace(/^\/|\/$/g, ''); // '/admin/' → 'admin'
}

// App Router 의 app/ 위치 찾기 (root 또는 src/)
function findAppDir(cwd: string): string | null {
  if (existsSync(join(cwd, 'app'))) return 'app';
  if (existsSync(join(cwd, 'src/app'))) return 'src/app';
  return null;
}

export function planNextAppRouter(input: NextAppRouterCodemodInput): FileChange[] {
  const area = normalizeArea(input.area);
  const appDir = findAppDir(input.cwd);
  if (!appDir) {
    return [
      {
        path: 'app/',
        kind: 'skip',
        newContent: '',
        reason: 'app/ directory not found — App Router not detected',
      },
    ];
  }

  const layoutPath = `${appDir}/${area}/layout.tsx`;
  const fullPath = join(input.cwd, layoutPath);
  const existing = existsSync(fullPath) ? readFileSync(fullPath, 'utf-8') : null;

  const guardSnippet = generateLayoutWithMfaGuard({
    firebaseImportPath: input.firebaseImportPath,
    componentsImportPath: input.componentsImportPath,
    area: `/${area}`,
    childrenLayout: existing ? extractInnerLayout(existing) : null,
  });

  if (existing) {
    if (existing.includes('MfaGuard')) {
      return [
        { path: layoutPath, kind: 'skip', newContent: existing, reason: 'MfaGuard already present' },
      ];
    }
    return [{ path: layoutPath, kind: 'modify', oldContent: existing, newContent: guardSnippet }];
  }
  return [{ path: layoutPath, kind: 'create', newContent: guardSnippet }];
}

function generateLayoutWithMfaGuard(opts: {
  firebaseImportPath: string;
  componentsImportPath: string;
  area: string;
  childrenLayout: string | null;
}): string {
  return `'use client';

import { usePathname, useRouter } from 'next/navigation';
import { MfaGuard } from '${opts.componentsImportPath}/MfaGuard';
import { auth } from '${opts.firebaseImportPath}';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? '${opts.area}';
  return (
    <MfaGuard
      auth={auth}
      enrollPath="${opts.area}/mfa-enroll"
      loginPath="${opts.area}/login"
      currentPath={pathname}
      onNavigate={(p) => router.replace(p)}
      fallback={<div>Loading…</div>}
    >
      ${opts.childrenLayout ?? '{children}'}
    </MfaGuard>
  );
}
`;
}

// 기존 layout 에서 wrap 안쪽 부분만 추출 (best-effort). 실패 시 children 만 사용.
function extractInnerLayout(_existing: string): string | null {
  // Phase 1 conservative: 항상 children 만. 사용자가 manually merge 필요시 docs/manual-setup.md
  return null;
}
