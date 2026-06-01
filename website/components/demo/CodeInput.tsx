type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
  id?: string;
};

export default function CodeInput({ value, onChange, onSubmit, autoFocus, id = 'code' }: Props) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={6}
      autoFocus={autoFocus}
      className="w-full border rounded px-3 py-2 text-lg tracking-[0.4em] font-mono"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSubmit && value.length === 6) onSubmit();
      }}
    />
  );
}
