import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  buildOtpauthUrl,
  currentCode,
  verifyCode,
  generateRecoveryCodes,
} from '../../lib/demo-totp';
import CodeInput from './CodeInput';
import RecoveryCodes from './RecoveryCodes';

type Props = {
  secret: string;
  onContinue: (recoveryCodes: string[]) => void;
};

export default function EnrollStep({ secret, onContinue }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(buildOtpauthUrl(secret), { width: 220, margin: 1 }).then((url) => {
      if (!cancelled) setQr(url);
    });
    return () => {
      cancelled = true;
    };
  }, [secret]);

  const verify = () => {
    setError(null);
    if (verifyCode(secret, code)) {
      const rc = generateRecoveryCodes(8);
      setCodes(rc);
      setEnrolled(true);
    } else {
      setError('That code is not valid. Check your authenticator app and try again.');
    }
  };

  if (enrolled) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">✓ TOTP enabled</h2>
        <p className="text-slate-600 text-sm">
          Save these recovery codes — they let you sign in if you lose your device.
        </p>
        <RecoveryCodes codes={codes} />
        <button
          onClick={() => onContinue(codes)}
          className="bg-slate-900 text-white px-5 py-2.5 rounded font-medium hover:bg-slate-700"
        >
          Continue to sign-in →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Scan with your authenticator app</h2>
      <p className="text-slate-600 text-sm">
        Use Google Authenticator, Authy, 1Password, etc. Then enter the 6-digit code.
      </p>
      {qr && (
        <img src={qr} alt="TOTP QR code" width={220} height={220} className="border rounded" />
      )}
      <details className="text-sm">
        <summary className="cursor-pointer">Can&apos;t scan? Enter the key manually</summary>
        <code className="mt-2 inline-block bg-slate-100 px-2 py-1 rounded select-all break-all">
          {secret}
        </code>
      </details>
      <div className="max-w-xs">
        <label htmlFor="enroll-code" className="block text-sm font-medium mb-1">
          Authenticator code
        </label>
        <CodeInput id="enroll-code" value={code} onChange={setCode} onSubmit={verify} autoFocus />
      </div>
      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={verify}
          disabled={code.length !== 6}
          className="bg-slate-900 text-white px-5 py-2.5 rounded font-medium hover:bg-slate-700 disabled:opacity-40"
        >
          Verify &amp; enable
        </button>
        <button
          type="button"
          onClick={() => setRevealed(currentCode(secret))}
          className="text-sm text-slate-500 underline"
        >
          No app? Reveal a valid code
        </button>
      </div>
      {revealed && (
        <p className="text-sm text-slate-600">
          Current valid code: <code className="font-mono">{revealed}</code> (changes every 30s)
        </p>
      )}
    </div>
  );
}
