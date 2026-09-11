import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/index.js';

export function removePhotoFile(filename) {
  // Database filenames must never escape the upload directory.
  if (!filename || path.basename(filename) !== filename) {
    throw new Error('Invalid photo filename');
  }
  fs.rmSync(path.join(config.uploadsDir, filename), { force: true });
}

// Decode and re-encode, dropping metadata and any non-image payload.
export async function storePhoto(buffer) {
  const { default: sharp } = await import('sharp');
  const { randomUUID } = await import('node:crypto');
  let safe;
  try {
    const image = sharp(buffer, { limitInputPixels: 25000000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'gif', 'webp'].includes(metadata.format)) throw new Error('Unsupported image format');
    safe = await image.rotate().resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  } catch {
    throw Object.assign(new Error('Invalid image or image exceeds 25 megapixels'), { status: 400 });
  }
  fs.mkdirSync(config.uploadsDir, { recursive: true });
  const filename = `${randomUUID()}.webp`;
  await fs.promises.writeFile(path.join(config.uploadsDir, filename), safe, { flag: 'wx' });
  return filename;
}
