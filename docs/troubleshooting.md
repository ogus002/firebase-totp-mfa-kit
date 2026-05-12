# Troubleshooting

## `auth/requires-recent-login`

Firebase requires recent authentication for enrollment. The kit handles this
automatically — `useTotpEnroll` catches the error, calls `onRequiresRecentLogin`,
and you sign the user out and redirect to login.

If you see this in the UI, the user's session is stale. They sign in fresh and
the enrollment retries.

## `auth/unverified-email`

Firebase TOTP MFA requires a verified email address. Implement
`onUnverifiedEmail` on `<TotpEnroll>`:

```tsx
<TotpEnroll
  user={user}
  issuer="MyApp"
  onUnverifiedEmail={async () => {
    await sendEmailVerification(user);
    router.push('/verify-email-sent');
  }}
/>
```

This is by design — see `docs/SECURITY.md`.

## `auth/multi-factor-info-not-found`

User has no second factor enrolled but the flow expects one. Either:

- Send them to `/mfa-enroll` first, OR
- `<MfaGuard>` should redirect — check `enrollPath` is correct.

## 403 from `firebase-totp-mfa enable`

```
PATCH config failed (403): The caller does not have permission
```

Three causes, in order of likelihood:

1. **Active gcloud account lacks `roles/identityplatform.admin` on the project.**
   - `gcloud projects add-iam-policy-binding PROJECT --member="user:you@example.com" --role="roles/identityplatform.admin"`
2. **`X-Goog-User-Project` header missing.** The CLI sets this automatically; only relevant for manual `curl`.
3. **Identity Platform not yet upgraded.** Open Firebase Console → Authentication
   → click the "Upgrade to Identity Platform" banner.

## QR code not scanning

- The QR uses the `otpauth://` scheme. **Use the authenticator app's built-in
  QR scanner**, not the phone's default camera (which doesn't handle
  `otpauth://`).
- If the camera still won't scan (low light, glare), tap the manual setup key
  details and type/paste the base32 secret into the app.

## "I scanned the QR but the code is rejected"

Three causes:

1. **Clock drift on the device.** Authenticator apps depend on accurate time.
   Open the app's settings and let it sync time.
2. **`adjacentIntervals` too low.** Default is `1`. Raise to `2` for users with
   chronic clock drift:
   ```bash
   firebase-totp-mfa enable --project XXX --adjacent-intervals 2
   ```
3. **User typed the previous code.** Codes rotate every 30 seconds. Use the
   current code.

## `auth/network-request-failed`

User's network. Retry. If persistent, check Firebase Status Dashboard.

## Build fails: `Cannot find module 'firebase/auth'`

```bash
npm install firebase
```

Peer dependency missing.

## Build fails: `Cannot find module 'qrcode'`

```bash
npm install qrcode
npm install -D @types/qrcode
```

## `npx firebase-totp-mfa add` says "firebase auth export not found"

The CLI looks for `auth` (or `firebaseAuth`) exported from one of these files:

- `lib/firebase.{ts,tsx,js,jsx}`
- `src/lib/firebase.{ts,tsx,js,jsx}`
- `src/firebase/{config,index,client}.{ts,tsx,js,jsx}`
- `src/config/firebase.{ts,tsx,js,jsx}`
- `firebase/{config,index,client}.{ts,tsx,js,jsx}`
- `app/firebase.{ts,tsx,js,jsx}` / `app/lib/firebase.{ts,tsx,js,jsx}`

If yours is elsewhere, pass `--firebase-export "<your-import-path>"`:

```bash
npx firebase-totp-mfa add next --firebase-export "@/services/firebase-client"
```

## Codemod skipped: "Manual step required"

For Pages Router, Vite, and CRA, the CLI generates a `ProtectedRoute`
component but does **not** auto-wrap your router config — risk of breaking
existing routes. Open `docs/manual-setup.md` and wire `<ProtectedRoute>` in
yourself.

## Real mode shows "fill .env.local" but I did fill it

- Make sure the file is `.env.local`, not `.env` or `.env.development`.
- Restart your dev server after editing `.env.local`.
- Check key names match exactly (`NEXT_PUBLIC_FIREBASE_API_KEY`, etc.).

## Git Bash on Windows mangles `/admin` to `C:/Program Files/Git/admin`

This is MSYS path translation, not a bug in the kit. Three fixes:

1. **Use PowerShell or cmd** for the CLI on Windows.
2. **Escape the leading slash**: `--area //admin` (Git Bash converts it back).
3. **Disable MSYS path conv** for the command: `MSYS_NO_PATHCONV=1 npx firebase-totp-mfa add ...`

PowerShell users see no issue.

## Demo mode never lets me sign in

The 6-digit code is verified against a real RFC 6238 TOTP using a fixed secret
(`JBSWY3DPEHPK3PXP`). Add the manual key to your authenticator app, then enter
the current 6-digit code. If your phone clock is correct, it works.
