import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiJson, API_JSON_TIMEOUT_MS } from '../src/shared/api/client.js';
const response = (body) => new Response(body, { headers: { 'Content-Type': 'application/json' } });

test('invalid JSON and malformed item lists are errors, not empty fallback data', async (t) => {
  for (const body of ['{', '{}', '[null]', '[{"id":"1"}]']) {
    t.mock.method(globalThis, 'fetch', async () => response(body));
    await assert.rejects(apiJson('/api/items'), { message: 'error.invalidResponse' });
    t.mock.restoreAll();
  }
});
test('HTML returned by a misconfigured proxy is rejected', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>app</html>'));
  await assert.rejects(apiJson('/api/items'), { message: 'error.invalidResponse' });
});
test('mutations include credentials and CSRF header', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.credentials, 'include');
    assert.equal(options.headers.get('X-Requested-With'), 'OpenRoadMap');
    return response('{"success":true}');
  });
  await apiJson('/api/auth/logout', { method: 'POST' });
});
test('caller cancellation stays an AbortError', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))));
  const controller = new AbortController();
  const request = apiJson('/api/items', { signal: controller.signal });
  controller.abort();
  await assert.rejects(request, { name: 'AbortError' });
});
test('timeout remains active while reading a response body', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', async (_, { signal }) => ({
    ok: true, status: 200, headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))
  }));
  const request = apiJson('/api/items');
  await Promise.resolve();
  t.mock.timers.tick(API_JSON_TIMEOUT_MS);
  await assert.rejects(request, { message: 'error.requestTimeout' });
});
