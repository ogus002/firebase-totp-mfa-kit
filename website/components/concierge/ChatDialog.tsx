import { useState } from 'react';
import type { ChatMessage } from '../../lib/concierge/types';
import { FAQ } from '../../lib/concierge/faq';
import ChatMessages from './ChatMessages';
import FaqChips from './FaqChips';
import ChatInput from './ChatInput';
import Turnstile from './Turnstile';

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

export default function ChatDialog({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [tsToken, setTsToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pushAssistant = (content: string) =>
    setMessages((m) => [...m, { role: 'assistant', content }]);

  // 티어0: FAQ 정적 답변 (로딩 + 타이핑)
  const onFaq = (id: string) => {
    const item = FAQ.find((f) => f.id === id);
    if (!item) return;
    setError(null);
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
      const data = (await res.json()) as { reply?: string; sessionId?: string; error?: string };
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

  const needsTurnstile = !sessionId && !tsToken;

  return (
    <div className="fixed bottom-20 right-5 z-40 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col rounded-xl border bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold text-sm">Ask about Firebase MFA</span>
        <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-900">
          ×
        </button>
      </div>

      {messages.length === 0 && <FaqChips onPick={onFaq} />}
      <ChatMessages messages={messages} loading={loading} />

      {error && (
        <p className="px-4 pb-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {needsTurnstile && TURNSTILE_SITE_KEY && (
        <div className="px-4 pb-2">
          <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={setTsToken} />
        </div>
      )}

      <ChatInput
        onSend={onSend}
        disabled={loading || (needsTurnstile && !!TURNSTILE_SITE_KEY)}
      />
    </div>
  );
}
