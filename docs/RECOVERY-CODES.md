# Recovery codes

## Why

If a user loses their authenticator app, they need a way to sign in without
contacting support. Recovery codes are the standard backup factor.

The kit ships recovery codes **in Phase 1** because shipping MFA without recovery
is an avoidable footgun.

## Flow

1. After enrollment (or any time later), the user generates 10 codes.
2. Each code is shown **once**, in plaintext. User downloads or prints.
3. The kit stores SHA-256 hashes in your storage (Firestore by default).
4. At sign-in, the user can use a code instead of the 6-digit TOTP.
5. Each code is single-use. The kit marks it spent atomically.
6. Generating a new set invalidates the old set.

## Implementation — adapter pattern

The kit does not bind to a specific storage. You provide an adapter:

```ts
import { useRecoveryCodes, type RecoveryCodesAdapter } from '@/components/totp-mfa/hooks/useRecoveryCodes';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const firestoreAdapter: RecoveryCodesAdapter = {
  load: async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid, 'mfa-recovery', 'current'));
    return snap.exists() ? (snap.data() as { codes: StoredCode[] }).codes : null;
  },
  save: async (uid, codes) => {
    await setDoc(doc(db, 'users', uid, 'mfa-recovery', 'current'), {
      codes,
      createdAt: new Date().toISOString(),
    });
  },
  markSpent: async (uid, index) => {
    const ref = doc(db, 'users', uid, 'mfa-recovery', 'current');
    const snap = await getDoc(ref);
    const data = snap.data() as { codes: StoredCode[] };
    data.codes[index].spent = true;
    data.codes[index].spentAt = new Date().toISOString();
    await updateDoc(ref, { codes: data.codes });
  },
};
```

Switch to Postgres, DynamoDB, or anything else by implementing the same interface.

## UI

`<RecoveryCodesPanel>` renders the generate / display / download / print flow.
Place it on a settings page after enrollment.

## Admin reset

If a user loses both their authenticator app and recovery codes, an admin can
reset. Two recommended flows:

### Option A — unenroll all factors (simplest)

```ts
import { getAuth } from 'firebase-admin/auth';
const user = await getAuth().getUser(uid);
for (const factor of user.multiFactor?.enrolledFactors ?? []) {
  await getAuth().updateUser(uid, {
    multiFactor: { enrolledFactors: user.multiFactor!.enrolledFactors!.filter((f) => f.uid !== factor.uid) },
  });
}
```

The user re-enrolls on next sign-in.

### Option B — multisig (two admins required)

For higher-trust environments, require two admin approvals for MFA reset. Store
pending reset requests in your audit log. This kit does not ship a multisig
implementation in Phase 1.

## Audit

Log every admin reset:

```ts
await db.collection('audit').add({
  type: 'mfa-reset',
  targetUid: uid,
  adminUid: req.uid,
  at: new Date().toISOString(),
  reason: req.body.reason,
});
```

`useRecoveryCodes` also emits `recovery.used` and `recovery.exhausted` events
via the observability hook — wire them to your audit pipeline.

## Code entropy

Each code is `XXXX-XXXX-XXXX` over a 32-character alphabet (excluding ambiguous
chars). That's ~60 bits. Brute-forcing is infeasible.
