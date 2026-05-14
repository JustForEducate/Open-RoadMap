export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/** Internal message key; mapped via i18n `error.requestTimeout` in UI. */
export const API_ERROR_REQUEST_TIMEOUT = 'error.requestTimeout';

export const API_JSON_TIMEOUT_MS = 20000;

export function getErrorMessage(err) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return 'Нет соединения с сервером';
  }
  if (err && typeof err.message === 'string' && err.message) return err.message;
  return 'Произошла ошибка';
}

/**
 * @param {unknown} err
 * @param {(key: string) => string} t
 */
export function formatErrorMessage(err, t) {
  if (err instanceof ApiError) {
    if (err.message === API_ERROR_REQUEST_TIMEOUT) return t('error.requestTimeout');
    return err.message;
  }
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return t('error.noConnection');
  }
  if (err && typeof err.message === 'string' && err.message) return err.message;
  return t('error.generic');
}

async function parseBody(res) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }
  const text = await res.text().catch(() => '');
  return text;
}

/**
 * HTTP fetch with JSON handling and unified errors (E11).
 * @param {string} path - e.g. '/api/items' (prepends VITE_API_BASE_URL in prod)
 * @param {RequestInit} options
 * @returns {Promise<any>} Parsed JSON body
 */
export async function apiJson(path, options = {}) {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const url = path.startsWith('http') ? path : `${base}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_JSON_TIMEOUT_MS);

  const { signal: userSignal, ...restOptions } = options;

  if (userSignal) {
    if (userSignal.aborted) {
      clearTimeout(timeoutId);
      throw new ApiError('Aborted', 0, null);
    }
    userSignal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeoutId);
        controller.abort();
      },
      { once: true }
    );
  }

  let res;
  try {
    res = await fetch(url, { ...restOptions, signal: controller.signal });
  } catch (e) {
    clearTimeout(timeoutId);
    if (e && (e.name === 'AbortError' || e.name === 'TimeoutError')) {
      if (userSignal?.aborted) {
        throw new ApiError(typeof e.message === 'string' ? e.message : 'Aborted', 0, null);
      }
      throw new ApiError(API_ERROR_REQUEST_TIMEOUT, 0, null);
    }
    throw new ApiError(getErrorMessage(e), 0, null);
  }
  clearTimeout(timeoutId);

  const body = await parseBody(res);
  if (!res.ok) {
    const msg =
      typeof body === 'object' && body !== null && body.error
        ? String(body.error)
        : typeof body === 'string' && body
          ? body
          : res.statusText || `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, body);
  }
  return body;
}
