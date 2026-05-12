import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

import * as fs from 'node:fs';
import { writeRegistryMetadata, readRegistryMetadata } from '../../src/utils/registry-version.js';

describe('registry-version metadata', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes .firebase-totp-mfa.json with version + installed list', () => {
    let written = '';
    vi.mocked(fs.writeFileSync).mockImplementation((_p, content) => {
      written = String(content);
    });

    writeRegistryMetadata('/tmp/proj', '0.0.1', [
      { source: 'components/TotpEnroll.source.tsx', dest: 'src/components/TotpEnroll.tsx' },
    ]);

    expect(written).toContain('"version": "0.0.1"');
    expect(written).toContain('"dest": "src/components/TotpEnroll.tsx"');
    expect(written).toContain('"installedAt"');
  });

  it('reads .firebase-totp-mfa.json and returns parsed metadata', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        version: '0.0.2',
        installed: [{ source: 'a.tsx', dest: 'b.tsx' }],
        installedAt: '2026-05-13T00:00:00.000Z',
      }),
    );

    const metadata = readRegistryMetadata('/tmp/proj');
    expect(metadata?.version).toBe('0.0.2');
    expect(metadata?.installed).toHaveLength(1);
  });

  it('returns null if metadata file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const metadata = readRegistryMetadata('/tmp/proj');
    expect(metadata).toBeNull();
  });

  it('returns null if metadata JSON is malformed (defensive read)', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('{ this is not json');

    const metadata = readRegistryMetadata('/tmp/proj');
    expect(metadata).toBeNull();
  });

  it('returns null if metadata shape is invalid (missing installed array)', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ version: '0.0.1', installedAt: '2026-05-13T00:00:00.000Z' }),
    );

    const metadata = readRegistryMetadata('/tmp/proj');
    expect(metadata).toBeNull();
  });

  it('returns null if installed entries are malformed (missing dest)', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        version: '0.0.1',
        installedAt: '2026-05-13T00:00:00.000Z',
        installed: [{ source: 'a.tsx' }],
      }),
    );

    const metadata = readRegistryMetadata('/tmp/proj');
    expect(metadata).toBeNull();
  });

  it('round-trip: write then read returns the same shape', () => {
    let written = '';
    vi.mocked(fs.writeFileSync).mockImplementation((_p, content) => {
      written = String(content);
    });
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation(() => written);

    writeRegistryMetadata('/tmp/proj', '0.1.0', [
      { source: 'components/A.tsx', dest: 'src/A.tsx' },
      { source: 'hooks/useB.ts', dest: 'src/hooks/useB.ts' },
    ]);

    const roundTripped = readRegistryMetadata('/tmp/proj');
    expect(roundTripped).not.toBeNull();
    expect(roundTripped?.version).toBe('0.1.0');
    expect(roundTripped?.installed).toHaveLength(2);
    expect(roundTripped?.installed[0]).toEqual({ source: 'components/A.tsx', dest: 'src/A.tsx' });
    expect(typeof roundTripped?.installedAt).toBe('string');
  });
});
