// useRecoveryCodes — Firestore 의존성 분리. 사용자가 adapter 제공.
//
// 사용 예 (사용자 프로젝트):
//   import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
//   import { db } from '@/lib/firebase';
//
//   const adapter: RecoveryCodesAdapter = {
//     load: async (uid) => {
//       const snap = await getDoc(doc(db, 'users', uid, 'mfa-recovery', 'current'));
//       return snap.exists() ? (snap.data() as { codes: StoredCode[] }).codes : null;
//     },
//     save: async (uid, codes) => {
//       await setDoc(doc(db, 'users', uid, 'mfa-recovery', 'current'), {
//         codes, createdAt: new Date().toISOString(),
//       });
//     },
//     markSpent: async (uid, index) => {
//       const ref = doc(db, 'users', uid, 'mfa-recovery', 'current');
//       const snap = await getDoc(ref);
//       const data = snap.data() as { codes: StoredCode[] };
//       data.codes[index].spent = true;
//       data.codes[index].spentAt = new Date().toISOString();
//       await updateDoc(ref, { codes: data.codes });
//     },
//   };
//   const { codes, generate, useCode } = useRecoveryCodes(uid, adapter);

'use client';

import { useCallback, useState } from 'react';
import {
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
} from '../lib/recovery-codes';
import { emitMfaEvent } from '../lib/observability';

export interface StoredCode {
  hash: string;
  spent: boolean;
  spentAt?: string;
}

export interface RecoveryCodesAdapter {
  load: (uid: string) => Promise<StoredCode[] | null>;
  save: (uid: string, codes: StoredCode[]) => Promise<void>;
  markSpent: (uid: string, index: number) => Promise<void>;
}

export interface UseRecoveryCodesState {
  freshCodes: string[] | null;   // 평문 — 생성 직후 한 번만 표시. 사용자가 안전한 곳에 저장.
  remaining: number | null;
  loading: boolean;
  error: string | null;
}

export interface UseRecoveryCodesActions {
  generate: (count?: number) => Promise<void>;
  useCode: (code: string) => Promise<{ ok: boolean; reason?: 'invalid' | 'used' }>;
  clear: () => void;
  refresh: () => Promise<void>;
}

export function useRecoveryCodes(
  uid: string,
  adapter: RecoveryCodesAdapter,
): UseRecoveryCodesState & UseRecoveryCodesActions {
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const codes = await adapter.load(uid);
      setRemaining(codes ? codes.filter((c) => !c.spent).length : 0);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Failed to load recovery codes.');
    } finally {
      setLoading(false);
    }
  }, [uid, adapter]);

  const generate = useCallback(
    async (count = 10) => {
      setLoading(true);
      setError(null);
      try {
        const plain = generateRecoveryCodes(count);
        const stored: StoredCode[] = await Promise.all(
          plain.map(async (p) => ({ hash: await hashRecoveryCode(p), spent: false })),
        );
        await adapter.save(uid, stored);
        setFreshCodes(plain);
        setRemaining(count);
      } catch (e: unknown) {
        setError((e as Error)?.message ?? 'Failed to generate recovery codes.');
      } finally {
        setLoading(false);
      }
    },
    [uid, adapter],
  );

  const useCode = useCallback(
    async (input: string): Promise<{ ok: boolean; reason?: 'invalid' | 'used' }> => {
      setLoading(true);
      setError(null);
      try {
        const codes = await adapter.load(uid);
        if (!codes || codes.length === 0) return { ok: false, reason: 'invalid' };
        const result = await verifyRecoveryCode(input, codes);
        if (result.matchedIndex === -1) {
          return { ok: false, reason: result.reason };
        }
        await adapter.markSpent(uid, result.matchedIndex);
        const stillRemaining = codes.filter((c, i) => !c.spent && i !== result.matchedIndex).length;
        setRemaining(stillRemaining);
        emitMfaEvent({
          type: 'recovery.used',
          uid,
          at: new Date().toISOString(),
          codeIndex: result.matchedIndex,
        });
        if (stillRemaining === 0) {
          emitMfaEvent({ type: 'recovery.exhausted', uid, at: new Date().toISOString() });
        }
        return { ok: true };
      } catch (e: unknown) {
        setError((e as Error)?.message ?? 'Failed to verify recovery code.');
        return { ok: false, reason: 'invalid' };
      } finally {
        setLoading(false);
      }
    },
    [uid, adapter],
  );

  const clear = useCallback(() => {
    setFreshCodes(null);
  }, []);

  return {
    freshCodes,
    remaining,
    loading,
    error,
    generate,
    useCode,
    clear,
    refresh,
  };
}
