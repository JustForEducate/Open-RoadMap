import { createApp } from './app.js';
import { config } from './config/index.js';
import { initDatabase, closeDatabase } from './db/index.js';

try {
  if (!config.adminPasswordHash) console.warn('[WARN] Admin writes are disabled until npm run admin:setup is completed.');
  await initDatabase();
  const server = createApp().listen(config.port, config.host, () => {
    console.log(`[OK] Server listening on ${config.host}:${config.port}`);
  });
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(async () => {
      try { await closeDatabase(); } catch (error) { console.error(error); process.exitCode = 1; }
      clearTimeout(timeout);
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  server.on('error', async (error) => {
    console.error('[FAIL]', error.message);
    await closeDatabase();
    process.exitCode = 1;
  });
} catch (error) {
  console.error('[FAIL] Startup failed:', error.message);
  await closeDatabase();
  process.exitCode = 1;
}
