import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiJson } from '../api';
import { useErrorReporting } from '../context/ErrorContext';
import { useI18n } from '../context/I18nContext';
import { usePublicItemTranslation } from '../hooks/usePublicItemTranslation';

function PublicItemDetailModal({ item, onClose }) {
  const [photos, setPhotos] = useState(() => item.photos || []);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const modalCloseRef = useRef(null);
  const viewerCloseRef = useRef(null);
  const { reportError } = useErrorReporting();
  const { t } = useI18n();
  const { titleEn, descEn, loading: translating, translate, clear } = usePublicItemTranslation(item.id);

  const canTranslate = Boolean(item.title?.trim() || item.description?.trim());
  const hasTranslation = titleEn !== null || descEn !== null;

  useEffect(() => {
    setPhotos(item.photos || []);
    setSelectedPhoto(null);
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson(`/api/items/${item.id}/photos`);
        if (!cancelled) setPhotos(data);
      } catch (err) {
        if (!cancelled) reportError(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item.id, reportError]);

  useEffect(() => {
    const id = requestAnimationFrame(() => modalCloseRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!selectedPhoto) return;
    const id = requestAnimationFrame(() => viewerCloseRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [selectedPhoto]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key !== 'Escape') return;
      if (selectedPhoto) setSelectedPhoto(null);
      else onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedPhoto, onClose]);

  const navigatePhoto = (direction) => {
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < photos.length) {
      setSelectedPhoto(photos[newIndex]);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-item-modal-title"
        style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2
            id="public-item-modal-title"
            className="modal-title"
            style={{
              color: 'var(--accent-nato-glow)',
              textShadow: '0 0 10px rgba(74, 222, 80, 0.5)'
            }}
          >
            {item.title}
          </h2>
          <button
            ref={modalCloseRef}
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label={t('publicModal.closeCard')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
          {titleEn !== null && item.title?.trim() && (
            <section className="content-translation" style={{ marginTop: 0 }}>
              <div className="content-translation-label">{t('publicTranslate.translation')}</div>
              <div className="content-translation-text">{titleEn}</div>
            </section>
          )}

          {item.description ? (
            <div style={{ marginBottom: '1.5rem' }}>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {item.description}
              </p>
              {descEn !== null && (
                <section className="content-translation" style={{ marginTop: '0.75rem' }}>
                  <div className="content-translation-label">{t('publicTranslate.translation')}</div>
                  <div className="content-translation-text">{descEn}</div>
                </section>
              )}
            </div>
          ) : null}

          <div className="public-translate-toolbar">
            <button
              type="button"
              className="btn"
              disabled={!canTranslate || translating}
              aria-busy={translating}
              onClick={() => translate(item.title, item.description, reportError)}
            >
              {translating ? t('translate.translating') : t('publicTranslate.showEnglish')}
            </button>
            {hasTranslation && (
              <button type="button" className="btn" onClick={clear}>
                {t('publicTranslate.hide')}
              </button>
            )}
          </div>

          {photos.length > 0 ? (
            <div
              className="photo-gallery"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
            >
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="photo-item"
                  onClick={() => setSelectedPhoto(photo)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedPhoto(photo);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={t('publicModal.openPhoto')}
                >
                  <img src={photo.url} alt="" />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              {t('publicModal.noPhotos')}
            </p>
          )}
        </div>
      </div>

      {selectedPhoto && (
        <div
          className="photo-viewer-overlay"
          onClick={() => setSelectedPhoto(null)}
          role="presentation"
        >
          <div
            className="photo-viewer"
            role="dialog"
            aria-modal="true"
            aria-label={t('publicModal.fullscreen')}
            onClick={(e) => e.stopPropagation()}
          >
            <img src={selectedPhoto.url} alt="" />

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  className="photo-viewer-nav prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigatePhoto(-1);
                  }}
                  aria-label={t('publicModal.prevPhoto')}
                >
                  <ChevronLeft size={24} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="photo-viewer-nav next"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigatePhoto(1);
                  }}
                  aria-label={t('publicModal.nextPhoto')}
                >
                  <ChevronRight size={24} aria-hidden="true" />
                </button>
              </>
            )}

            <button
              ref={viewerCloseRef}
              type="button"
              className="photo-viewer-close"
              onClick={() => setSelectedPhoto(null)}
              aria-label={t('publicModal.closeViewer')}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicItemDetailModal;
