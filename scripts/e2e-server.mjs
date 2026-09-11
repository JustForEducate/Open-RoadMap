import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { hashPassword } from '../backend/src/security/password.js';
const temp = await mkdtemp(path.join(os.tmpdir(), 'open-roadmap-e2e-'));
Object.assign(process.env, {
  NODE_ENV: 'test', DATABASE_URL: '', SQLITE_PATH: path.join(temp, 'test.sqlite'), UPLOADS_DIR: path.join(temp, 'uploads'),
  ADMIN_PASSWORD_HASH: await hashPassword('e2e-only-password'), ALLOWED_ORIGINS: 'http://localhost:5174,http://127.0.0.1:5174',
  COOKIE_SAME_SITE: 'lax', TRUST_PROXY: '0'
});
const { createApp } = await import('../backend/src/app.js');
const { initDatabase, closeDatabase } = await import('../backend/src/db/index.js');
await initDatabase();
const server = createApp().listen(3002, '0.0.0.0');
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '0.0.0.0', '--port', '5174'], {
  cwd: path.join(process.cwd(), 'frontend'), stdio: 'inherit', env: { ...process.env, VITE_DEV_PROXY_TARGET: 'http://localhost:3002', VITE_API_BASE_URL: '' }
});
// Vite resolves its config relative to cwd; run with frontend as the root.
vite.on('error', error => { console.error(error); shutdown(1); });
let stopping = false;
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  vite.kill('SIGTERM');
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await closeDatabase();
  await rm(temp, { recursive: true, force: true });
  process.exitCode = code;
}
process.once('SIGINT', () => shutdown());
process.once('SIGTERM', () => shutdown());
vite.once('exit', code => shutdown(code || 0));
