import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateItem } from '../src/validation/items.js';
import { chunkText } from '../src/services/translation.js';

test('item validator handles full and partial payloads', () => {
  assert.equal(validateItem({ title: 'Task', stage: 1 }), null);
  assert.equal(validateItem({ stage: 4 }, { partial: true }), null);
  for (const body of [null, [], {}, { title: 'a', stage: '1' }, { title: 'a', stage: 5 }]) {
    assert.equal(typeof validateItem(body), 'string');
  }
});
test('translation splits long text into bounded chunks', () => {
  assert.deepEqual(chunkText(''), ['']);
  assert.deepEqual(chunkText('Hello'), ['Hello']);
  const text = 'word '.repeat(300).trim();
  const chunks = chunkText(text);
  assert.ok(chunks.every((chunk) => chunk.length <= 450));
  assert.equal(chunks.join(' '), text);
});
