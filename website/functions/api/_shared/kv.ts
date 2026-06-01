// 최소 KV 인터페이스 (CF KVNamespace 의 부분집합)
export interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

// 테스트용 in-memory mock
export function createMockKv(): KvLike {
  const m = new Map<string, string>();
  return {
    async get(k) {
      return m.has(k) ? (m.get(k) as string) : null;
    },
    async put(k, v) {
      m.set(k, v);
    },
  };
}

function randomId(): string {
  const b = new Uint8Array(12);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(36).padStart(2, '0')).join('').slice(0, 18);
}

const SESSION_TTL = 1800; // 30분

export async function createSession(kv: KvLike): Promise<string> {
  const id = randomId();
  await kv.put(`sess:${id}`, '1', { expirationTtl: SESSION_TTL });
  return id;
}

export async function isValidSession(kv: KvLike, id: string): Promise<boolean> {
  if (!id) return false;
  return (await kv.get(`sess:${id}`)) !== null;
}

export async function checkAndIncrementRate(
  kv: KvLike,
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ ok: boolean; count: number }> {
  const k = `rate:${key}`;
  const cur = Number((await kv.get(k)) ?? '0');
  if (cur >= limit) return { ok: false, count: cur };
  await kv.put(k, String(cur + 1), { expirationTtl: windowSec });
  return { ok: true, count: cur + 1 };
}

function todayKey(): string {
  // UTC 날짜 기준 일일 budget
  return `budget:${new Date().toISOString().slice(0, 10)}`;
}

export async function addDailyTokens(kv: KvLike, tokens: number): Promise<void> {
  const k = todayKey();
  const cur = Number((await kv.get(k)) ?? '0');
  await kv.put(k, String(cur + tokens), { expirationTtl: 172800 });
}

export async function isDailyBudgetExceeded(kv: KvLike, capTokens: number): Promise<boolean> {
  const cur = Number((await kv.get(todayKey())) ?? '0');
  return cur >= capTokens;
}
