function ItemDetailSkeleton() {
  return (
    <main className="main-content" aria-busy="true" aria-label="Загрузка элемента">
      <div className="modal item-detail-skeleton" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="modal-header">
          <div className="skeleton-block skeleton-item-title" />
        </div>
        <div className="modal-body">
          <div className="skeleton-block skeleton-item-desc" />
          <div className="skeleton-block skeleton-item-desc short" />
          <div className="photo-gallery-skeleton">
            <div className="skeleton-block skeleton-thumb" />
            <div className="skeleton-block skeleton-thumb" />
            <div className="skeleton-block skeleton-thumb" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default ItemDetailSkeleton;
