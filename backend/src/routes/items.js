import { listItemsWithPhotos } from '../repositories/items.js';
import { validateItem } from '../validation/items.js';
import { Router } from 'express';
const router = Router();
import { getOne, getAll, runQuery, runTransaction } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import uploadMiddleware from '../middleware/upload.js';
import { removePhotoFile, storePhoto } from '../services/photoStorage.js';

function photoUrl(req, filename) {
  return `/uploads/${encodeURIComponent(filename)}`;
}

function withPhotoUrls(req, photos) {
  return photos.map(p => ({
    id: p.id,
    filename: p.filename,
    url: photoUrl(req, p.filename)
  }));
}

router.get('/', async (req, res, next) => {
  try {
    const items = await listItemsWithPhotos();
    const result = items.map((item) => ({ ...item, photos: withPhotoUrls(req, item.photos) }));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await getOne('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    const photos = await getAll('SELECT * FROM photos WHERE item_id = ? ORDER BY created_at', [item.id]);
    res.json({ ...item, photos: withPhotoUrls(req, photos) });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const validationError = validateItem(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    const { title, description, stage } = req.body;

    const id = uuidv4();
    const now = new Date().toISOString();
    await runQuery(
      'INSERT INTO items (id, title, description, stage, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, title.trim(), description ?? '', stage, now, now]
    );

    const item = await getOne('SELECT * FROM items WHERE id = ?', [id]);
    res.status(201).json({ ...item, photos: [] });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const validationError = validateItem(req.body, { partial: true });
    if (validationError) return res.status(400).json({ error: validationError });
    const { title, description, stage } = req.body;

    const existing = await getOne('SELECT * FROM items WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const updates = [];
    const values = [];
    if (title !== undefined) { updates.push('title = ?'); values.push(title.trim()); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (stage !== undefined) {
      updates.push('stage = ?'); values.push(stage);
    }
    updates.push('updated_at = ?'); values.push(new Date().toISOString());
    values.push(id);

    if (updates.length > 1) {
      await runQuery(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const item = await getOne('SELECT * FROM items WHERE id = ?', [id]);
    const photos = await getAll('SELECT * FROM photos WHERE item_id = ?', [id]);
    res.json({ ...item, photos: withPhotoUrls(req, photos) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!await getOne('SELECT id FROM items WHERE id = ?', [id])) return res.status(404).json({ error: 'Item not found' });
    const photos = await getAll('SELECT filename FROM photos WHERE item_id = ?', [id]);
    await runTransaction([
      ['DELETE FROM photos WHERE item_id = ?', [id]],
      ['DELETE FROM items WHERE id = ?', [id]]
    ]);
    for (const photo of photos) {
      try { removePhotoFile(photo.filename); } catch (error) { console.error('Photo cleanup failed:', error.message); }
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/photos', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!await getOne('SELECT id FROM items WHERE id = ?', [id])) return res.status(404).json({ error: 'Item not found' });
    const photos = await getAll('SELECT * FROM photos WHERE item_id = ? ORDER BY created_at', [id]);
    res.json(withPhotoUrls(req, photos));
  } catch (err) {
    next(err);
  }
});

const upload = uploadMiddleware.single('photo');
let activeUploads = 0;

router.post('/:id/photos', (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err instanceof multer.MulterError ? 'Invalid upload: one image, maximum 10 MiB' : err.message });
    let filename;
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const { id } = req.params;
      const item = await getOne('SELECT * FROM items WHERE id = ?', [id]);
      if (!item) return res.status(404).json({ error: 'Item not found' });
      // Limit decoded image processing to two concurrent jobs per process.
      if (activeUploads >= 2) return res.status(429).json({ error: 'Image processing busy; retry later' });
      activeUploads++;
      try { filename = await storePhoto(req.file.buffer); }
      catch (error) { if (error.status === 400) return res.status(400).json({ error: error.message }); throw error; }
      finally { activeUploads--; }
      const photoId = uuidv4();
      await runQuery('INSERT INTO photos (id, item_id, filename, created_at) VALUES (?, ?, ?, ?)', [photoId, id, filename, new Date().toISOString()]);
      res.status(201).json({ id: photoId, filename, url: photoUrl(req, filename) });
    } catch (error) {
      if (filename) { try { removePhotoFile(filename); } catch (cleanupError) { console.error('Upload cleanup failed:', cleanupError.message); } }
      next(error);
    }
  });
});

router.delete('/:id/photos/:photoId', async (req, res, next) => {
  try {
    const { photoId, id } = req.params;
    const photo = await getOne('SELECT filename FROM photos WHERE id = ? AND item_id = ?', [photoId, id]);
    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    await runQuery('DELETE FROM photos WHERE id = ?', [photoId]);
    try { removePhotoFile(photo.filename); } catch (error) { console.error('Photo cleanup failed:', error.message); }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
