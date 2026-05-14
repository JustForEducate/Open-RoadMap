import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { detectDefaultLocale, STORAGE_LOCALE_KEY, translations } from '../i18n/translations';

const I18nContext = createContext(null);

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_LOCALE_KEY);
      if (stored === 'ru' || stored === 'en') return stored;
    } catch {
      /* ignore */
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
      return detectDefaultLocale(navigator.language);
    }
    return 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LOCALE_KEY, locale);
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'ru' ? 'ru' : 'en';
    }
  }, [locale]);

  const setLocale = useCallback((next) => {
    setLocaleState(next === 'ru' ? 'ru' : 'en');
  }, []);

  const t = useCallback(
    (key, vars) => {
      const table = translations[locale] || translations.en;
      const fallback = translations.en[key] ?? key;
      const raw = table[key] ?? fallback;
      return interpolate(raw, vars);
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
