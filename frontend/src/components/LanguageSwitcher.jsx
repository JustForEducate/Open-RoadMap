import { useI18n } from '../context/I18nContext';

function LanguageSwitcher({ className = '' }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={`lang-switcher ${className}`.trim()}
      role="group"
      aria-label={t('lang.switch')}
    >
      <button
        type="button"
        className={`lang-switcher-btn ${locale === 'ru' ? 'active' : ''}`}
        onClick={() => setLocale('ru')}
        aria-pressed={locale === 'ru'}
      >
        {t('lang.ru')}
      </button>
      <button
        type="button"
        className={`lang-switcher-btn ${locale === 'en' ? 'active' : ''}`}
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
      >
        {t('lang.en')}
      </button>
    </div>
  );
}

export default LanguageSwitcher;
