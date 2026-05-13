import { useState } from 'react';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { apiJson } from '../api';
import { useErrorReporting } from '../context/ErrorContext';
import ItemModal from './ItemModal';
import PhotoModal from './PhotoModal';

function RoadmapCard({ item, stages, onRefresh, onDragStart, onDragEnd }) {
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const { reportError } = useErrorReporting();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('Удалить элемент?')) return;

    try {
      await apiJson(`/api/items/${item.id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      reportError(err);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowItemModal(true);
  };

  const handleCardClick = () => {
    setShowPhotoModal(true);
  };

  const handleDragStartEvent = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
    e.currentTarget.classList.add('dragging');
    if (onDragStart) onDragStart(item);
  };

  const handleDragEndEvent = (e) => {
    e.currentTarget.classList.remove('dragging');
    if (onDragEnd) onDragEnd();
  };

  return (
    <>
      <div
        className="card card-draggable"
        draggable="true"
        onDragStart={handleDragStartEvent}
        onDragEnd={handleDragEndEvent}
      >
        <div className="drag-handle" aria-hidden="true">
          <GripVertical size={14} />
        </div>

        <div
          className="card-content"
          onClick={handleCardClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCardClick();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Открыть фото: ${item.title}`}
        >
          <div className="card-title">{item.title}</div>
          {item.description && <div className="card-description">{item.description}</div>}

          <div className="card-photos">
            {item.photos && item.photos.length > 0 ? (
              <>
                {item.photos.slice(0, 3).map((photo) => (
                  <img key={photo.id} src={photo.url} alt="" className="card-photo-thumb" />
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

        <div className="card-actions">
          <button
            type="button"
            className="card-action-btn edit"
            onClick={handleEdit}
            aria-label={`Редактировать: ${item.title}`}
          >
            <Pencil size={12} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="card-action-btn"
            onClick={handleDelete}
            aria-label={`Удалить: ${item.title}`}
          >
            <Trash2 size={12} aria-hidden="true" />
          </button>
        </div>
      </div>

      {showItemModal && (
        <ItemModal
          item={item}
          stages={stages}
          onClose={() => setShowItemModal(false)}
          onSave={() => {
            setShowItemModal(false);
            onRefresh();
          }}
        />
      )}

      {showPhotoModal && (
        <PhotoModal
          item={item}
          onClose={() => setShowPhotoModal(false)}
          onUpdate={() => onRefresh()}
        />
      )}
    </>
  );
}

export default RoadmapCard;
