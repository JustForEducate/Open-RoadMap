import { useState, useEffect } from 'react';
import Roadmap from '../../roadmap/pages/Roadmap.jsx';
import AdminAuth from '../components/AdminAuth.jsx';
import { apiJson } from '../../../shared/api/client.js';
import { useErrorReporting } from '../../../shared/context/ErrorContext.jsx';
import { useI18n } from '../../../shared/context/I18nContext.jsx';
import RoadmapGridSkeleton from '../../roadmap/components/RoadmapGridSkeleton.jsx';
import LanguageSwitcher from '../../../shared/ui/LanguageSwitcher.jsx';
import { useStages } from '../../roadmap/hooks/useStages.js';

function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { reportError } = useErrorReporting();
  const { t } = useI18n();
  const stages = useStages();

  const [checking, setChecking] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    apiJson('/api/auth/session', { signal: controller.signal }).then(async ({ authenticated }) => {
      setIsAdmin(authenticated);
      if (authenticated) await fetchItems();
      else setLoading(false);
    }).catch((error) => { if (error.name !== 'AbortError') reportError(error); })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    const expire = () => { setIsAdmin(false); setItems([]); };
    window.addEventListener('roadmap:session-expired', expire);
    return () => { controller.abort(); window.removeEventListener('roadmap:session-expired', expire); };
  }, []);

  const fetchItems = async () => {
    try {
      const data = await apiJson('/api/items');
      setItems(data);
      setFailed(false);
      return true;
    } catch (err) {
      setFailed(true);
      reportError(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAdmin(true);
    setLoading(true);
    fetchItems();
  };

  const handleLogout = async () => {
    try {
      await apiJson('/api/auth/logout', { method: 'POST' });
      setIsAdmin(false);
      setItems([]);
    } catch (error) { reportError(error); }
  };

  if (checking) return <main id="main-content" className="loading-container" tabIndex={-1}>{t('loading.short')}</main>;

  if (!isAdmin) {
    return <AdminAuth onLogin={handleLogin} />;
  }

  if (failed && !items.length && isAdmin) return <main id="main-content" className="loading-container" tabIndex={-1}><p>{t('error.loadFailed')}</p><button className="btn" onClick={fetchItems}>{t('retry')}</button><button className="btn" onClick={handleLogout}>{t('logout')}</button></main>;

  if (loading) {
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
              <span>{t('loading.short')}</span>
            </div>
          </div>
          <div className="header-actions">
            <LanguageSwitcher />
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <RoadmapGridSkeleton />
        </main>
      </div>
    );
  }

  return (
    <Roadmap stages={stages} items={items} onRefresh={fetchItems} onLogout={handleLogout} />
  );
}

export default AdminLayout;
