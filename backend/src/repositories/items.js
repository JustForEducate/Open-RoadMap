import { getAll } from '../db/index.js';

export async function listItemsWithPhotos() {
  const items = await getAll('SELECT * FROM items ORDER BY stage, created_at');
  if (!items.length) return [];
  const ids = items.map((item) => item.id);
  const placeholders = ids.map(() => '?').join(', ');
  const photos = await getAll(
    `SELECT * FROM photos WHERE item_id IN (${placeholders}) ORDER BY created_at`, ids
  );
  const byItem = new Map();
  for (const photo of photos) {
    if (!byItem.has(photo.item_id)) byItem.set(photo.item_id, []);
    byItem.get(photo.item_id).push(photo);
  }
  return items.map((item) => ({ ...item, photos: byItem.get(item.id) || [] }));
}
