import { useState, useEffect, useCallback } from 'react';
import { apiJson } from '../api';

/**
 * Viewer-only translation (e.g. RU → EN) shown below originals; does not mutate the item.
 * @param {string} itemId
 */
export function usePublicItemTranslation(itemId) {
  const [titleEn, setTitleEn] = useState(null);
  const [descEn, setDescEn] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitleEn(null);
    setDescEn(null);
  }, [itemId]);

  const clear = useCallback(() => {
    setTitleEn(null);
    setDescEn(null);
  }, []);

  const translate = useCallback(async (title, description, reportError) => {
    const parts = [];
    if (title?.trim()) parts.push(title.trim());
    if (description?.trim()) parts.push(description.trim());
    if (parts.length === 0) return;

    setLoading(true);
    try {
      const { texts } = await apiJson('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: parts,
          from: 'ru',
          to: 'en'
        })
      });
      if (!Array.isArray(texts)) return;
      let i = 0;
      if (title?.trim()) setTitleEn((texts[i++] ?? '').trim());
      else setTitleEn(null);
      if (description?.trim()) setDescEn((texts[i++] ?? '').trim());
      else setDescEn(null);
    } catch (err) {
      reportError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { titleEn, descEn, loading, translate, clear };
}
