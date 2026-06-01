import { useState } from 'react';

type Props = { codes: string[] };

export default function RecoveryCodes({ codes }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = codes.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback: hidden textarea + execCommand
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* give up silently */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
        {copied ? 'Copied ✓' : 'Copy codes'}
      </button>
    </div>
  );
}
