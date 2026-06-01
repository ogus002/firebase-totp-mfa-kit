import type { ChatMessage } from '../../lib/concierge/types';

export default function ChatMessages({
  messages,
  loading,
}: {
  messages: ChatMessage[];
  loading: boolean;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.map((m, i) => (
        <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
          <div
            className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
              m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
            }`}
          >
            {m.content}
          </div>
        </div>
      ))}
      {loading && (
        <div className="text-left" aria-live="polite">
          <div className="inline-flex gap-1 rounded-2xl bg-slate-100 px-3 py-2.5">
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
          </div>
        </div>
      )}
    </div>
  );
}
