import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockKv,
  createSession,
  isValidSession,
  checkAndIncrementRate,
  addDailyTokens,
  isDailyBudgetExceeded,
} from './kv';

let kv: ReturnType<typeof createMockKv>;
beforeEach(() => {
  kv = createMockKv();
});

describe('session', () => {
  it('creates and validates a session id', async () => {
    const id = await createSession(kv);
    expect(id).toMatch(/^[a-z0-9]{16,}$/);
    expect(await isValidSession(kv, id)).toBe(true);
  });
  it('rejects unknown session', async () => {
    expect(await isValidSession(kv, 'nope')).toBe(false);
  });
});

describe('rate limit', () => {
  it('allows up to the limit then blocks', async () => {
    for (let i = 0; i < 3; i++) {
      expect((await checkAndIncrementRate(kv, 'ip:1', 3, 3600)).ok).toBe(true);
    }
    expect((await checkAndIncrementRate(kv, 'ip:1', 3, 3600)).ok).toBe(false);
  });
});

describe('budget', () => {
  it('flags exceeded after cap', async () => {
    expect(await isDailyBudgetExceeded(kv, 1000)).toBe(false);
    await addDailyTokens(kv, 600);
    await addDailyTokens(kv, 600);
    expect(await isDailyBudgetExceeded(kv, 1000)).toBe(true);
  });
});
