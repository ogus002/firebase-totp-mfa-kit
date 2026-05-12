// Vite + React Router codemod
// 입력: cwd, area, firebase import path
// 출력: <ProtectedRoute> 컴포넌트 생성 (사용자가 자기 router 에 끼움)

import type { FileChange } from '../utils/diff-and-confirm.js';

export interface ViteReactCodemodInput {
  cwd: string;
  area: string;
  firebaseImportPath: string;
  componentsImportPath: string;
}

export function planViteReact(input: ViteReactCodemodInput): FileChange[] {
  const area = input.area.replace(/^\/|\/$/g, '');
  const path = 'src/components/totp-mfa/ProtectedRoute.tsx';

  const body = `import { useLocation, useNavigate } from 'react-router-dom';
import { MfaGuard } from '${input.componentsImportPath}/MfaGuard';
import { auth } from '${input.firebaseImportPath}';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <MfaGuard
      auth={auth}
      enrollPath="/${area}/mfa-enroll"
      loginPath="/${area}/login"
      currentPath={location.pathname}
      onNavigate={(p) => navigate(p, { replace: true })}
      fallback={<div>Loading…</div>}
    >
      {children}
    </MfaGuard>
  );
}
`;
  return [
    { path, kind: 'create', newContent: body },
    {
      path: 'src/main.tsx',
      kind: 'skip',
      newContent: '',
      reason: 'Manual step: wrap protected routes with <ProtectedRoute> in your Router (see docs/manual-setup.md)',
    },
  ];
}
