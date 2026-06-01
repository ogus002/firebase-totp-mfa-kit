import Link from 'next/link';

type Props = { onRestart: () => void };

export default function DoneStep({ onRestart }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">✓ Signed in with two-factor auth</h2>
      <p className="text-slate-600">
        That is the complete TOTP MFA flow your users get — enrollment, the QR
        code, the login challenge, and recovery codes. Add it to your own
        Next.js app in one command:
      </p>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded text-sm overflow-x-auto">
        npx firebase-totp-mfa add next --area /admin --issuer &quot;MyApp&quot;
      </pre>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/firebase-totp-mfa-setup"
          className="bg-slate-900 text-white px-5 py-2.5 rounded font-medium hover:bg-slate-700"
        >
          Read the setup guide →
        </Link>
        <button
          onClick={onRestart}
          className="border border-slate-300 px-5 py-2.5 rounded font-medium hover:border-slate-900"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
