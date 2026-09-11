import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', workers: 1, fullyParallel: false,
  use: { baseURL: 'http://localhost:5174', viewport: { width: 1440, height: 960 }, locale: 'en-US',
    launchOptions: process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE, args: ['--no-sandbox', '--disable-dev-shm-usage'] } : {} },
  webServer: { command: 'node scripts/e2e-server.mjs', url: 'http://localhost:5174', reuseExistingServer: !process.env.CI },
  reporter: 'list'
});
