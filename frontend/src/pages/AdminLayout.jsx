import { useState, useEffect } from 'react';
import Roadmap from './Roadmap';
import AdminAuth from '../components/AdminAuth';
import { apiJson } from '../api';
import { useErrorReporting } from '../context/ErrorContext';
import { useI18n } from '../context/I18nContext';
import RoadmapGridSkeleton from '../components/RoadmapGridSkeleton';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useStages } from '../hooks/useStages';

function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { reportError } = useErrorReporting();
  const { t } = useI18n();
  const stages = useStages();

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    setIsAdmin(adminLoggedIn);
    if (adminLoggedIn) fetchItems();
    else setLoading(false);
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

  const handleLogin = () => {
    setIsAdmin(true);
    localStorage.setItem('adminLoggedIn', 'true');
    setLoading(true);
    fetchItems();
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.setItem('adminLoggedIn', 'false');
  };

  if (!isAdmin) {
    return <AdminAuth onLogin={handleLogin} />;
  }

  if (loading) {
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
            <span>{t('loading.short')}</span>
          </div>
          <div className="header-actions">
            <LanguageSwitcher />
          </div>
        </header>
        <main className="main-content">
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
