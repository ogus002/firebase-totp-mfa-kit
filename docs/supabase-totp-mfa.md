# Supabase TOTP MFA — setup guide

> This kit wires **TOTP MFA for Firebase Identity Platform**. If your app is on
> **Supabase Auth**, you don't need this kit — Supabase has first-class TOTP MFA
> built in. This guide shows how to set it up with the same security posture the
> kit advocates: server-side enforcement, recovery codes, step-up for sensitive
> actions, and an OWASP-aligned checklist.
>
> It is framework-agnostic (Next.js, Vite, Remix, Expo, plain JS) and uses only
> the public `@supabase/supabase-js` MFA API. No custom TOTP — let Supabase do
> the RFC 6238 work.

---

## How Supabase MFA works

Supabase models MFA with **factors** (an enrolled TOTP authenticator) and
**Authentication Assurance Levels (AAL)**:

- **AAL1** — the session is password-authenticated only.
- **AAL2** — the session has also passed an MFA check.

A user enrolls one or more TOTP factors. At login they sign in with a password
(AAL1), then verify a 6-digit code to upgrade the session to AAL2. You enforce
AAL2 wherever it matters (RLS policies and/or server checks).

TOTP MFA is available on all Supabase plans at no extra cost (only Phone/SMS
factors are billed). Supabase generates and stores the secret; you never handle
it after enrollment.

---

## 1. Enrollment

Show a QR code (and the manual key) the user scans with an authenticator app,
then confirm with one code to activate the factor.

```ts
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. Create a TOTP factor — returns the QR + secret to display once.
const { data: factor, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'Authenticator app', // shown in the user's factor list
});
if (error) throw error;

// factor.totp.qr_code  -> SVG data-URL, render in an <img>
// factor.totp.secret   -> manual-entry key (show for users who can't scan)
// factor.totp.uri      -> otpauth:// URI
const factorId = factor.id;

// 2. The user enters the 6-digit code from their app. challengeAndVerify
//    activates the factor in one call.
const { error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
  factorId,
  code: userEnteredCode,
});
if (verifyErr) throw verifyErr; // wrong code — let the user retry
// Factor is now active. The current session is AAL2.
```

UI tips (see also [ACCESSIBILITY.md](./ACCESSIBILITY.md)):

- Render `qr_code` in an `<img>`; also show `secret` as copyable text for users
  who type the key manually.
- The QR `uri` looks like
  `otpauth://totp/MyApp:user@example.com?secret=...&issuer=MyApp&algorithm=SHA1&digits=6&period=30`.
  Google Authenticator, Authy, 1Password, and Microsoft Authenticator all read it
  on iOS Safari and Android Chrome.
- Immediately after activation, generate and show **recovery codes** once
  (section 4).

---

## 2. Login with MFA

After a normal password login, check whether the session still needs to be
upgraded to AAL2.

```ts
const { error: pwErr } = await supabase.auth.signInWithPassword({ email, password });
if (pwErr) throw pwErr;

const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
// aal.currentLevel === 'aal1' && aal.nextLevel === 'aal2'  -> MFA required
if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp?.[0];
  if (!totp) {
    // User must enroll before continuing (see "Enforcing enrollment" below).
  } else {
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: totp.id });
    const { error: verr } = await supabase.auth.mfa.verify({
      factorId: totp.id,
      challengeId: challenge!.id,
      code: userEnteredCode,
    });
    if (verr) throw verr; // wrong/expired code
    // Session is now AAL2.
  }
}
```

`nextLevel === 'aal2'` with `currentLevel === 'aal1'` is Supabase's signal that
the user has an enrolled factor but hasn't verified it for this session.

---

## 3. Server-side enforcement (the important part)

A frontend redirect is not enforcement. Gate the data itself so an AAL1 session
can't reach sensitive rows or actions. See [SERVER-MFA-VERIFY.md](./SERVER-MFA-VERIFY.md)
for the principle.

### Row Level Security

The session's AAL is available inside Postgres as a JWT claim. Require AAL2 in
policies on sensitive tables:

```sql
create policy "aal2 required to read billing"
on billing for select
to authenticated
using ( (auth.jwt() ->> 'aal') = 'aal2' );
```

### Step-up for high-risk actions

For destructive or money-moving actions, require a *fresh* AAL2, not just any
AAL2. Read the AAL claim and the time of the last MFA check, and re-challenge if
it is stale:

```ts
// Edge Function / API route
const aal = jwt.aal;                       // 'aal1' | 'aal2'
const verifiedAt = jwt.amr?.find(m => m.method === 'totp')?.timestamp; // epoch seconds
const MAX_AGE = 5 * 60;                     // 5 minutes for high-risk actions
if (aal !== 'aal2' || !verifiedAt || nowSec() - verifiedAt > MAX_AGE) {
  return new Response('step-up required', { status: 401 });
}
```

The client then runs `challenge` + `verify` again before retrying. Keep a list
of which endpoints require step-up and review it whenever you add a new
sensitive action.

---

## 4. Recovery codes

Supabase does **not** ship TOTP recovery codes — implement them yourself so a
user who loses their phone isn't locked out. Follow the kit's
[RECOVERY-CODES.md](./RECOVERY-CODES.md) pattern:

- Generate ~10 single-use codes at enrollment; show them **once**.
- Store only a **hash** (argon2id or bcrypt), never plaintext. Optionally keep a
  short non-secret `code_prefix` for O(1) lookup, hashing only the remainder.
- Mark a code used the moment it's consumed (one-time).
- Put them in a table that **only the service role** can read — deny client
  access with RLS:

```sql
alter table mfa_recovery_codes enable row level security;
create policy "no client access" on mfa_recovery_codes
  for all to authenticated using (false);
-- read/write only from a trusted server context (service role key)
```

- Regenerating codes invalidates the old set. Unenrolling or an admin reset
  should also invalidate them.

---

## 5. Rate limiting, lockout, and audit

- Supabase applies its own limits to MFA verification, but add an
  application-level **lockout** (e.g. 5 failed codes in 15 min → temporary lock)
  keyed on user id, not just IP.
- Log every MFA event (enroll, verify success/fail, unenroll, recovery-code
  use) to an audit trail.
- Notify the user by email on enrollment and whenever a recovery code is used.

---

## 6. Unenroll

Removing a factor is sensitive — require a fresh AAL2 (and ideally a password
re-check) before allowing it, then invalidate recovery codes.

```ts
await supabase.auth.mfa.unenroll({ factorId });
```

An admin-side reset (for a locked-out user) uses the service role:
`supabase.auth.admin.mfa.deleteFactor(userId, factorId)` — note this invalidates
the user's active sessions.

---

## 7. Security checklist (OWASP TOTP)

Apply the kit's [SECURITY.md](./SECURITY.md) and
[PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md). The essentials:

- [ ] HTTPS everywhere; secret shown only once at enrollment (QR/URI), never logged.
- [ ] Server-side AAL2 enforcement (RLS + step-up), not just client redirects.
- [ ] Recovery codes hashed, single-use, service-role-only.
- [ ] Rate limit + durable lockout on verification.
- [ ] Audit log for all MFA actions; user email notifications.
- [ ] Reasonable code window (Supabase default ±1 step ≈ 90s); replay blocked.
- [ ] A documented, abuse-resistant recovery path (codes first, admin reset last).

---

## References

- Supabase Auth MFA guide — https://supabase.com/docs/guides/auth/auth-mfa
- `auth.mfa.enroll` — https://supabase.com/docs/reference/javascript/auth-mfa-enroll
- `auth.mfa.challenge` / `verify` — https://supabase.com/docs/reference/javascript/auth-mfa-challenge
- Kit patterns referenced above: [RECOVERY-CODES.md](./RECOVERY-CODES.md),
  [SERVER-MFA-VERIFY.md](./SERVER-MFA-VERIFY.md), [SECURITY.md](./SECURITY.md),
  [ACCESSIBILITY.md](./ACCESSIBILITY.md), [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md)
