import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectDefaultLocale, translations } from '../src/shared/i18n/translations.js';
import { STAGE_DEFINITIONS } from '../src/features/roadmap/stageDefinitions.js';

test('browser locale selection and translation key parity', () => {
  assert.equal(detectDefaultLocale('ru-RU'), 'ru');
  assert.equal(detectDefaultLocale('de-DE'), 'en');
  assert.equal(detectDefaultLocale(undefined), 'en');
  assert.deepEqual(Object.keys(translations.ru).sort(), Object.keys(translations.en).sort());
});
test('four unique roadmap stages retain their API IDs', () => {
  assert.deepEqual(STAGE_DEFINITIONS.map(({ id }) => id), [1, 2, 3, 4]);
});

test('all translations are non-empty and literal UI keys exist', async () => {
  const { readdir, readFile } = await import('node:fs/promises');
  for (const table of Object.values(translations)) for (const value of Object.values(table)) assert.ok(typeof value === 'string' && value.trim());
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const location = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
      if (entry.isDirectory()) await visit(location);
      else if (/\.(jsx|js)$/.test(entry.name)) {
        const source = await readFile(location, 'utf8');
        for (const match of source.matchAll(/\bt\('([^']+)'/g)) assert.ok(Object.hasOwn(translations.en, match[1]), `Missing translation ${match[1]} in ${location}`);
      }
    }
  }
  await visit(new URL('../src/', import.meta.url));
});
