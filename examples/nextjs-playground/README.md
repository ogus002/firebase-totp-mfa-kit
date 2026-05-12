# nextjs-playground

Demo + Real mode playground for `firebase-totp-mfa-kit`.

## Demo mode (default — no Firebase needed)

```bash
pnpm install   # or npm install
pnpm dev       # or npm run dev
# → http://localhost:3000
```

- Fixed credentials (`demo@example.com` / `Demo!1234`) pre-filled and read-only
- RFC 6238 TOTP — works with any real authenticator app (Google Authenticator, 1Password, Authy)
- Fixed demo recovery codes

## Real mode

1. Fill `.env.local` with 6 Firebase config values + `NEXT_PUBLIC_TOTP_ISSUER`
2. Enable Identity Platform TOTP for your project:
   ```bash
   npx firebase-totp-mfa enable --project YOUR-PROJECT-ID
   ```
3. `pnpm dev`

Real mode flow uses the `registry/` components (same as `firebase-totp-mfa add` produces in user projects). See Task 8 dogfood notes.

## Flow

- `/` — landing
- `/login` — email/password + MFA prompt
- `/mfa-enroll` — QR scan + 6-digit verify
- `/recovery` — generate + download/print recovery codes
- `/dashboard` — protected (demo: `sessionStorage` flag)
