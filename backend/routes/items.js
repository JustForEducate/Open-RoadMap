import { Router } from 'express';
const router = Router();
import { getOne, getAll, runQuery } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import uploadMiddleware from '../middleware/upload.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function photoUrl(req, filename) {
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${filename}`;
}

function withPhotoUrls(req, photos) {
  return photos.map(p => ({
    id: p.id,
    filename: p.filename,
    url: photoUrl(req, p.filename)
  }));
}

router.get('/', async (req, res) => {
  try {
    const items = await getAll('SELECT * FROM items ORDER BY stage, created_at');
    if (items.length === 0) {
      return res.json([]);
    }
    const ids = items.map((i) => i.id);
    const placeholders = ids.map(() => '?').join(', ');
    const allPhotos = await getAll(
      `SELECT * FROM photos WHERE item_id IN (${placeholders}) ORDER BY created_at`,
      ids
    );
    const byItem = new Map();
    for (const p of allPhotos) {
      const list = byItem.get(p.item_id);
      if (list) list.push(p);
      else byItem.set(p.item_id, [p]);
    }
    const result = items.map((item) => ({
      ...item,
      photos: withPhotoUrls(req, byItem.get(item.id) || [])
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, stage } = req.body;
    if (!title || !stage) return res.status(400).json({ error: 'title and stage required' });
    if (stage < 1 || stage > 4) return res.status(400).json({ error: 'stage must be 1-4' });

    const id = uuidv4();
    const now = new Date().toISOString();
    await runQuery(
      'INSERT INTO items (id, title, description, stage, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, title, description || '', stage, now, now]
    );

    const item = await getOne('SELECT * FROM items WHERE id = ?', [id]);
    res.status(201).json({ ...item, photos: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, stage } = req.body;

    const existing = await getOne('SELECT * FROM items WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const updates = [];
    const values = [];
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (stage !== undefined) {
      if (stage < 1 || stage > 4) return res.status(400).json({ error: 'stage must be 1-4' });
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
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const photos = await getAll('SELECT filename FROM photos WHERE item_id = ?', [id]);
    photos.forEach(p => {
      const filepath = path.join(__dirname, '..', 'uploads', p.filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    });
    await runQuery('DELETE FROM photos WHERE item_id = ?', [id]);
    await runQuery('DELETE FROM items WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    const photos = await getAll('SELECT * FROM photos WHERE item_id = ?', [id]);
    res.json(withPhotoUrls(req, photos));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const upload = uploadMiddleware.single('photo');

router.post('/:id/photos', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Файл слишком большой (макс 10MB)' });
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message || 'Ошибка загрузки файла' });
    }

    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const { id } = req.params;

      const item = await getOne('SELECT * FROM items WHERE id = ?', [id]);
      if (!item) return res.status(404).json({ error: 'Item not found' });

      const photoId = uuidv4();
      await runQuery(
        'INSERT INTO photos (id, item_id, filename, created_at) VALUES (?, ?, ?, ?)',
        [photoId, id, req.file.filename, new Date().toISOString()]
      );

      res.status(201).json({ id: photoId, filename: req.file.filename, url: photoUrl(req, req.file.filename) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

router.delete('/:id/photos/:photoId', async (req, res) => {
  try {
    const { photoId, id } = req.params;
    const photo = await getOne('SELECT filename FROM photos WHERE id = ? AND item_id = ?', [photoId, id]);
    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    const filepath = path.join(__dirname, '..', 'uploads', photo.filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    await runQuery('DELETE FROM photos WHERE id = ?', [photoId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
