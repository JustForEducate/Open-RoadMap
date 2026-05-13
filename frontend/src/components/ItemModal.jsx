import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiJson } from '../api';
import { useErrorReporting } from '../context/ErrorContext';

function ItemModal({ item, stages, onClose, onSave }) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');
  const [stage, setStage] = useState(item.stage);
  const [saving, setSaving] = useState(false);
  const { reportError } = useErrorReporting();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await apiJson(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, stage })
      });
      onSave();
    } catch (err) {
      reportError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-edit-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="item-edit-modal-title" className="modal-title">
            РЕДАКТИРОВАНИЕ
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Закрыть окно редактирования"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="item-edit-title">
                Название
              </label>
              <input
                id="item-edit-title"
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="item-edit-desc">
                Описание
              </label>
              <textarea
                id="item-edit-desc"
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="item-edit-stage">
                Этап
              </label>
              <select
                id="item-edit-stage"
                className="form-select"
                value={stage}
                onChange={(e) => setStage(Number(e.target.value))}
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ItemModal;
