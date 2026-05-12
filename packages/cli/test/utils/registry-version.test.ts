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
  });

  it('reads .firebase-totp-mfa.json and returns parsed metadata', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ version: '0.0.2', installed: [{ source: 'a.tsx', dest: 'b.tsx' }] }),
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
});
