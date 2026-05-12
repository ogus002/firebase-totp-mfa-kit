// CRA (Create React App) codemod — Vite 와 동일 패턴

import type { FileChange } from '../utils/diff-and-confirm.js';
import { planViteReact, type ViteReactCodemodInput } from './vite-react.js';

export function planCra(input: ViteReactCodemodInput): FileChange[] {
  // CRA 도 src/components/... + React Router 구조. Vite codemod 재사용.
  return planViteReact(input);
}
