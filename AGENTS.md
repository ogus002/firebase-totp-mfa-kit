# AI Agent Orchestration — firebase-totp-mfa-kit

This file applies to **any AI coding agent** (Codex, Cursor, Cline, Aider, etc.).
The content mirrors `CLAUDE.md`. Read whichever your tool prefers.

> **The CLI is primary. The agent is the fallback.**

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
