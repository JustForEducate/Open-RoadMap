import { useState, useEffect } from 'react';
import StageColumn from '../components/StageColumn.jsx';
import { LogOut, RefreshCw } from 'lucide-react';
import { apiJson } from '../../../shared/api/client.js';
import { useErrorReporting } from '../../../shared/context/ErrorContext.jsx';
import { useI18n } from '../../../shared/context/I18nContext.jsx';
import { formatClockTime } from '../../../shared/lib/formatTime.js';
import AppFooter from '../../../shared/ui/AppFooter.jsx';
import LanguageSwitcher from '../../../shared/ui/LanguageSwitcher.jsx';

function Roadmap({ stages, items, onRefresh, onLogout, loading }) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { reportError } = useErrorReporting();
  const { t, locale } = useI18n();

  useEffect(() => {
    if (loading) return;
    setLastUpdated(formatClockTime(new Date(), locale));
  }, [items, loading, locale]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" aria-hidden="true" />
        <div className="loading-text">{t('loading.data')}</div>
      </div>
    );
  }

  const getItemsByStage = (stageId) => {
    return items.filter((item) => item.stage === stageId);
  };

  const handleCreateItem = async (stageId) => {
    try {
      await apiJson('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: t('newItemTitle'),
          description: '',
          stage: stageId
        })
      });
      await onRefresh();
    } catch (err) {
      reportError(err);
    }
  };

  const handleDragStart = (item) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = async (targetStageId) => {
    if (!draggedItem || draggedItem.stage === targetStageId) {
      setDraggedItem(null);
      return;
    }

    try {
      await apiJson(`/api/items/${draggedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStageId })
      });
      await onRefresh();
    } catch (err) {
      reportError(err);
    }
    setDraggedItem(null);
  };

  const handleHeaderRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogoutClick = () => {
    if (typeof window !== 'undefined' && !window.confirm(t('logoutConfirm'))) return;
    onLogout();
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
            <span>{t('status.editMode')}</span>
          </div>
          {lastUpdated && (
            <span className="header-updated">{t('lastUpdated', { time: lastUpdated })}</span>
          )}
        </div>

        <div className="header-actions">
          <LanguageSwitcher />
          <button
            type="button"
            className="btn btn-icon-only"
            onClick={handleHeaderRefresh}
            disabled={refreshing}
            aria-label={t('refresh.aria')}
            aria-busy={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'icon-spin' : ''} aria-hidden="true" />
          </button>
          <button type="button" className="btn btn-danger" onClick={handleLogoutClick}>
            <LogOut size={16} aria-hidden="true" />
            {t('logout')}
          </button>
        </div>
      </header>

      <main id="main-content" className="main-content" tabIndex={-1}>
        <div className="roadmap-grid">
          {stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              items={getItemsByStage(stage.id)}
              stages={stages}
              onCreateItem={() => handleCreateItem(stage.id)}
              onRefresh={onRefresh}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={() => handleDrop(stage.id)}
              isDragging={draggedItem !== null}
            />
          ))}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

export default Roadmap;
