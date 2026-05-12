import { defineConfig } from 'tsup';
import { cp } from 'node:fs/promises';
import { join } from 'node:path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  dts: false, // CLI binary — type declarations 불필요
  sourcemap: true,
  clean: true,
  shims: false,
  minify: false,
  splitting: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
  // .source.ts/tsx 는 사용자 프로젝트로 복사될 raw 파일이므로 build 에서 제외
  external: [/\.source\.(ts|tsx)$/],
  async onSuccess() {
    // registry/ 디렉토리를 dist/registry 로 그대로 복사 (raw source 보존)
    await cp(join('src', 'registry'), join('dist', 'registry'), {
      recursive: true,
      force: true,
    });
  },
});
