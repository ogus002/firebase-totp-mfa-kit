import { FAQ } from '../../lib/concierge/faq';

export default function FaqChips({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div className="px-4 py-3">
      <p className="mb-2 text-xs font-medium text-slate-500">Common questions</p>
      <div className="flex flex-col gap-1.5">
        {FAQ.map((f) => (
          <button
            key={f.id}
            onClick={() => onPick(f.id)}
            className="rounded-lg border px-3 py-1.5 text-left text-sm hover:border-slate-900"
          >
            {f.q}
          </button>
        ))}
      </div>
    </div>
  );
}
