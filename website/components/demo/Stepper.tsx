type Step = 'enroll' | 'challenge' | 'done';

const STEPS: { key: Step; label: string }[] = [
  { key: 'enroll', label: '1. Enroll' },
  { key: 'challenge', label: '2. Sign-in' },
  { key: 'done', label: '3. Done' },
];

export default function Stepper({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="flex gap-2 mb-8 text-sm">
      {STEPS.map((s, i) => (
        <li
          key={s.key}
          className={`px-3 py-1.5 rounded ${
            i <= idx ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {s.label}
        </li>
      ))}
    </ol>
  );
}
