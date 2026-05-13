import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { apiJson } from '../api';
import { useErrorReporting } from '../context/ErrorContext';
import AppFooter from '../components/AppFooter';
import RoadmapGridSkeleton from '../components/RoadmapGridSkeleton';
import PublicItemDetailModal from '../components/PublicItemDetailModal';

const STAGES = [
  { id: 1, name: 'В планах', color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
  { id: 2, name: 'В разработке', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  { id: 3, name: 'Готово ждёт релиз', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' },
  { id: 4, name: 'Реализовано', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.1)' }
];

function PublicRoadmap() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState(null);
  const { reportError } = useErrorReporting();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await apiJson('/api/items');
      setItems(data);
    } catch (err) {
      reportError(err);
    } finally {
      setLoading(false);
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
          <span className="status-dot" aria-hidden="true" />
          <span>{loading ? 'ЗАГРУЗКА…' : 'СИСТЕМА ОНЛАЙН'}</span>
        </div>

        <div className="header-actions">
          <Link to="/admin" className="btn">
            <Shield size={16} aria-hidden="true" />
            Админка
          </Link>
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <RoadmapGridSkeleton />
        ) : (
          <div className="roadmap-grid">
            {STAGES.map((stage) => (
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
                      <p>Нет элементов</p>
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
                        aria-label={`Открыть: ${item.title}`}
                      >
                        <div className="card-title">{item.title}</div>
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
                            <div className="card-photo-more">Нет фото</div>
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
