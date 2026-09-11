import { createRequire } from 'node:module';
import { test, expect } from '@playwright/test';
const headers = { 'X-Requested-With': 'OpenRoadMap' };
const demo = [
  ['Public API documentation', 'Examples, response schemas and integration guides for the community.', 1],
  ['Roadmap subscriptions', 'Explore email notifications for the milestones you follow.', 1],
  ['Mobile experience', 'Improve navigation, touch controls and layouts on smaller screens.', 2],
  ['Accessible photo galleries', 'Keyboard navigation, focus management and clearer image controls.', 2],
  ['Secure administration', 'Server-side sessions, protected uploads and validated task updates.', 3],
  ['English and Russian', 'Switch interface language without changing the original task content.', 3],
  ['A calmer workspace', 'Light backgrounds, Golos Text and warm orange accents throughout.', 4],
  ['Share project progress', 'A public board with four stages, task details and direct links.', 4]
];
test.beforeAll(async ({ request }) => {
  expect((await request.post('/api/auth/login', { headers, data: { password: 'e2e-only-password' } })).ok()).toBeTruthy();
  for (const [title, description, stage] of demo) expect((await request.post('/api/items', { headers, data: { title, description, stage } })).status()).toBe(201);
});
test('public board, modal, full page, mobile and missing routes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.card')).toHaveCount(8);
  await page.evaluate(() => document.fonts.ready);
  if (process.env.UPDATE_SCREENSHOTS) await page.screenshot({ path: 'docs/images/public-roadmap.png', fullPage: true });
  await page.getByRole('button', { name: 'Open: Public API documentation', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('link', { name: 'Open on full page' }).click();
  await expect(page.locator('h2')).toHaveText('Public API documentation');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.card')).toHaveCount(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/this-route-does-not-exist');
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('real admin login, edit, stage move, upload and logout', async ({ page }) => {
  await page.goto('/admin');
  await page.getByLabel('Administrator password', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Invalid password', { exact: true })).toBeVisible();
  await page.getByLabel('Administrator password', { exact: true }).fill('e2e-only-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  await expect(page.locator('.card')).toHaveCount(8);
  await page.evaluate(() => document.fonts.ready);
  await page.getByText('Mobile experience', { exact: true }).hover();
  if (process.env.UPDATE_SCREENSHOTS) await page.screenshot({ path: 'docs/images/admin-roadmap.png', fullPage: true });
  await page.getByRole('button', { name: 'Edit: Mobile experience', exact: true }).click();
  await page.getByLabel('Title', { exact: true }).fill('Mobile experience — ready');
  await page.getByLabel('Stage', { exact: true }).selectOption('3');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Mobile experience — ready', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open photos: Mobile experience — ready', exact: true }).click();
  const sharp = (await import(createRequire(new URL('../../backend/package.json', import.meta.url)).resolve('sharp'))).default;
  const buffer = await sharp({ create: { width: 30, height: 30, channels: 3, background: '#e77b49' } }).png().toBuffer();
  await page.locator('input[type=file]').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer });
  await expect(page.locator('.photo-item img')).toHaveCount(1);
  await page.getByRole('button', { name: 'Close photo window' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  // A localStorage flag cannot grant access anymore.
  await page.evaluate(() => localStorage.setItem('adminLoggedIn', 'true'));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
});
test('malformed API data shows an error rather than a fake empty board', async ({ page }) => {
  await page.route('**/api/items', route => route.fulfill({ contentType: 'application/json', body: '{}' }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('invalid data');
  await expect(page.getByText('Could not load data').first()).toBeVisible();
  await expect(page.getByText('No items', { exact: true })).toHaveCount(0);
});
