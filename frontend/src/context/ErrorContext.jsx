import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { formatErrorMessage } from '../api';
import { useI18n } from './I18nContext';

const ErrorContext = createContext(null);

export function ErrorProvider({ children }) {
  const [message, setMessage] = useState(null);
  const { t } = useI18n();

  const reportError = useCallback(
    (err) => {
      console.error(err);
      setMessage(formatErrorMessage(err, t));
    },
    [t]
  );

  const dismissError = useCallback(() => setMessage(null), []);

  const value = useMemo(
    () => ({ message, reportError, dismissError }),
    [message, reportError, dismissError]
  );

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
}

export function useErrorReporting() {
  const ctx = useContext(ErrorContext);
  if (!ctx) {
    throw new Error('useErrorReporting must be used within ErrorProvider');
  }
  return ctx;
}
