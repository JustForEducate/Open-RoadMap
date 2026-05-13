import { useState } from 'react';
import RoadmapCard from './RoadmapCard';
import { Plus } from 'lucide-react';

function StageColumn({ stage, items, stages, onCreateItem, onRefresh, onDragStart, onDragEnd, onDrop, isDragging }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDropEvent = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop();
  };

  return (
    <div 
      className={`stage-column ${isDragOver ? 'drag-over' : ''} ${isDragging ? 'dragging-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropEvent}
    >
      <div className="stage-header">
        <div 
          className="stage-led" 
          style={{ backgroundColor: stage.color, color: stage.color }}
        ></div>
        <span className="stage-title">{stage.name}</span>
        <span className="stage-count">{items.length}</span>
      </div>
      
      <div className="stage-content">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            {isDragging ? (
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--accent-nato-glow)' }}>
                Отпустите здесь
              </p>
            ) : (
              <p>Нет элементов</p>
            )}
          </div>
        ) : (
          items.map((item) => (
            <RoadmapCard
              key={item.id}
              item={item}
              stages={stages}
              onRefresh={onRefresh}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
        
        {isDragging && items.length > 0 && (
          <div className="drop-hint">Отпустите здесь</div>
        )}
        
        <button type="button" className="stage-add-btn" onClick={onCreateItem}>
          <Plus size={16} />
          Добавить элемент
        </button>
      </div>
    </div>
  );
}

export default StageColumn;
