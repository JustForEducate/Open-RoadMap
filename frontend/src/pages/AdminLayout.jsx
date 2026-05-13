import { useState, useEffect } from 'react';
import Roadmap from './Roadmap';
import AdminAuth from '../components/AdminAuth';
import { apiJson } from '../api';
import { useErrorReporting } from '../context/ErrorContext';
import RoadmapGridSkeleton from '../components/RoadmapGridSkeleton';

const STAGES = [
  { id: 1, name: 'В планах', color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
  { id: 2, name: 'В разработке', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  { id: 3, name: 'Готово ждёт релиз', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' },
  { id: 4, name: 'Реализовано', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.1)' }
];

function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { reportError } = useErrorReporting();

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
            <span>ЗАГРУЗКА…</span>
          </div>
          <div className="header-actions" />
        </header>
        <main className="main-content">
          <RoadmapGridSkeleton />
        </main>
      </div>
    );
  }

  return (
    <Roadmap stages={STAGES} items={items} onRefresh={fetchItems} onLogout={handleLogout} />
  );
}

export default AdminLayout;
