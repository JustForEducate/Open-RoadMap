import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getErrorMessage } from '../api';

const ErrorContext = createContext(null);

export function ErrorProvider({ children }) {
  const [message, setMessage] = useState(null);

  const reportError = useCallback((err) => {
    console.error(err);
    setMessage(getErrorMessage(err));
  }, []);

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
