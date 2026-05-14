import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiJson } from '../api';
import { useErrorReporting } from '../context/ErrorContext';
import { useI18n } from '../context/I18nContext';
import ItemDetailSkeleton from '../components/ItemDetailSkeleton';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { usePublicItemTranslation } from '../hooks/usePublicItemTranslation';

function PublicItemView() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const viewerCloseRef = useRef(null);
  const { reportError } = useErrorReporting();
  const { t } = useI18n();
  const { titleEn, descEn, loading: translating, translate, clear } = usePublicItemTranslation(id ?? '');

  useEffect(() => {
    setLoading(true);
    setItem(null);
    setPhotos([]);
    fetchItem();
  }, [id]);

  useEffect(() => {
    if (!selectedPhoto) return;
    const rafId = requestAnimationFrame(() => viewerCloseRef.current?.focus());
    return () => cancelAnimationFrame(rafId);
  }, [selectedPhoto]);

  const fetchItem = async () => {
    try {
      const items = await apiJson('/api/items');
      const foundItem = items.find((i) => i.id === id);
      if (foundItem) {
        setItem(foundItem);
        const photosData = await apiJson(`/api/items/${id}/photos`);
        setPhotos(photosData);
      } else {
        setItem(null);
        setPhotos([]);
      }
    } catch (err) {
      reportError(err);
    } finally {
      setLoading(false);
    }
  };

  const navigatePhoto = (direction) => {
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < photos.length) {
      setSelectedPhoto(photos[newIndex]);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setSelectedPhoto(null);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  if (loading) {
    return (
      <div className="app-container">
        <header className="header">
          <Link to="/" className="btn">
            <ArrowLeft size={16} aria-hidden="true" />
            {t('home')}
          </Link>
          <div className="header-status">
            <span className="status-dot" aria-hidden="true" />
            <span>{t('loading.short')}</span>
          </div>
          <div className="header-actions">
            <LanguageSwitcher />
          </div>
        </header>
        <ItemDetailSkeleton />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="loading-container" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <LanguageSwitcher />
        </div>
        <h2 style={{ color: 'var(--accent-danger)' }}>{t('itemNotFound')}</h2>
        <Link to="/" className="btn" style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t('home')}
        </Link>
      </div>
    );
  }

  const canTranslate = Boolean(item.title?.trim() || item.description?.trim());
  const hasTranslation = titleEn !== null || descEn !== null;

  return (
    <div className="app-container">
      <header className="header">
        <Link to="/" className="btn">
          <ArrowLeft size={16} aria-hidden="true" />
          {t('home')}
        </Link>

        <div className="header-status">
          <span className="status-dot" aria-hidden="true" />
          <span>{t('status.viewItem')}</span>
        </div>

        <div className="header-actions">
          <LanguageSwitcher />
        </div>
      </header>

      <main className="main-content">
        <div className="modal" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="modal-header">
            <h2
              className="modal-title"
              style={{
                color: 'var(--accent-nato-glow)',
                textShadow: '0 0 10px rgba(74, 222, 80, 0.5)'
              }}
            >
              {item.title}
            </h2>
          </div>

          <div className="modal-body">
            {titleEn !== null && item.title?.trim() && (
              <section className="content-translation" style={{ marginTop: 0, marginBottom: '1.25rem' }}>
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
      </main>

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

export default PublicItemView;
