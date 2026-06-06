import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { ChatMessage } from '../../lib/concierge/types';

// Assistant replies arrive as Markdown (bold, lists, inline code, links).
// react-markdown renders no raw HTML by default, so this is XSS-safe.
const markdownComponents: Components = {
  a: ({ children, node, ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
    >
      {children}
    </a>
  ),
  p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  hr: () => <hr className="my-3 border-slate-200" />,
  h1: ({ children }) => <p className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</p>,
  h2: ({ children }) => <p className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</p>,
  h3: ({ children }) => <p className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</p>,
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-100 last:mb-0">
      {children}
    </pre>
  ),
  code: ({ className, children, node, ...props }) => {
    const fenced = /language-/.test(className ?? '');
    return fenced ? (
      <code className="font-mono" {...props}>
        {children}
      </code>
    ) : (
      <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[0.85em]" {...props}>
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-slate-300 px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border border-slate-200 px-2 py-1 align-top">{children}</td>,
};

export default function ChatMessages({
  messages,
  loading,
}: {
  messages: ChatMessage[];
  loading: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, loading]);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
      {messages.map((m, i) => (
        <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
          <div
            className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'whitespace-pre-wrap bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-900'
            }`}
          >
            {m.role === 'user' ? (
              m.content
            ) : (
              <div className="text-left [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {m.content}
                </ReactMarkdown>
              </div>
            )}
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
      <div ref={endRef} />
    </div>
  );
}
