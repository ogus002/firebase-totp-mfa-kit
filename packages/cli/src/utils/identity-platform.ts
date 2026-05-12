import { gcloudAccessToken } from './exec-gcloud.js';

export interface MfaProviderConfig {
  state?: 'ENABLED' | 'DISABLED';
  totpProviderConfig?: { adjacentIntervals?: number };
  // phoneSmsConfig 등 다른 provider 보존을 위해 unknown
  [key: string]: unknown;
}

export interface MfaConfig {
  state?: 'ENABLED' | 'DISABLED';
  providerConfigs?: MfaProviderConfig[];
  enabledProviders?: string[];
}

export interface ProjectConfig {
  name?: string;
  mfa?: MfaConfig;
  [key: string]: unknown;
}

const BASE = 'https://identitytoolkit.googleapis.com/admin/v2/projects';

export async function getProjectConfig(project: string): Promise<ProjectConfig> {
  const token = await gcloudAccessToken();
  if (!token) throw new Error('No gcloud access token. Run `gcloud auth login`.');
  const res = await fetch(`${BASE}/${project}/config`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Goog-User-Project': project,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GET config failed (${res.status}): ${body || res.statusText}`);
  }
  return (await res.json()) as ProjectConfig;
}

export async function patchMfaConfig(
  project: string,
  newMfa: MfaConfig,
): Promise<ProjectConfig> {
  const token = await gcloudAccessToken();
  if (!token) throw new Error('No gcloud access token. Run `gcloud auth login`.');
  const res = await fetch(`${BASE}/${project}/config?updateMask=mfa`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Goog-User-Project': project,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mfa: newMfa }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`PATCH config failed (${res.status}): ${body || res.statusText}`);
  }
  return (await res.json()) as ProjectConfig;
}

// 기존 provider 보존하면서 TOTP provider 만 병합/덮어쓰기
export function mergeTotpIntoMfa(
  current: MfaConfig | undefined,
  adjacentIntervals: number,
): MfaConfig {
  const existing = current?.providerConfigs ?? [];
  const withoutTotp = existing.filter((p) => !p.totpProviderConfig);
  const totp: MfaProviderConfig = {
    state: 'ENABLED',
    totpProviderConfig: { adjacentIntervals },
  };
  return {
    state: 'ENABLED',
    providerConfigs: [...withoutTotp, totp],
  };
}

export function hasTotpEnabled(cfg: MfaConfig | undefined): boolean {
  if (cfg?.state !== 'ENABLED') return false;
  return (cfg.providerConfigs ?? []).some(
    (p) => p.state === 'ENABLED' && !!p.totpProviderConfig,
  );
}
