// Next.js Pages Router codemod
// 입력: cwd, area, firebase import path
// 출력: ProtectedRoute HOC 파일 생성 + 사용 안내 (auto-wrap _app.tsx 은 너무 위험)

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FileChange } from '../utils/diff-and-confirm.js';

export interface NextPagesRouterCodemodInput {
  cwd: string;
  area: string;
  firebaseImportPath: string;
  componentsImportPath: string;
}

function findPagesDir(cwd: string): string | null {
  if (existsSync(join(cwd, 'pages'))) return 'pages';
  if (existsSync(join(cwd, 'src/pages'))) return 'src/pages';
  return null;
}

export function planNextPagesRouter(input: NextPagesRouterCodemodInput): FileChange[] {
  const pagesDir = findPagesDir(input.cwd);
  if (!pagesDir) {
    return [
      {
        path: 'pages/',
        kind: 'skip',
        newContent: '',
        reason: 'pages/ directory not found — Pages Router not detected',
      },
    ];
  }
  const area = input.area.replace(/^\/|\/$/g, '');
  const hocPath = `${pagesDir.replace(/pages$/, '')}components/totp-mfa/ProtectedRoute.tsx`.replace(/^\//, '');

  const body = `'use client';
import { useRouter } from 'next/router';
import { MfaGuard } from '${input.componentsImportPath}/MfaGuard';
import { auth } from '${input.firebaseImportPath}';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <MfaGuard
      auth={auth}
      enrollPath="/${area}/mfa-enroll"
      loginPath="/${area}/login"
      currentPath={router.pathname}
      onNavigate={(p) => router.replace(p)}
      fallback={<div>Loading…</div>}
    >
      {children}
    </MfaGuard>
  );
}
`;
  return [
    { path: hocPath, kind: 'create', newContent: body },
    // _app.tsx 자동 수정은 사용자 코드 risk 가 커서 안내만
    {
      path: `${pagesDir}/_app.tsx`,
      kind: 'skip',
      newContent: '',
      reason: 'Manual step: wrap protected pages with <ProtectedRoute> (see docs/manual-setup.md)',
    },
  ];
}
