import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { validPasswordHash } from '../security/password.js';

export const backendRoot = fileURLToPath(new URL('../../', import.meta.url));
dotenv.config({ path: path.join(backendRoot, '.env'), quiet: true });
const port = process.env.PORT === undefined ? 3001 : Number(process.env.PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535');
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';
if (adminPasswordHash && !validPasswordHash(adminPasswordHash)) throw new Error('Invalid ADMIN_PASSWORD_HASH; use npm run admin:setup');
const production = process.env.NODE_ENV === 'production';
const cookieSameSite = process.env.COOKIE_SAME_SITE || 'lax';
if (!['lax', 'strict', 'none'].includes(cookieSameSite) || (cookieSameSite === 'none' && !production)) throw new Error('COOKIE_SAME_SITE must be lax/strict, or none with NODE_ENV=production');
const origins = (process.env.ALLOWED_ORIGINS ?? (production ? '' : 'http://localhost:5173,http://127.0.0.1:5173')).split(',').map((s) => s.trim()).filter(Boolean);
for (const origin of origins) {
  if (new URL(origin).origin !== origin) throw new Error('ALLOWED_ORIGINS must contain exact origins without paths');
}
const trustProxy = Number(process.env.TRUST_PROXY || 0);
if (!Number.isInteger(trustProxy) || trustProxy < 0 || trustProxy > 5) throw new Error('TRUST_PROXY must be a hop count from 0 to 5');
export const config = Object.freeze({
  port, production, adminPasswordHash, cookieSameSite, origins, trustProxy,
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || '',
  databasePath: path.resolve(backendRoot, process.env.SQLITE_PATH || '../database.sqlite'),
  uploadsDir: path.resolve(backendRoot, process.env.UPLOADS_DIR || 'uploads')
});
