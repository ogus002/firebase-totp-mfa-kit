import { execa, ExecaError } from 'execa';

export interface GcloudResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  code: number | null;
}

export async function gcloud(args: string[]): Promise<GcloudResult> {
  try {
    const res = await execa('gcloud', args, { reject: false });
    return {
      ok: res.exitCode === 0,
      stdout: res.stdout?.trim() ?? '',
      stderr: res.stderr?.trim() ?? '',
      code: res.exitCode ?? null,
    };
  } catch (e) {
    const err = e as ExecaError;
    return {
      ok: false,
      stdout: '',
      stderr: err.message ?? 'gcloud not found',
      code: null,
    };
  }
}

export async function gcloudActiveAccount(): Promise<string | null> {
  const r = await gcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']);
  if (!r.ok || !r.stdout) return null;
  return r.stdout.split('\n')[0]?.trim() ?? null;
}

export async function gcloudCurrentProject(): Promise<string | null> {
  const r = await gcloud(['config', 'get-value', 'project']);
  if (!r.ok || !r.stdout) return null;
  const v = r.stdout.trim();
  if (!v || v === '(unset)') return null;
  return v;
}

export async function gcloudAccessToken(): Promise<string | null> {
  const r = await gcloud(['auth', 'print-access-token']);
  if (!r.ok || !r.stdout) return null;
  return r.stdout.trim();
}

export async function gcloudVersion(): Promise<string | null> {
  const r = await gcloud(['--version']);
  if (!r.ok) return null;
  const firstLine = r.stdout.split('\n')[0]?.trim() ?? '';
  const m = firstLine.match(/(\d+\.\d+\.\d+)/);
  return m && m[1] ? `Google Cloud SDK ${m[1]}` : firstLine || null;
}
