import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout
      title="firebase-totp-mfa — Add Firebase TOTP MFA in 30 seconds"
      description="shadcn-style CLI to add Firebase TOTP 2FA to Next.js apps in one command. AI-friendly orchestration."
    >
      <h1 className="text-4xl font-bold mb-4">
        Add Firebase TOTP MFA in 30 seconds
      </h1>
      <p className="text-lg mb-6">
        One-command CLI to wire up Firebase Identity Platform TOTP 2FA in your
        Next.js app. Owns the source. AI-orchestration friendly.
      </p>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded text-sm overflow-x-auto">
        npx firebase-totp-mfa add next --area /admin --issuer "MyApp"
      </pre>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Shadcn-style</h3>
          <p className="text-sm text-slate-600">
            CLI copies the source into your project. You own it. No magical
            runtime dependency.
          </p>
        </div>
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">AI-friendly</h3>
          <p className="text-sm text-slate-600">
            CLAUDE.md ships with the kit. Hard rules prevent agents from
            touching <code>.env</code> or running destructive shell commands.
          </p>
        </div>
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Identity Platform aware</h3>
          <p className="text-sm text-slate-600">
            <code>enable</code> command flips on Firebase Identity Platform
            TOTP MFA in your GCP project, no manual console clicks.
          </p>
        </div>
      </div>
    </Layout>
  );
}
