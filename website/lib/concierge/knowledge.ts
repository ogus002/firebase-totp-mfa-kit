// 컨시에지가 답할 때 시스템 prefix 로 들어가는 큐레이션 지식 (docs 발췌). 캐시 대상.
export const KNOWLEDGE = `firebase-totp-mfa is a shadcn-style CLI that adds Firebase Identity Platform TOTP 2FA to React/Next.js apps.

Key facts:
- Install: \`npx firebase-totp-mfa add next --area /admin --issuer "MyApp"\` (also: vite, expo, custom). Copies source into the user's repo (they own the code).
- Enable Identity Platform: \`npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run\` then without --dry-run. Sets adjacentIntervals=5.
- Verify: \`npx firebase-totp-mfa verify\` prints manual test scenarios.
- TOTP (authenticator app) not SMS: no per-message cost, free on Firebase Spark up to 3,000 DAU.
- Recovery codes ship in Phase 1. Server-side MFA enforcement snippets included.
- Live demo of the enroll -> login challenge -> recovery flow: /demo
- Setup guide page: /firebase-totp-mfa-setup
- Common errors: 403 on enable = gcloud account missing Project Owner; "Identity Platform not enabled" = upgrade in Firebase console first; wrong project = gcloud config set project.
- Paid help: a $19 async security check (1-page report + auth flow review + checklist) and hourly consulting for integration. Routed to a human, post-pay (no prepayment).`;
