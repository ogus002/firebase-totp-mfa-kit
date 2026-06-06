import { useEffect, useState } from 'react';
import type { ChatMessage } from '../../lib/concierge/types';
import { FAQ } from '../../lib/concierge/faq';
import ChatMessages from './ChatMessages';
import FaqChips from './FaqChips';
import ChatInput from './ChatInput';
import Turnstile from './Turnstile';
import Mascot from './Mascot';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

// FAQ 답변을 Claude풍으로 지연+타이핑 노출
function typeOut(full: string, onChunk: (s: string) => void, done: () => void) {
  let i = 0;
  const step = () => {
    i += Math.max(2, Math.round(full.length / 40));
    onChunk(full.slice(0, i));
    if (i < full.length) setTimeout(step, 20);
    else done();
  };
  setTimeout(step, 400);
}

type View = 'home' | 'chat';

export default function ChatDialog({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [tsToken, setTsToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('home');

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pushAssistant = (content: string) =>
    setMessages((m) => [...m, { role: 'assistant', content }]);

  // 티어0: FAQ 정적 답변 (로딩 + 타이핑)
  const onFaq = (id: string) => {
    const item = FAQ.find((f) => f.id === id);
    if (!item) return;
    setError(null);
    setView('chat');
    setMessages((m) => [...m, { role: 'user', content: item.q }]);
    setLoading(true);
    let buf = '';
    setMessages((m) => [...m, { role: 'assistant', content: '' }]);
    typeOut(
      item.a,
      (s) => {
        buf = s;
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: 'assistant', content: buf };
          return copy;
        });
      },
      () => setLoading(false),
    );
  };

  // 티어1: 직접 질문 → /api/chat (Haiku)
  const onSend = async (text: string) => {
    setError(null);
    setView('chat');
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          sessionId ? { messages: next, sessionId } : { messages: next, turnstileToken: tsToken },
        ),
      });
      // parse defensively — an edge error page (non-JSON) must not crash into a misleading "Network error"
      let data: { reply?: string; sessionId?: string; error?: string } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        /* non-JSON response */
      }
      if (!res.ok) {
        setError(
          res.status === 429
            ? 'Too many messages — please slow down.'
            : res.status === 403
              ? 'Verification failed — reload and try again.'
              : 'Something went wrong. Try the FAQ or request help below.',
        );
      } else {
        if (data.sessionId) setSessionId(data.sessionId);
        pushAssistant(data.reply ?? '');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setError(null);
    setView('home');
    // keep sessionId/tsToken so the visitor doesn't re-verify
  };

  const needsTurnstile = !sessionId && !tsToken;

  return (
    <div
      role="dialog"
      aria-label="Firebase MFA assistant"
      className="fixed z-40 flex flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl right-5 bottom-20 h-[min(40rem,calc(100dvh-7rem))] w-[24rem] max-w-[calc(100vw-2.5rem)] max-sm:left-3 max-sm:right-3 max-sm:top-3 max-sm:bottom-3 max-sm:h-auto max-sm:w-auto max-sm:max-w-none"
    >
      {/* Header (pinned) */}
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-3">
        {view === 'chat' ? (
          <button
            onClick={() => setView('home')}
            aria-label="Back to home"
            className="rounded-md px-1 text-lg leading-none text-slate-500 hover:text-slate-900"
          >
            ←
          </button>
        ) : (
          <span className="text-slate-900">
            <Mascot size={22} />
          </span>
        )}
        <span className="flex-1 truncate text-sm font-semibold">Ask about Firebase MFA</span>
        {messages.length > 0 && (
          <button
            onClick={newChat}
            className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            New chat
          </button>
        )}
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-md px-1 text-xl leading-none text-slate-400 hover:text-slate-900"
        >
          ×
        </button>
      </div>

      {/* Scroll region (only this scrolls) */}
      {view === 'home' ? (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pb-1 pt-4">
            <p className="text-sm leading-relaxed text-slate-600">
              Hi! Ask me anything about Firebase TOTP MFA and this kit. I explain concepts and point
              to the right CLI commands — I never write auth code for you.
            </p>
          </div>
          <FaqChips onPick={onFaq} />
          {messages.length > 0 && (
            <button
              onClick={() => setView('chat')}
              className="mx-4 mb-3 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Continue your conversation →
            </button>
          )}
        </div>
      ) : (
        <ChatMessages messages={messages} loading={loading} />
      )}

      {error && (
        <p className="shrink-0 px-4 pb-1 pt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Turnstile (pinned, above input — never pushes input off-screen) */}
      {needsTurnstile && TURNSTILE_SITE_KEY && (
        <div className="shrink-0 border-t px-4 pb-1 pt-2">
          <p className="mb-1 text-[11px] text-slate-400">Quick human check (Cloudflare)</p>
          <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={setTsToken} />
        </div>
      )}

      {/* Input (pinned) */}
      <ChatInput onSend={onSend} disabled={loading || (needsTurnstile && !!TURNSTILE_SITE_KEY)} />
    </div>
  );
}
