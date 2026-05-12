import { describe, it, expect, vi, afterEach } from 'vitest';
import { runUpdate } from '../../src/commands/update.js';

// node:fs properties are non-configurable on Node 20+ ESM, so vi.spyOn fails.
// Use vi.mock factory to substitute the module before runUpdate imports it.
vi.mock('node:fs', () => {
  return {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

import * as fs from 'node:fs';

describe('update — registry version diff', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detects local source file diverged from registry (different version)', async () => {
    // Mock setup: local file version 0.0.1, registry version 0.0.2
    const mockProjectDir = '/tmp/test-project';
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      return String(p).endsWith('.firebase-totp-mfa.json') || String(p).endsWith('TotpEnroll.tsx');
    });
    vi.mocked(fs.readFileSync).mockImplementation((p) => {
      if (String(p).endsWith('.firebase-totp-mfa.json')) {
        return JSON.stringify({
          version: '0.0.1',
          installed: [{ source: 'components/TotpEnroll.source.tsx', dest: 'src/components/TotpEnroll.tsx' }],
        });
      }
      return 'old content';
    });

    // Mock registry side: latest version 0.0.2
    const result = await runUpdate({
      projectRoot: mockProjectDir,
      dryRun: true,
      registryVersion: '0.0.2',
    });

    expect(result.diverged).toHaveLength(1);
    expect(result.diverged[0].file).toContain('TotpEnroll.tsx');
    expect(result.exitCode).toBe(0);  // dry-run reports but doesn't fail
  });

  it('reports clean state when local matches registry', async () => {
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith('.firebase-totp-mfa.json'),
    );
    vi.mocked(fs.readFileSync).mockImplementation(() =>
      JSON.stringify({ version: '0.0.2', installed: [] }),
    );

    const result = await runUpdate({
      projectRoot: '/tmp/test-project',
      dryRun: true,
      registryVersion: '0.0.2',
    });

    expect(result.diverged).toHaveLength(0);
    expect(result.exitCode).toBe(0);
  });
});
