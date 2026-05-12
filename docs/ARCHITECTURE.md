# Architecture

## Why shadcn-style (not a library)

This kit ships **source files**, not a runtime library. The CLI copies registry
files into your project. You own the code. You can debug, customize, and audit it.

Trade-offs:
- ✅ No version-pinning friction. Your project's `firebase` version is the only one used.
- ✅ Easy to read the code (auth is critical — readable code = trust).
- ✅ Customization without forking.
- ⚠️ Updates are diff-driven. We surface them; you decide what to merge.

## Directory map

- `packages/cli/src/registry/` — source files copied to user projects
  - `components/` — React UI components
  - `hooks/` — state machines
  - `lib/` — error mapping, recovery codes, i18n, observability
  - `server/` — Express / Cloud Functions / Cloud Run / Next Route Handler snippets
- `packages/cli/src/codemods/` — framework-specific file generators
- `packages/cli/src/commands/` — `add` / `enable` / `doctor` / `verify`
- `examples/nextjs-playground/` — Demo + Real reference app

## State machines

`useTotpEnroll`: `idle → loading → qr → verifying → done | error`
`useMfaSignIn`: `idle → authenticating → mfa-required → verifying → success | error`
`useRecoveryCodes`: load → generate (returns fresh codes, shown once) → use (verify hash)

Secret handling: `TotpSecret` is stored in `useRef`, never React state, and
cleared on success or unmount.

## Demo mode (playground)

`examples/nextjs-playground` ships in Demo mode by default (no Firebase needed).
- Fixed credentials are pre-filled and read-only.
- TOTP uses RFC 6238 with a fixed example secret, so real authenticator apps work.
- Real mode activates when `.env.local` is filled.

## Identity Platform `enable` — 5-step safe

1. Verify `gcloud auth list` has an active account; check target project.
2. `GET admin/v2/projects/{id}/config` to read the current MFA config.
3. Compute the merged config (preserves other MFA providers).
4. Show diff. Require user confirmation.
5. `PATCH ?updateMask=mfa`. Read back. Assert `mfa.state === ENABLED` and a TOTP provider exists.
