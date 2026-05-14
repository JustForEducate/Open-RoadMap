import { useI18n } from '../context/I18nContext';

function ColumnSkeleton() {
  return (
    <div className="stage-column skeleton-column" aria-hidden="true">
      <div className="stage-header">
        <div className="skeleton-block skeleton-led" />
        <div className="skeleton-block skeleton-title" />
        <div className="skeleton-block skeleton-count" />
      </div>
      <div className="stage-content">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-block skeleton-btn" />
      </div>
    </div>
  );
}

function RoadmapGridSkeleton() {
  const { t } = useI18n();
  return (
    <div className="roadmap-grid roadmap-grid-skeleton" aria-busy="true" aria-label={t('skeleton.roadmap')}>
      <ColumnSkeleton />
      <ColumnSkeleton />
      <ColumnSkeleton />
      <ColumnSkeleton />
    </div>
  );
}

export default RoadmapGridSkeleton;
