export class ApiError extends Error {
  constructor(message, status = 0, body = null) { super(message); this.name = 'ApiError'; this.status = status; this.body = body; }
}
export const API_ERROR_REQUEST_TIMEOUT = 'error.requestTimeout';
export const API_JSON_TIMEOUT_MS = 20000;
const base = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
export function formatErrorMessage(error, t) {
  if (error instanceof ApiError && error.message.startsWith('error.')) return t(error.message);
  if (error instanceof TypeError) return t('error.noConnection');
  return error instanceof Error && error.message ? error.message : t('error.generic');
}
function invalidResponse() { throw new ApiError('error.invalidResponse'); }
function photos(value) {
  if (!Array.isArray(value)) invalidResponse();
  return value.map(photo => {
    if (!photo || typeof photo.id !== 'string' || typeof photo.filename !== 'string' || !/^\/uploads\/[a-zA-Z0-9%._-]+$/.test(photo.url)) invalidResponse();
    return { ...photo, url: `${base}${photo.url}` };
  });
}
function item(value) {
  if (!value || typeof value.id !== 'string' || typeof value.title !== 'string' || !value.title.trim() || typeof value.description !== 'string' || ![1, 2, 3, 4].includes(value.stage)) invalidResponse();
  return { ...value, photos: photos(value.photos) };
}
function validateBody(path, method, body) {
  if (path === '/api/items' && method === 'GET') {
    if (!Array.isArray(body)) invalidResponse();
    return body.map(item);
  }
  if (path === '/api/items' && method === 'POST' || /^\/api\/items\/[^/]+$/.test(path) && ['GET', 'PUT'].includes(method)) return item(body);
  if (/^\/api\/items\/[^/]+\/photos$/.test(path)) {
    if (method === 'GET') return photos(body);
    if (method === 'POST') return photos([body])[0];
  }
  if (['/api/auth/session', '/api/auth/login'].includes(path) && typeof body?.authenticated !== 'boolean') invalidResponse();
  return body;
}

export async function apiJson(path, options = {}) {
  if (!path.startsWith('/api/')) throw new ApiError('Only relative API paths are supported');
  const { signal, ...rest } = options;
  const method = (options.method || 'GET').toUpperCase();
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, API_JSON_TIMEOUT_MS);
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (!['GET', 'HEAD'].includes(method)) headers.set('X-Requested-With', 'OpenRoadMap');
  try {
    const response = await fetch(`${base}${path}`, { ...rest, headers, credentials: 'include', signal: controller.signal });
    // Body parsing is part of the timeout, not an unbounded second phase.
    if (!response.headers.get('content-type')?.includes('application/json')) throw new ApiError('error.invalidResponse', response.status);
    let body;
    try { body = await response.json(); }
    catch (error) { if (controller.signal.aborted) throw error; throw new ApiError('error.invalidResponse', response.status); }
    if (!response.ok) {
      if (response.status === 401 && path !== '/api/auth/login' && typeof window !== 'undefined') window.dispatchEvent(new Event('roadmap:session-expired'));
      throw new ApiError(typeof body?.error === 'string' && body.error.trim() ? body.error : `HTTP ${response.status}`, response.status, body);
    }
    return validateBody(path, method, body);
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (controller.signal.aborted) throw new ApiError(API_ERROR_REQUEST_TIMEOUT);
    if (error instanceof ApiError) throw error;
    throw new ApiError('error.noConnection');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
