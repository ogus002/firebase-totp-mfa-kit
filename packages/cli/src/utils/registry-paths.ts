// Registry 위치 resolver — dist 또는 src (개발 모드) 모두 지원
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 실행 위치: dist/index.js (production npm) 또는 src/index.ts (개발 ts-node)
// 해당 디렉토리 옆 registry/ 또는 한 단계 위의 registry/
export function findRegistryRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, 'registry'),                  // dist/registry (built)
    join(here, '..', 'registry'),            // dev: dist/.. → src/registry
    join(here, '..', 'src', 'registry'),     // CLI 가 packages/cli/dist/ 에서 실행될 때 source 참조 (dev)
    join(here, '..', '..', 'src', 'registry'),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, 'components'))) return c;
  }
  throw new Error(
    `Registry not found near ${here}. Looked in: ${candidates.join(', ')}`,
  );
}

export const REGISTRY_PARTS = {
  components: 'components',
  hooks: 'hooks',
  lib: 'lib',
  server: 'server',
} as const;
