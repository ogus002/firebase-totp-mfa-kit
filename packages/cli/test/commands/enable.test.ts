import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runEnable } from '../../src/commands/enable.js';
import * as identityPlatform from '../../src/utils/identity-platform.js';
import * as execGcloud from '../../src/utils/exec-gcloud.js';

describe('enable — first-init (404 CONFIGURATION_NOT_FOUND)', () => {
  beforeEach(() => {
    vi.spyOn(execGcloud, 'gcloudActiveAccount').mockResolvedValue('test@example.com');
    vi.spyOn(execGcloud, 'gcloudCurrentProject').mockResolvedValue('test-project');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('treats 404 CONFIGURATION_NOT_FOUND as empty config (first-PATCH lazy state) and proceeds in dry-run', async () => {
    const get404 = new Error('GET config failed (404): {"error":{"code":404,"message":"CONFIGURATION_NOT_FOUND","status":"NOT_FOUND"}}');
    vi.spyOn(identityPlatform, 'getProjectConfig').mockRejectedValue(get404);

    const exitCode = await runEnable({
      project: 'test-project',
      adjacentIntervals: 1,
      dryRun: true,
      yes: false,
    });

    expect(exitCode).toBe(0);  // dry-run with empty mfa context, NOT return 2
  });

  it('still returns 2 for non-CONFIGURATION_NOT_FOUND errors (auth, permission, etc)', async () => {
    const get403 = new Error('GET config failed (403): permission denied');
    vi.spyOn(identityPlatform, 'getProjectConfig').mockRejectedValue(get403);

    const exitCode = await runEnable({
      project: 'test-project',
      adjacentIntervals: 1,
      dryRun: true,
      yes: false,
    });

    expect(exitCode).toBe(2);
  });
});
