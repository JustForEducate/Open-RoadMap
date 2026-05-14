import { useState } from 'react';
import StageColumn from '../components/StageColumn';
import { LogOut, RefreshCw } from 'lucide-react';
import { apiJson } from '../api';
import { useErrorReporting } from '../context/ErrorContext';
import { useI18n } from '../context/I18nContext';
import AppFooter from '../components/AppFooter';
import LanguageSwitcher from '../components/LanguageSwitcher';

function Roadmap({ stages, items, onRefresh, onLogout, loading }) {
  const [draggedItem, setDraggedItem] = useState(null);
  const { reportError } = useErrorReporting();
  const { t } = useI18n();

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
      onRefresh();
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
      onRefresh();
    } catch (err) {
      reportError(err);
    }
    setDraggedItem(null);
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
          <span>{t('status.editMode')}</span>
        </div>

        <div className="header-actions">
          <LanguageSwitcher />
          <button
            type="button"
            className="btn"
            onClick={onRefresh}
            aria-label={t('refresh.aria')}
          >
            <RefreshCw size={16} aria-hidden="true" />
          </button>
          <button type="button" className="btn btn-danger" onClick={onLogout}>
            <LogOut size={16} aria-hidden="true" />
            {t('logout')}
          </button>
        </div>
      </header>

      <main className="main-content">
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
