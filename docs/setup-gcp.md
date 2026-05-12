# GCP / Firebase setup (one-time)

These steps need a human. The CLI cannot click Firebase Console buttons.

## 1. Create a GCP project

https://console.cloud.google.com/projectcreate

Pick a project ID like `my-app-prod`. The ID is permanent.

## 2. Link billing

Identity Platform requires a billing account, even on the free Spark plan:

- https://console.cloud.google.com/billing
- Link a credit card. No charges until you exceed free tier.

## 3. Add Firebase

https://console.firebase.google.com/ → "Add project" → pick the GCP project from
step 1.

Optional: enable Google Analytics for usage stats (free).

## 4. Enable Authentication

Firebase Console → Authentication → Get Started.

Enable at least one sign-in method:

- **Email/Password** (most common)
- Google, Microsoft, Apple, GitHub, etc.

⚠️ Phone, Anonymous, Custom token, Apple Game Center cannot use TOTP MFA.

## 5. Upgrade to Identity Platform

Firebase Console → Authentication → top banner: **"Upgrade to Identity Platform"**.

Click it. The upgrade is non-destructive — existing users/sessions are preserved.

This step is mandatory. The TOTP toggle is NOT visible in Firebase Console even
after upgrade (as of 2026). You enable TOTP via REST, which `firebase-totp-mfa
enable` does automatically.

## 6. Get your Firebase Web Config

Firebase Console → Project Settings → General → "Your apps" → "Add app" → Web.

Copy the 6 values:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

Paste them into `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_TOTP_ISSUER=YourApp
```

These values are NOT secret. They're embedded in your client bundle. Firebase's
security model relies on Auth + Firestore Rules, not on hiding `apiKey`.

## 7. Install gcloud CLI

https://cloud.google.com/sdk/docs/install

```bash
gcloud auth login
gcloud config set project YOUR-PROJECT-ID
gcloud auth print-access-token  # smoke test
```

## 8. Now run the kit's CLI

```bash
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run
# review the diff
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID
```

## Costs

| Tier | Limit |
|---|---|
| Spark (free) | 3,000 DAU on most providers (incl. TOTP MFA) |
| Blaze (pay as you go) | 50,000 MAU free, then per-MAU |
| SAML/OIDC (advanced) | 50 MAU free, then per-MAU |

TOTP itself has no per-use cost. SMS MFA is billed per-message.

## Common issue — "operation not allowed"

Make sure your sign-in provider is enabled in Authentication → Sign-in method.
Identity Platform upgrade does not auto-enable providers.
