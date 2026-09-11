import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, RefreshCw } from 'lucide-react';
import { apiJson } from '../../../shared/api/client.js';
import { useErrorReporting } from '../../../shared/context/ErrorContext.jsx';
import { useI18n } from '../../../shared/context/I18nContext.jsx';
import { formatClockTime } from '../../../shared/lib/formatTime.js';
import AppFooter from '../../../shared/ui/AppFooter.jsx';
import RoadmapGridSkeleton from '../components/RoadmapGridSkeleton.jsx';
import PublicItemDetailModal from '../components/PublicItemDetailModal.jsx';
import LanguageSwitcher from '../../../shared/ui/LanguageSwitcher.jsx';
import { useStages } from '../hooks/useStages.js';

function PublicRoadmap() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const { reportError } = useErrorReporting();
  const { t, locale } = useI18n();
  const stages = useStages();
  const [failed, setFailed] = useState(false);
  const request = useRef(null);

  useEffect(() => {
    fetchItems();
    return () => request.current?.abort();
  }, []);

  const fetchItems = async (manual = false) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    if (manual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await apiJson('/api/items', { signal: controller.signal });
      setFailed(false);
      setItems(data);
      setLastUpdated(formatClockTime(new Date(), locale));
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return false;
      setFailed(true);
      reportError(err);
      return false;
    } finally {
      if (request.current === controller) { setLoading(false); setRefreshing(false); }
    }
  };

  const getItemsByStage = (stageId) => {
    return items.filter((item) => item.stage === stageId);
  };

  const openCard = (item) => {
    setModalItem(item);
  };

  const handleCardKeyDown = (e, item) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openCard(item);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16" /></svg>
          </div>
          <span className="logo-text">OpenRoadMap</span>
        </div>

        <div className="header-status">
          <div className="header-status-row">
            <span className="status-dot" aria-hidden="true" />
            <span>{loading ? t('loading.short') : failed ? t('error.loadFailed') : t('status.online')}</span>
          </div>
          {lastUpdated && !loading && (
            <span className="header-updated">{t('lastUpdated', { time: lastUpdated })}</span>
          )}
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-icon-only"
            onClick={() => fetchItems(true)}
            disabled={loading || refreshing}
            aria-label={t('refresh.aria')}
            aria-busy={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'icon-spin' : ''} aria-hidden="true" />
          </button>
          <LanguageSwitcher />
          <Link to="/admin" className="btn">
            <Shield size={16} aria-hidden="true" />
            {t('admin')}
          </Link>
        </div>
      </header>

      <main id="main-content" className="main-content" tabIndex={-1}>
        {loading ? (
          <RoadmapGridSkeleton />
        ) : failed && !items.length ? (
          <div className="empty-state"><p>{t('error.loadFailed')}</p><button className="btn" onClick={() => fetchItems(true)}>{t('retry')}</button></div>
        ) : (
          <div className="roadmap-grid">
            {stages.map((stage) => (
              <div key={stage.id} className="stage-column">
                <div className="stage-header">
                  <div
                    className="stage-led"
                    style={{ backgroundColor: stage.color, color: stage.color }}
                  />
                  <span className="stage-title">{stage.name}</span>
                  <span className="stage-count">{getItemsByStage(stage.id).length}</span>
                </div>

                <div className="stage-content">
                  {getItemsByStage(stage.id).length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon" aria-hidden="true">
                        📋
                      </div>
                      <p>{t('empty.noItems')}</p>
                    </div>
                  ) : (
                    getItemsByStage(stage.id).map((item) => (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        className="card"
                        onClick={() => openCard(item)}
                        onKeyDown={(e) => handleCardKeyDown(e, item)}
                        aria-label={t('card.open', { title: item.title })}
                      >
                        <div className="card-title" title={item.title}>
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="card-description">{item.description}</div>
                        )}

                        <div className="card-photos">
                          {item.photos && item.photos.length > 0 ? (
                            <>
                              {item.photos.slice(0, 3).map((photo) => (
                                <img
                                  key={photo.id}
                                  src={photo.url}
                                  alt=""
                                  className="card-photo-thumb"
                                />
                              ))}
                              {item.photos.length > 3 && (
                                <div className="card-photo-more">+{item.photos.length - 3}</div>
                              )}
                            </>
                          ) : (
                            <div className="card-photo-more card-photo-more--empty">{t('noPhotos')}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AppFooter />

      {modalItem && (
        <PublicItemDetailModal item={modalItem} onClose={() => setModalItem(null)} />
      )}
    </div>
  );
}

export default PublicRoadmap;
