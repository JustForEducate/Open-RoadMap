import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'open-roadmap-test-'));
process.env.DATABASE_URL = '';
process.env.SQLITE_PATH = path.join(temporary, 'test.sqlite');
process.env.UPLOADS_DIR = path.join(temporary, 'uploads');
const { hashPassword } = await import('../src/security/password.js');
process.env.ADMIN_PASSWORD_HASH = await hashPassword('test-password-not-for-deployment');
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';
const { createApp } = await import('../src/app.js');
const { initDatabase, closeDatabase } = await import('../src/db/index.js');
let server;
let base;
let cookie;
const csrf = { 'X-Requested-With': 'OpenRoadMap' };
before(async () => {
  await initDatabase();
  await fs.mkdir(process.env.UPLOADS_DIR, { recursive: true });
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { ...csrf, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'test-password-not-for-deployment' }) });
  assert.equal(response.status, 200);
  cookie = response.headers.get('set-cookie').split(';')[0];
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await closeDatabase();
  await fs.rm(temporary, { recursive: true, force: true });
});
const json = (method, body) => ({ method, headers: { ...csrf, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('health, API 404 and malformed JSON responses', async () => {
  assert.equal((await (await fetch(`${base}/api/health`)).json()).status, 'online');
  assert.equal((await fetch(`${base}/api/missing`)).status, 404);
  const response = await fetch(`${base}/api/items`, { ...json('POST', {}), body: '{' });
  assert.equal(response.status, 400);
});

test('task CRUD and photo lifecycle with isolated SQLite', async () => {
  assert.deepEqual(await (await fetch(`${base}/api/items`)).json(), []);
  const created = await fetch(`${base}/api/items`, json('POST', { title: 'Test', description: 'Details', stage: 1 }));
  assert.equal(created.status, 201);
  const item = await created.json();
  const updated = await fetch(`${base}/api/items/${item.id}`, json('PUT', { stage: 3 }));
  assert.equal((await updated.json()).stage, 3);
  const form = new FormData();
  form.append('photo', new Blob([await (await import('sharp')).default({ create: { width: 8, height: 8, channels: 3, background: '#e77b49' } }).png().toBuffer()], { type: 'image/png' }), 'test.png');
  const upload = await fetch(`${base}/api/items/${item.id}/photos`, { method: 'POST', headers: { ...csrf, Cookie: cookie }, body: form });
  assert.equal(upload.status, 201);
  const photo = await upload.json();
  assert.equal((await fetch(`${base}${photo.url}`)).status, 200);
  const list = await (await fetch(`${base}/api/items`)).json();
  assert.equal(list[0].photos[0].id, photo.id);
  assert.equal((await fetch(`${base}/api/items/${item.id}/photos/${photo.id}`, { method: 'DELETE', headers: { ...csrf, Cookie: cookie } })).status, 200);
  assert.equal((await fetch(`${base}${photo.url}`)).status, 404);
  assert.equal((await fetch(`${base}/api/items/${item.id}`, { method: 'DELETE', headers: { ...csrf, Cookie: cookie } })).status, 200);
  assert.deepEqual(await (await fetch(`${base}/api/items`)).json(), []);
});

test('invalid task input and missing-item upload are rejected without orphan files', async () => {
  for (const body of [{ title: 'Test', stage: 1.5 }, { title: ' ', stage: 1 }, { title: 'Test', stage: 2, description: {} }]) {
    assert.equal((await fetch(`${base}/api/items`, json('POST', body))).status, 400);
  }
  const form = new FormData();
  form.append('photo', new Blob(['test'], { type: 'image/png' }), 'test.png');
  assert.equal((await fetch(`${base}/api/items/missing/photos`, { method: 'POST', headers: { ...csrf, Cookie: cookie }, body: form })).status, 404);
  assert.deepEqual(await fs.readdir(process.env.UPLOADS_DIR), []);
});

test('unauthenticated writes, CSRF and untrusted origins are blocked', async () => {
  assert.equal((await fetch(`${base}/api/items`, { method: 'POST', headers: csrf })).status, 401);
  assert.equal((await fetch(`${base}/api/items/any`, { method: 'DELETE', headers: { Cookie: cookie } })).status, 403);
  assert.equal((await fetch(`${base}/api/items`, { headers: { Origin: 'https://evil.example' } })).status, 403);
  const allowed = await fetch(`${base}/api/items`, { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.equal(allowed.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await fetch(`${base}/api/items/missing`)).status, 404);
});
test('translation validation rejects coercions and language injection', async () => {
  for (const body of [{ texts: [null] }, { texts: [] }, { texts: ['a'], from: 'ru&x=1' }, { texts: ['a'.repeat(10201)] }]) {
    assert.equal((await fetch(`${base}/api/translate`, json('POST', body))).status, 400);
  }
});
test('non-image payload disguised as PNG is never published', async () => {
  const item = await (await fetch(`${base}/api/items`, json('POST', { title: 'Image validation', stage: 1 }))).json();
  const form = new FormData();
  form.append('photo', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'x.png.html');
  const response = await fetch(`${base}/api/items/${item.id}/photos`, { method: 'POST', headers: { ...csrf, Cookie: cookie }, body: form });
  assert.equal(response.status, 400);
  assert.deepEqual(await fs.readdir(process.env.UPLOADS_DIR), []);
  await fetch(`${base}/api/items/${item.id}`, { method: 'DELETE', headers: { ...csrf, Cookie: cookie } });
});
test('logout revokes the server-side session, not just the browser flag', async () => {
  const session = await fetch(`${base}/api/auth/session`, { headers: { Cookie: cookie } });
  assert.equal((await session.json()).authenticated, true);
  const login = await fetch(`${base}/api/auth/login`, json('POST', { password: 'test-password-not-for-deployment' }));
  const issued = login.headers.get('set-cookie');
  assert.ok(issued.includes('HttpOnly'));
  assert.ok(issued.includes('SameSite=Lax'));
  const fresh = issued.split(';')[0];
  await fetch(`${base}/api/auth/logout`, { method: 'POST', headers: { ...csrf, Cookie: fresh } });
  const response = await fetch(`${base}/api/items`, { method: 'POST', headers: { ...csrf, Cookie: fresh } });
  assert.equal(response.status, 401);
});

test('database transaction rolls back failed multi-statement writes', async () => {
  const { runTransaction, getOne } = await import('../src/db/index.js');
  await assert.rejects(runTransaction([
    ['INSERT INTO items (id, title, stage) VALUES (?, ?, ?)', ['rollback-test', 'rollback', 1]],
    ['INSERT INTO items (id, title, stage) VALUES (?, ?, ?)', ['rollback-test', 'duplicate', 2]]
  ]));
  assert.equal(await getOne('SELECT * FROM items WHERE id = ?', ['rollback-test']), null);
});
