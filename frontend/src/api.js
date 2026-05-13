export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function getErrorMessage(err) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return 'Нет соединения с сервером';
  }
  if (err && typeof err.message === 'string' && err.message) return err.message;
  return 'Произошла ошибка';
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
  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    throw new ApiError(getErrorMessage(e), 0, null);
  }
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
