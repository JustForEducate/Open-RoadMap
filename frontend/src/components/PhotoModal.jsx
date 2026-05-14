import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { apiJson } from '../api';
import { useErrorReporting } from '../context/ErrorContext';
import { useI18n } from '../context/I18nContext';

function PhotoModal({ item, onClose, onUpdate }) {
  const [photos, setPhotos] = useState(item.photos || []);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const panelRef = useRef(null);
  const viewerCloseRef = useRef(null);
  const { reportError } = useErrorReporting();
  const { t } = useI18n();

  useEffect(() => {
    fetchPhotos();
  }, [item.id]);

  useEffect(() => {
    const t = requestAnimationFrame(() => panelRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (!selectedPhoto) return;
    const t = requestAnimationFrame(() => viewerCloseRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [selectedPhoto]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (selectedPhoto) setSelectedPhoto(null);
        else onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedPhoto, onClose]);

  const fetchPhotos = async () => {
    try {
      const data = await apiJson(`/api/items/${item.id}/photos`);
      setPhotos(data);
    } catch (err) {
      reportError(err);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const newPhoto = await apiJson(`/api/items/${item.id}/photos`, {
        method: 'POST',
        body: formData
      });
      setPhotos((prev) => [...prev, newPhoto]);
      onUpdate();
    } catch (err) {
      reportError(err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photoId, e) => {
    e.stopPropagation();
    if (!confirm(t('deletePhotoConfirm'))) return;

    try {
      await apiJson(`/api/items/${item.id}/photos/${photoId}`, { method: 'DELETE' });
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
      onUpdate();
    } catch (err) {
      reportError(err);
    }
  };

  const navigatePhoto = (direction) => {
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < photos.length) {
      setSelectedPhoto(photos[newIndex]);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} role="presentation">
        <div
          ref={panelRef}
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="photo-modal-title"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '800px' }}
        >
          <div className="modal-header">
            <h2
              id="photo-modal-title"
              className="modal-title"
              style={{
                color: 'var(--accent-nato-glow)',
                textShadow: '0 0 10px rgba(74, 222, 80, 0.5)'
              }}
            >
              {item.title}
            </h2>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label={t('photoModal.closePhotos')}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="modal-body">
            {item.description && (
              <p
                style={{
                  marginBottom: '1.5rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  lineHeight: '1.6'
                }}
              >
                {item.description}
              </p>
            )}

            <div className="photo-gallery">
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
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={(e) => handleDeletePhoto(photo.id, e)}
                    aria-label={t('photoModal.deletePhoto')}
                  >
                    <Trash2 size={12} aria-hidden="true" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="add-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                aria-label={t('photoModal.addPhoto')}
              >
                <Plus size={24} aria-hidden="true" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              aria-hidden="true"
            />

            {loading && (
              <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--accent-nato-glow)' }}>
                {t('photoModal.uploading')}
              </p>
            )}

            {photos.length === 0 && !loading && (
              <p
                style={{
                  textAlign: 'center',
                  marginTop: '2rem',
                  color: 'var(--text-secondary)'
                }}
              >
                {t('photoModal.clickToAdd')}
              </p>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>
              {t('photoModal.close')}
            </button>
          </div>
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
    </>
  );
}

export default PhotoModal;
