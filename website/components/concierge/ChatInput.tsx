import { useState } from 'react';

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState('');
  const submit = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText('');
  };
  return (
    <div className="flex items-center gap-2 border-t px-3 py-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        placeholder="Ask your own question…"
        className="flex-1 rounded-lg border px-3 py-2 text-sm"
      />
      <button
        onClick={submit}
        disabled={disabled || text.trim().length === 0}
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-40"
      >
        Send
      </button>
    </div>
  );
}
