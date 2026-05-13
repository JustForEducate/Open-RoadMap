import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiJson } from '../api';
import { useErrorReporting } from '../context/ErrorContext';
import ItemDetailSkeleton from '../components/ItemDetailSkeleton';

function PublicItemView() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const viewerCloseRef = useRef(null);
  const { reportError } = useErrorReporting();

  useEffect(() => {
    setLoading(true);
    setItem(null);
    setPhotos([]);
    fetchItem();
  }, [id]);

  useEffect(() => {
    if (!selectedPhoto) return;
    const t = requestAnimationFrame(() => viewerCloseRef.current?.focus());
    return () => cancelAnimationFrame(t);
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
            На главную
          </Link>
          <div className="header-status">
            <span className="status-dot" aria-hidden="true" />
            <span>ЗАГРУЗКА…</span>
          </div>
          <div />
        </header>
        <ItemDetailSkeleton />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="loading-container">
        <h2 style={{ color: 'var(--accent-danger)' }}>Элемент не найден</h2>
        <Link to="/" className="btn" style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} aria-hidden="true" />
          На главную
        </Link>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <Link to="/" className="btn">
          <ArrowLeft size={16} aria-hidden="true" />
          На главную
        </Link>

        <div className="header-status">
          <span className="status-dot" aria-hidden="true" />
          <span>ПРОСМОТР ЭЛЕМЕНТА</span>
        </div>

        <div />
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

export default PublicItemView;
