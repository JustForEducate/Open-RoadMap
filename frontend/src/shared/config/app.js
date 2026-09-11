export const BUILTIN_FOOTER = 'OpenRoadMap';

export function getAppFooterText() {
  const v = import.meta.env.VITE_APP_FOOTER;
  return typeof v === 'string' && v.trim() ? v.trim() : BUILTIN_FOOTER;
}
