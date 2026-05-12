import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Framework =
  | 'next-app-router'
  | 'next-pages-router'
  | 'vite-react'
  | 'cra'
  | 'expo'
  | 'unknown';

export interface FrameworkDetection {
  framework: Framework;
  evidence: string[];
  packageJsonPath: string | null;
}

const readPackageJson = (cwd: string): Record<string, unknown> | null => {
  const p = join(cwd, 'package.json');
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
};

const allDeps = (pkg: Record<string, unknown> | null): Record<string, string> => {
  if (!pkg) return {};
  const deps = (pkg.dependencies ?? {}) as Record<string, string>;
  const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>;
  return { ...deps, ...devDeps };
};

export function detectFramework(cwd: string): FrameworkDetection {
  const pkg = readPackageJson(cwd);
  const deps = allDeps(pkg);
  const evidence: string[] = [];
  const packageJsonPath = pkg ? join(cwd, 'package.json') : null;

  if (deps['expo'] || existsSync(join(cwd, 'app.json'))) {
    evidence.push('expo dependency or app.json');
    return { framework: 'expo', evidence, packageJsonPath };
  }

  if (deps['next']) {
    evidence.push('next dependency');
    if (existsSync(join(cwd, 'app')) || existsSync(join(cwd, 'src/app'))) {
      evidence.push('app/ directory');
      return { framework: 'next-app-router', evidence, packageJsonPath };
    }
    if (existsSync(join(cwd, 'pages')) || existsSync(join(cwd, 'src/pages'))) {
      evidence.push('pages/ directory');
      return { framework: 'next-pages-router', evidence, packageJsonPath };
    }
    evidence.push('next without app/ or pages/ — defaulting to app-router');
    return { framework: 'next-app-router', evidence, packageJsonPath };
  }

  if (deps['vite'] && (deps['react'] || deps['react-dom'])) {
    evidence.push('vite + react dependency');
    return { framework: 'vite-react', evidence, packageJsonPath };
  }

  if (deps['react-scripts']) {
    evidence.push('react-scripts (CRA)');
    return { framework: 'cra', evidence, packageJsonPath };
  }

  return { framework: 'unknown', evidence: ['no recognized framework deps'], packageJsonPath };
}
