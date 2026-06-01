import { describe, it, expect } from 'vitest';
import { FAQ } from './faq';

describe('faq', () => {
  it('has at least 4 items with unique ids', () => {
    expect(FAQ.length).toBeGreaterThanOrEqual(4);
    expect(new Set(FAQ.map((f) => f.id)).size).toBe(FAQ.length);
  });

  it('every item has non-empty q and a', () => {
    FAQ.forEach((f) => {
      expect(f.q.trim().length).toBeGreaterThan(0);
      expect(f.a.trim().length).toBeGreaterThan(0);
    });
  });

  it('answers reference the CLI, never raw auth code', () => {
    FAQ.forEach((f) => {
      expect(f.a).not.toMatch(/import .*firebase\/auth/);
    });
  });
});
