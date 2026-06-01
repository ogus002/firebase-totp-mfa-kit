import { useState } from 'react';

type Props = { codes: string[] };

export default function RecoveryCodes({ codes }: Props) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copy = async () => {
    const text = codes.join('\n');
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      document.body.removeChild(ta);
    }
    setStatus(ok ? 'copied' : 'failed');
    setTimeout(() => setStatus('idle'), 1500);
  };

  return (
    <div className="border rounded p-4 bg-slate-50">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm">
        {codes.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <button
        onClick={copy}
        className="mt-3 text-sm border rounded px-3 py-1.5 hover:border-slate-900"
      >
        {status === 'copied' ? 'Copied ✓' : status === 'failed' ? 'Copy failed — select manually' : 'Copy codes'}
      </button>
    </div>
  );
}
