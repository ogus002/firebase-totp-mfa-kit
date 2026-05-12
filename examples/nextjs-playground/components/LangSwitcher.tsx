'use client';
import { useLocale } from '@/lib/i18n';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n-messages';

export function LangSwitcher(): JSX.Element {
  const { locale, setLocale } = useLocale();
  return (
    <div
      role="navigation"
      aria-label="Language selector"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        fontSize: '0.85rem',
        borderBottom: '1px solid var(--border, #e5e7eb)',
        background: 'var(--bg-muted, #f9fafb)',
      }}
    >
      <label htmlFor="lang-select" style={{ color: 'var(--muted, #6b7280)' }}>
        🌐
      </label>
      <select
        id="lang-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        style={{
          background: 'transparent',
          border: '1px solid var(--border, #d1d5db)',
          borderRadius: 4,
          padding: '0.2rem 0.4rem',
          fontSize: '0.85rem',
          cursor: 'pointer',
        }}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </div>
  );
}
