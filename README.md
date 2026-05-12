# Firebase TOTP MFA Kit

> Firebase Auth + Identity Platform TOTP MFA. **Add it in 30 seconds. Own the code.**

shadcn-style CLI + registry source install for Next.js / Vite / CRA. AI-friendly (Claude Code / Codex fallback playbook).

## Quick start

```bash
npx firebase-totp-mfa add next --area /admin --issuer "MyApp"
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run
# review the diff, then:
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID
cp .env.example .env.local  # fill 6 Firebase config values
pnpm dev
```

## Demo first (no Firebase config needed)

```bash
git clone https://github.com/<gh-user>/firebase-totp-mfa-kit
cd firebase-totp-mfa-kit
pnpm install
pnpm dev:demo
# → localhost:3000 — Demo mode (fixed credentials, real-input guard)
```

## With AI (Claude Code / Codex)

In your project, run an AI assistant and say:

> Set up Firebase TOTP MFA in this project. Use github.com/<gh-user>/firebase-totp-mfa-kit and run the CLI.

The assistant follows `CLAUDE.md` / `AGENTS.md` (fallback playbook) and triggers the deterministic CLI.

## Why

- **SMS cost = 0** — official Firebase TOTP, free up to 3,000 DAU on Spark plan
- **Own the code** — shadcn-style source install. Debug / customize / audit yourself
- **Officially backed** — Identity Platform, not custom auth
- **Recovery codes + server enforcement** — Phase 1 includes both

## Status

- 🚧 Phase 1 (CLI alpha) in progress
- See `spec.md` for full design.
- See `plans/phase-1-cli-alpha.md` for current build plan.

## License

MIT
