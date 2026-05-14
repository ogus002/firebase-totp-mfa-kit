import Layout from '../components/Layout';

export default function Setup() {
  return (
    <Layout
      title="Firebase TOTP MFA Setup for Next.js (2026 Guide)"
      description="Complete guide to enable Firebase Identity Platform TOTP 2-factor authentication in a Next.js app. CLI installs everything in one command."
    >
      <h1 className="text-3xl font-bold mb-4">
        Firebase TOTP MFA Setup for Next.js
      </h1>
      <p className="mb-6">
        Add TOTP-based 2FA to your Firebase + Next.js app without writing auth
        boilerplate. Uses Firebase Identity Platform under the hood. Works on
        Next.js App Router and Pages Router.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">1. Install</h2>
      <p className="mb-3">
        Run the CLI in your Next.js project. It detects your framework, copies
        the source files into <code>app/(auth)/mfa-enroll</code>, and wires the
        route into your existing layout.
      </p>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded text-sm overflow-x-auto">
        npx firebase-totp-mfa add next --area /admin --issuer "MyApp"
      </pre>

      <h2 className="text-2xl font-semibold mt-8 mb-3">
        2. Enable Identity Platform
      </h2>
      <p className="mb-3">
        Identity Platform must be turned on in your Firebase project before
        TOTP MFA works. Dry-run first to preview the API call:
      </p>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded text-sm overflow-x-auto">
        npx firebase-totp-mfa enable --project YOUR-PROJECT-ID --dry-run
      </pre>
      <p className="mt-4 mb-3">
        Then run without <code>--dry-run</code> to apply. The CLI sets{' '}
        <code>adjacentIntervals=5</code> on the Identity Platform config so
        slow phones do not get locked out.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">3. Verify</h2>
      <p className="mb-3">
        The CLI ships with a verification walkthrough that prints manual test
        scenarios — enrollment, login challenge, recovery code, lockout.
      </p>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded text-sm overflow-x-auto">
        npx firebase-totp-mfa verify
      </pre>

      <h2 className="text-2xl font-semibold mt-8 mb-3">Why this CLI</h2>
      <ul className="list-disc pl-6 space-y-2 text-slate-700">
        <li>
          <strong>Shadcn-style ownership:</strong> source files land in your
          repo. No runtime dependency on this kit. You can edit anything.
        </li>
        <li>
          <strong>AI-orchestration friendly:</strong> CLAUDE.md ships with the
          kit so Claude Code and Codex CLI follow hard rules (never read{' '}
          <code>.env</code>, never run destructive shells).
        </li>
        <li>
          <strong>Identity Platform aware:</strong> the <code>enable</code>{' '}
          command flips the GCP-side config, not just the Firebase console.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-3">Common errors</h2>
      <ul className="list-disc pl-6 space-y-2 text-slate-700">
        <li>
          <strong>403 on enable:</strong> the gcloud account is missing Project
          Owner. Run <code>gcloud auth list</code> and verify the active
          account has owner role on the project.
        </li>
        <li>
          <strong>"Identity Platform not enabled":</strong> upgrade the project
          in the Firebase console first (Authentication &rarr; Settings &rarr;
          Identity Platform).
        </li>
        <li>
          <strong>Wrong gcloud project:</strong>{' '}
          <code>gcloud config set project YOUR-PROJECT-ID</code> before
          re-running enable.
        </li>
      </ul>

      <p className="mt-8 text-sm text-slate-600">
        Full manual setup:{' '}
        <a
          href="https://github.com/ogus02/firebase-totp-mfa-kit/blob/main/docs/manual-setup.md"
          className="underline"
          rel="noreferrer"
        >
          docs/manual-setup.md
        </a>{' '}
        &middot; Troubleshooting:{' '}
        <a
          href="https://github.com/ogus02/firebase-totp-mfa-kit/blob/main/docs/troubleshooting.md"
          className="underline"
          rel="noreferrer"
        >
          docs/troubleshooting.md
        </a>
      </p>
    </Layout>
  );
}
