import { useState } from 'react';
import { verifyCode, currentCode, isValidRecovery, normalizeRecovery } from '../../lib/demo-totp';
import CodeInput from './CodeInput';

type Props = {
  secret: string;
  recoveryCodes: string[];
  usedRecovery: string[];
  onPassed: (usedRecoveryCode?: string) => void;
};

export default function ChallengeStep({ secret, recoveryCodes, usedRecovery, onPassed }: Props) {
  const [tab, setTab] = useState<'totp' | 'recovery'>('totp');
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);

  const submitTotp = () => {
    setError(null);
    if (verifyCode(secret, code)) onPassed();
    else setError('Incorrect code. Use the current code from your app.');
  };

  const submitRecovery = () => {
    setError(null);
    if (isValidRecovery(recoveryCodes, usedRecovery, recovery)) onPassed(normalizeRecovery(recovery));
    else setError('That recovery code is not valid.');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Now sign in again</h2>
      <p className="text-slate-600 text-sm">
        Next time this user logs in, they are challenged for a second factor.
      </p>
      <div className="flex gap-2 text-sm">
        <button
          onClick={() => { setTab('totp'); setRevealed(null); setError(null); }}
          className={`px-3 py-1.5 rounded ${tab === 'totp' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
        >
          Authenticator code
        </button>
        <button
          onClick={() => { setTab('recovery'); setRevealed(null); setError(null); }}
          className={`px-3 py-1.5 rounded ${tab === 'recovery' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
        >
          Use a recovery code
        </button>
      </div>

      {tab === 'totp' ? (
        <div className="max-w-xs space-y-3">
          <label htmlFor="challenge-code" className="block text-sm font-medium mb-1">
            Authenticator code
          </label>
          <CodeInput id="challenge-code" value={code} onChange={setCode} onSubmit={submitTotp} autoFocus />
          <button
            onClick={submitTotp}
            disabled={code.length !== 6}
            className="bg-slate-900 text-white px-5 py-2.5 rounded font-medium hover:bg-slate-700 disabled:opacity-40"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setRevealed(currentCode(secret))}
            className="block text-sm text-slate-500 underline"
          >
            No app? Reveal a valid code
          </button>
          {revealed && (
            <p className="text-sm text-slate-600">
              Current code: <code className="font-mono">{revealed}</code>
            </p>
          )}
        </div>
      ) : (
        <div className="max-w-xs space-y-3">
          <label htmlFor="recovery-input" className="block text-sm font-medium mb-1">
            Recovery code
          </label>
          <input
            id="recovery-input"
            value={recovery}
            onChange={(e) => setRecovery(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            className="w-full border rounded px-3 py-2 font-mono tracking-widest"
          />
          <button
            onClick={submitRecovery}
            className="bg-slate-900 text-white px-5 py-2.5 rounded font-medium hover:bg-slate-700"
          >
            Use recovery code
          </button>
          <p className="text-xs text-slate-500">Use one of the codes shown after enrollment.</p>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
