import { randomBytes } from 'node:crypto';
import { readFile, open } from 'node:fs/promises';
import { hashPassword } from '../backend/src/security/password.js';
const envPath = new URL('../backend/.env', import.meta.url);
let existing = '';
try { existing = await readFile(envPath, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (/^ADMIN_PASSWORD_HASH\s*=/m.test(existing)) throw new Error('ADMIN_PASSWORD_HASH already exists. Remove that line to intentionally rotate the password, then restart the API.');
const password = randomBytes(24).toString('base64url');
const handle = await open(envPath, 'a', 0o600);
try { await handle.writeFile(`\nADMIN_PASSWORD_HASH=${await hashPassword(password)}\n`); } finally { await handle.close(); }
console.log('Administrator password (save it in your password manager):\n' + password);
console.log('Only its scrypt hash was written to backend/.env. Restart the API.');
