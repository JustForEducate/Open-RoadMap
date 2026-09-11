import { randomBytes, createHash } from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { config } from '../config/index.js';
import { verifyPassword } from './password.js';

const cookieName = 'roadmap_session';
const lifetime = 8 * 60 * 60 * 1000;
const digest = (value) => createHash('sha256').update(value).digest('hex');
const cookieOptions = { httpOnly: true, secure: config.production, sameSite: config.cookieSameSite, path: '/api' };

export function createAuth() {
  const sessions = new Map();
  function sessionKey(req) {
    const value = req.headers.cookie?.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    return value && /^[a-f0-9]{64}$/.test(value) ? digest(value) : null;
  }
  function authenticated(req) {
    const key = sessionKey(req);
    const expiry = key && sessions.get(key);
    if (!expiry) return false;
    if (expiry <= Date.now()) { sessions.delete(key); return false; }
    return true;
  }
  const requireAdmin = (req, res, next) => {
    if (!authenticated(req)) return res.status(401).json({ error: 'Authentication required' });
    next();
  };
  const router = Router();
  router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many login attempts. Try again later.' } });
  router.get('/session', (req, res) => res.json({ authenticated: authenticated(req) }));
  router.post('/login', loginLimit, async (req, res, next) => {
    try {
      if (!config.adminPasswordHash) return res.status(503).json({ error: 'Administrator access is not configured' });
      const password = req.body?.password;
      if (typeof password !== 'string' || !password || password.length > 1024) return res.status(400).json({ error: 'Password required (maximum 1024 characters)' });
      if (!await verifyPassword(password, config.adminPasswordHash)) return res.status(401).json({ error: 'Invalid password' });
      for (const [key, expires] of sessions) if (expires <= Date.now()) sessions.delete(key);
      if (sessions.size >= 100) sessions.delete(sessions.keys().next().value);
      const old = sessionKey(req);
      if (old) sessions.delete(old);
      const token = randomBytes(32).toString('hex');
      sessions.set(digest(token), Date.now() + lifetime);
      res.cookie(cookieName, token, { ...cookieOptions, maxAge: lifetime });
      res.json({ authenticated: true });
    } catch (error) { next(error); }
  });
  router.post('/logout', (req, res) => {
    const key = sessionKey(req);
    if (key) sessions.delete(key);
    res.clearCookie(cookieName, cookieOptions);
    res.json({ success: true });
  });
  return { router, requireAdmin };
}
