import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { translateFull } from '../services/translation.js';
const router = Router();
let active = 0;
router.use(rateLimit({ windowMs: 60000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Translation rate limit exceeded' } }));
router.post('/', async (req, res) => {
  const { texts, from = 'ru', to = 'en' } = req.body ?? {};
  if (from !== 'ru' || to !== 'en') return res.status(400).json({ error: 'Only ru → en translation is supported' });
  if (!Array.isArray(texts) || texts.length < 1 || texts.length > 2 || texts.some((text) => typeof text !== 'string' || !text.trim()) || texts.join('').length > 10200) return res.status(400).json({ error: 'Provide 1–2 non-empty strings, maximum 10200 characters total' });
  if (active >= 4) return res.status(429).json({ error: 'Translation service busy' });
  active++;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const onClose = () => { if (!res.writableEnded) controller.abort(); };
  res.once('close', onClose);
  try {
    const results = [];
    for (const text of texts) results.push(await translateFull(text, from, to, controller.signal));
    res.json({ texts: results });
  } catch (error) {
    console.error('Translation failed:', error.message);
    if (!res.destroyed) res.status(controller.signal.aborted ? 504 : 502).json({ error: controller.signal.aborted ? 'Translation timed out' : 'Translation service unavailable' });
  } finally {
    clearTimeout(timeout);
    res.off('close', onClose);
    active--;
  }
});
export default router;
