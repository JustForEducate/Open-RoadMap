import { X } from 'lucide-react';
import { useErrorReporting } from '../context/ErrorContext';

function GlobalErrorBanner() {
  const { message, dismissError } = useErrorReporting();
  if (!message) return null;

  return (
    <div className="global-error-banner" role="alert">
      <span className="global-error-banner-text">{message}</span>
      <button
        type="button"
        className="global-error-banner-close"
        onClick={dismissError}
        aria-label="Закрыть уведомление об ошибке"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export default GlobalErrorBanner;
