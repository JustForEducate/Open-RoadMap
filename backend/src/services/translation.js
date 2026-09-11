const MAX_CHUNK = 450;

export function chunkText(s) {
  if (typeof s !== 'string') throw new TypeError('Translation input must be a string');
  const text = s;
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

async function translateChunk(text, from, to, signal) {
  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', `${from}|${to}`);
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal });
  if (!res.ok) throw new Error(`Translation HTTP ${res.status}`);
  const data = await res.json();
  if (data.responseStatus !== 200 || typeof data.responseData?.translatedText !== 'string' || !data.responseData.translatedText.trim()) throw new Error('Invalid or empty translation response');
  return data.responseData.translatedText;
}

export async function translateFull(text, from, to, signal) {
  if (typeof text !== 'string' || !text.trim()) throw new TypeError('Non-empty translation input required');
  const out = [];
  for (const part of chunkText(text)) out.push(await translateChunk(part, from, to, signal));
  return out.join(' ').trim();
}
