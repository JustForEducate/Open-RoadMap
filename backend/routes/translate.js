import express from 'express';

const router = express.Router();

const MAX_CHUNK = 450;

function chunkText(s) {
  const text = typeof s === 'string' ? s : '';
  if (text.length <= MAX_CHUNK) return text ? [text] : [''];

  const chunks = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + MAX_CHUNK, text.length);
    if (end < text.length) {
      const space = text.lastIndexOf(' ', end);
      if (space > i) end = space;
    }
    const slice = text.slice(i, end).trim();
    if (slice) chunks.push(slice);
    i = end;
    while (i < text.length && /\s/.test(text[i])) i += 1;
  }
  return chunks.length ? chunks : [''];
}

async function translateChunk(text, from, to) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: ac.signal
    });
    if (!res.ok) {
      throw new Error(`Translation HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.responseStatus !== 200) {
      throw new Error(data.responseDetails || 'Translation failed');
    }
    return data.responseData?.translatedText ?? '';
  } finally {
    clearTimeout(t);
  }
}

async function translateFull(text, from, to) {
  if (!text || !String(text).trim()) return '';
  const parts = chunkText(String(text));
  const out = [];
  for (let i = 0; i < parts.length; i += 1) {
    const p = parts[i];
    if (!p) {
      out.push('');
      continue;
    }
    out.push(await translateChunk(p, from, to));
    if (i < parts.length - 1) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  return out.join(' ').trim();
}

router.post('/', async (req, res, next) => {
  try {
    const { texts, from = 'ru', to = 'en' } = req.body || {};
    if (!Array.isArray(texts)) {
      return res.status(400).json({ error: 'texts must be an array' });
    }
    const pairFrom = String(from).slice(0, 8);
    const pairTo = String(to).slice(0, 8);
    const results = [];
    for (const raw of texts) {
      results.push(await translateFull(raw, pairFrom, pairTo));
    }
    res.json({ texts: results });
  } catch (e) {
    next(e);
  }
});

export default router;
