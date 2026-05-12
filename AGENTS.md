# AI Agent Compatibility Playbook — firebase-totp-mfa-kit

This file applies to **any AI coding agent** (Codex, Cursor, Cline, Aider, etc.).
The content mirrors `CLAUDE.md`. Read whichever your tool prefers.

> **CLI is primary. AI agents call the deterministic CLI — they don't write auth code directly.** This file is the agent playbook for edge cases the CLI cannot handle alone. The "절대 금지" rules below exist because LLMs touching auth code is the primary trust hazard for this kit; the CLI carries every mutation.

## Recommended entry

```
npx firebase-totp-mfa add next --area /admin --issuer "MyApp"
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run
npx firebase-totp-mfa enable --project YOUR-PROJECT-ID
# fill .env.local
pnpm dev
```

For full orchestration rules, fallback playbooks, hard rules, and verification, see
**[CLAUDE.md](./CLAUDE.md)** — same content, same rules.
