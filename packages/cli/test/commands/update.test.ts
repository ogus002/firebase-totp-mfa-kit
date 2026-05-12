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
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith('.firebase-totp-mfa.json'),
    );
    vi.mocked(fs.readFileSync).mockImplementation((p) => {
      if (String(p).endsWith('.firebase-totp-mfa.json')) {
        return JSON.stringify({
          version: '0.0.1',
          installed: [
            { source: 'components/TotpEnroll.source.tsx', dest: 'src/components/TotpEnroll.tsx' },
          ],
        });
      }
      return '';
    });

    const result = await runUpdate({
      projectRoot: '/tmp/test-project',
      apply: false,
      registryVersion: '0.0.2',
    });

    expect(result.diverged).toHaveLength(1);
    expect(result.diverged[0].file).toContain('TotpEnroll.tsx');
    expect(result.diverged[0].status).toBe('modified');
    expect(result.diverged[0].localVer).toBe('0.0.1');
    expect(result.diverged[0].registryVer).toBe('0.0.2');
    expect(result.exitCode).toBe(0);
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
      apply: false,
      registryVersion: '0.0.2',
    });

    expect(result.diverged).toHaveLength(0);
    expect(result.exitCode).toBe(0);
  });

  it('returns exitCode 2 when metadata file missing', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = await runUpdate({
      projectRoot: '/tmp/test-project',
      apply: false,
      registryVersion: '0.0.2',
    });

    expect(result.diverged).toHaveLength(0);
    expect(result.exitCode).toBe(2);
  });

  it('returns exitCode 2 with friendly error when metadata JSON is malformed', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('{ this is not json');

    const result = await runUpdate({
      projectRoot: '/tmp/test-project',
      apply: false,
      registryVersion: '0.0.2',
    });

    expect(result.exitCode).toBe(2);
    expect(result.diverged).toHaveLength(0);
  });

  it('returns exitCode 2 with friendly error when metadata shape is invalid', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ version: '0.0.1' }), // missing `installed`
    );

    const result = await runUpdate({
      projectRoot: '/tmp/test-project',
      apply: false,
      registryVersion: '0.0.2',
    });

    expect(result.exitCode).toBe(2);
  });

  it('returns exitCode 2 with explicit message when --apply is used (Phase 2.1 not yet implemented)', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        version: '0.0.1',
        installed: [
          { source: 'components/TotpEnroll.source.tsx', dest: 'src/components/TotpEnroll.tsx' },
        ],
      }),
    );

    const result = await runUpdate({
      projectRoot: '/tmp/test-project',
      apply: true,
      registryVersion: '0.0.2',
    });

    expect(result.diverged).toHaveLength(1);
    expect(result.exitCode).toBe(2); // CI safety: unimplemented apply path must fail loudly
  });
});
