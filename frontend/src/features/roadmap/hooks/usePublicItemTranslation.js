import { useState, useEffect, useCallback, useRef } from 'react';
import { apiJson, ApiError } from '../../../shared/api/client.js';

export function usePublicItemTranslation(itemId) {
  const [titleEn, setTitleEn] = useState(null);
  const [descEn, setDescEn] = useState(null);
  const [loading, setLoading] = useState(false);
  const request = useRef(null);
  const clear = useCallback(() => {
    request.current?.abort();
    request.current = null;
    setTitleEn(null); setDescEn(null); setLoading(false);
  }, []);
  useEffect(() => { clear(); return () => request.current?.abort(); }, [itemId, clear]);
  const translate = useCallback(async (title, description, reportError) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const parts = [title, description].filter(text => text?.trim()).map(text => text.trim());
    if (!parts.length) return;
    setLoading(true);
    try {
      const { texts } = await apiJson('/api/translate', {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: parts, from: 'ru', to: 'en' })
      });
      if (!Array.isArray(texts) || texts.length !== parts.length || texts.some(text => typeof text !== 'string' || !text.trim())) throw new ApiError('error.invalidResponse');
      if (request.current !== controller) return;
      let index = 0;
      setTitleEn(title?.trim() ? texts[index++].trim() : null);
      setDescEn(description?.trim() ? texts[index].trim() : null);
    } catch (error) { if (error.name !== 'AbortError') reportError(error); }
    finally { if (request.current === controller) setLoading(false); }
  }, []);
  return { titleEn, descEn, loading, translate, clear };
}
