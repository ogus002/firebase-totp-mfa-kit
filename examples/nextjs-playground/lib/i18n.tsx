'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { LOCALES, MESSAGES, DEFAULT_LOCALE, type Locale, type Messages } from './i18n-messages';

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Messages;
}>({ locale: DEFAULT_LOCALE, setLocale: () => {}, t: MESSAGES[DEFAULT_LOCALE] });

const COOKIE_NAME = 'NEXT_LOCALE';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function isValidLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Server-side helper — pass cookie value from the server layout into the provider. */
export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}): JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = (next: Locale): void => {
    setLocaleState(next);
    if (typeof document !== 'undefined') {
      document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: MESSAGES[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useT(): Messages {
  return useContext(LocaleContext).t;
}

export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void } {
  const { locale, setLocale } = useContext(LocaleContext);
  return { locale, setLocale };
}

export { COOKIE_NAME };
