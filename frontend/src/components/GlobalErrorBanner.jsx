import { X } from 'lucide-react';
import { useErrorReporting } from '../context/ErrorContext';
import { useI18n } from '../context/I18nContext';

function GlobalErrorBanner() {
  const { message, dismissError } = useErrorReporting();
  const { t } = useI18n();
  if (!message) return null;

  return (
    <div className="global-error-banner" role="alert">
      <span className="global-error-banner-text">{message}</span>
      <button
        type="button"
        className="global-error-banner-close"
        onClick={dismissError}
        aria-label={t('globalError.close')}
      >
        <X size={18} />
      </button>
    </div>
  );
}

export default GlobalErrorBanner;
