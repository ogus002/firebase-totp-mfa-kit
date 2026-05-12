// Recovery codes — 10개 일회용 코드 생성 / hash / 검증 / 소비
//
// 보안 원칙:
// - 평문 코드는 생성 시점에만 노출. 그 후 Firestore 등 storage 에는 hash 만 저장.
// - 각 코드는 1회 사용. 사용 후 Firestore 에서 spent 표시 또는 삭제.
// - 사용자가 새 set 생성 시 기존 모두 invalidate.
//
// Firestore schema (사용자가 customize 가능):
//   users/{uid}/mfa-recovery/{set-id}:
//     createdAt: Timestamp
//     codes: [ { hash: string, spent: boolean, spentAt?: Timestamp } ]  // 10개
//
// hash 알고리즘: SHA-256 base64. bcrypt 안 쓰는 이유 = 코드 자체 entropy 가 충분 (64 bit+).
//
// 사용 예 (사용자 프로젝트):
//   const codes = generateRecoveryCodes(10);          // 평문 array — 사용자 표시용
//   const hashes = await Promise.all(codes.map(hashRecoveryCode));
//   await saveCodes(uid, hashes);
//   // 표시 후 코드 즉시 메모리 폐기

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // I, O, 0, 1 제외 (오인 방지)
const SEGMENT_LEN = 4;
const SEGMENTS = 3; // 'xxxx-xxxx-xxxx' = ~60 bit entropy

function randomChar(): string {
  // Web Crypto 또는 Node crypto.getRandomValues
  const a = new Uint8Array(1);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(a);
  } else {
    // 환경에 따라 globalThis.crypto 가 없을 수 있음 — 사용자가 polyfill
    throw new Error('crypto.getRandomValues unavailable');
  }
  return ALPHABET[a[0]! % ALPHABET.length]!;
}

export function generateRecoveryCode(): string {
  const parts: string[] = [];
  for (let s = 0; s < SEGMENTS; s++) {
    let seg = '';
    for (let i = 0; i < SEGMENT_LEN; i++) seg += randomChar();
    parts.push(seg);
  }
  return parts.join('-');
}

export function generateRecoveryCodes(n: number): string[] {
  return Array.from({ length: n }, () => generateRecoveryCode());
}

export function normalizeCode(input: string): string {
  return input.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

export async function hashRecoveryCode(code: string): Promise<string> {
  const normalized = normalizeCode(code);
  const buf = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return arrayBufferToBase64(digest);
}

export async function verifyRecoveryCode(
  input: string,
  storedHashes: Array<{ hash: string; spent: boolean }>,
): Promise<{ matchedIndex: number; reason?: 'invalid' | 'used' }> {
  const inputHash = await hashRecoveryCode(input);
  const index = storedHashes.findIndex((s) => constantTimeEqual(s.hash, inputHash));
  if (index === -1) return { matchedIndex: -1, reason: 'invalid' };
  if (storedHashes[index]!.spent) return { matchedIndex: -1, reason: 'used' };
  return { matchedIndex: index };
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
