import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const OPTIONS = [
  { locale: 'ru', flag: '🇷🇺', labelKey: 'lang.ru' },
  { locale: 'en', flag: '🇺🇸', labelKey: 'lang.en' }
];

function LanguageSwitcher({ className = '' }) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = OPTIONS.find((o) => o.locale === locale) || OPTIONS[1];

  return (
    <div
      ref={rootRef}
      className={`lang-dropdown ${className}`.trim()}
    >
      <button
        type="button"
        className="lang-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('lang.switch')}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="lang-dropdown-flag" aria-hidden="true">
          {current.flag}
        </span>
        <span className="lang-dropdown-code">{t(current.labelKey)}</span>
        <ChevronDown size={14} className={`lang-dropdown-chevron ${open ? 'open' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <ul className="lang-dropdown-menu" role="listbox" aria-label={t('lang.switch')}>
          {OPTIONS.map((opt) => (
            <li key={opt.locale} role="none">
              <button
                type="button"
                role="option"
                aria-selected={locale === opt.locale}
                className={`lang-dropdown-item ${locale === opt.locale ? 'active' : ''}`}
                onClick={() => {
                  setLocale(opt.locale);
                  setOpen(false);
                }}
              >
                <span className="lang-dropdown-flag" aria-hidden="true">
                  {opt.flag}
                </span>
                <span>{t(opt.labelKey)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LanguageSwitcher;
