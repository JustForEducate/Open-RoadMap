import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { config } from './config/index.js';
import itemsRouter from './routes/items.js';
import translateRouter from './routes/translate.js';
import { createAuth } from './security/auth.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use((req, res, next) => {
    const origin = req.get('origin');
    const sameOrigin = origin === `${req.protocol}://${req.get('host')}`;
    if (origin && !sameOrigin && !config.origins.includes(origin)) return res.status(403).json({ error: 'Origin not allowed' });
    next();
  });
  app.use(cors({ origin: true, credentials: true, allowedHeaders: ['Content-Type', 'X-Requested-With'], methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
  app.use('/api', rateLimit({ windowMs: 60000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests' } }));
  app.use('/api', (req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('X-Requested-With') !== 'OpenRoadMap') return res.status(403).json({ error: 'X-Requested-With: OpenRoadMap required' });
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '32kb' }));
  app.use('/uploads', express.static(config.uploadsDir, { dotfiles: 'deny', index: false }));
  const auth = createAuth();
  app.use('/api/auth', auth.router);
  app.use('/api/items', (req, res, next) => ['GET', 'HEAD'].includes(req.method) ? next() : auth.requireAdmin(req, res, next), itemsRouter);
  app.use('/api/translate', translateRouter);
  app.get('/api/health', (req, res) => res.json({ status: 'online', timestamp: new Date().toISOString() }));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found' }));
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'JSON body exceeds 32 KiB' });
    console.error(JSON.stringify({ level: 'error', error: String(err.message) }));
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}
