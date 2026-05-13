import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiJson } from '../api';
import { useErrorReporting } from '../context/ErrorContext';

function PublicItemDetailModal({ item, onClose }) {
  const [photos, setPhotos] = useState(() => item.photos || []);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const modalCloseRef = useRef(null);
  const viewerCloseRef = useRef(null);
  const { reportError } = useErrorReporting();

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
            aria-label="Закрыть карточку"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
          {item.description && (
            <p
              style={{
                marginBottom: '1.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}
            >
              {item.description}
            </p>
          )}

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
                  aria-label="Открыть фото"
                >
                  <img src={photo.url} alt="" />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              Фотографии не загружены
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
            aria-label="Полноэкранный просмотр фотографии"
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
                  aria-label="Предыдущее фото"
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
                  aria-label="Следующее фото"
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
              aria-label="Закрыть просмотр"
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
