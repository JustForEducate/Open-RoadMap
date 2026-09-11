import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.ADMIN_PASSWORD_HASH = '';
const { createApp } = await import('../src/app.js');
test('missing admin configuration fails closed', async () => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const response = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'OpenRoadMap' }, body: JSON.stringify({ password: 'CHANGE_ME_NOW' }) });
    assert.equal(response.status, 503);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
