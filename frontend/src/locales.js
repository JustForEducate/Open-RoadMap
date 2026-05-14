/**
 * Standalone locale strings (e.g. non-React tooling).
 * Keep `errorRequestTimeout` in sync with `error.requestTimeout` in `i18n/translations.js`.
 */
export const locales = {
  ru: {
    errorRequestTimeout:
      'Превышено время ожидания ответа сервера (20 с). Повторите попытку.'
  },
  en: {
    errorRequestTimeout: 'The server took too long to respond (20 s). Please try again.'
  }
};
