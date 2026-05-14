import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, RefreshCw } from 'lucide-react';
import { apiJson } from '../api';
import { useErrorReporting } from '../context/ErrorContext';
import { useI18n } from '../context/I18nContext';
import { formatClockTime } from '../formatTime';
import AppFooter from '../components/AppFooter';
import RoadmapGridSkeleton from '../components/RoadmapGridSkeleton';
import PublicItemDetailModal from '../components/PublicItemDetailModal';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useStages } from '../hooks/useStages';

function PublicRoadmap() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const { reportError } = useErrorReporting();
  const { t, locale } = useI18n();
  const stages = useStages();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async (manual = false) => {
    if (manual) setRefreshing(true);
    else if (isFirstLoad.current) setLoading(true);

    try {
      const data = await apiJson('/api/items');
      setItems(data);
      setLastUpdated(formatClockTime(new Date(), locale));
      return true;
    } catch (err) {
      reportError(err);
      return false;
    } finally {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        setLoading(false);
      }
      setRefreshing(false);
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
            <svg width="20" height="20" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2"><text y=".9em" font-size="90">🗺️</text></svg>
          </div>
          <span className="logo-text">OpenRoadMap</span>
        </div>

        <div className="header-status">
          <div className="header-status-row">
            <span className="status-dot" aria-hidden="true" />
            <span>{loading ? t('loading.short') : t('status.online')}</span>
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
