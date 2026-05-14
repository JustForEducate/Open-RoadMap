import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';
import itemsRouter from './routes/items.js';
import translateRouter from './routes/translate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/items', itemsRouter);
app.use('/api/translate', translateRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', msg: 'unhandled', error: String(err?.message || err) }));
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

try {
  await initDatabase();
  console.log(`[OK] Database connected`);
  app.listen(PORT, () => {
    console.log(`[OK] Server running on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error('[FAIL] Database connection failed:', err.message);
  console.log('Make sure DATABASE_URL is set or PostgreSQL is running locally');
  console.log('Local dev: install PostgreSQL or use Docker:');
  console.log('  docker run --name warzone-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16');
  process.exit(1);
}
