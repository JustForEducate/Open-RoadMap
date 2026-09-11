import multer from 'multer';
// Keep untrusted input out of the public uploads directory until decoded.
export default multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0, parts: 2 },
  fileFilter(req, file, cb) {
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) return cb(new Error('Only JPEG, PNG, GIF and WebP images are allowed'));
    cb(null, true);
  }
});
