/** @param {Date} date @param {'ru' | 'en'} locale */
export function formatClockTime(date, locale) {
  return date.toLocaleTimeString(locale === 'ru' ? 'ru-RU' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
