import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useI18n } from '../shared/context/I18nContext.jsx';
import GlobalErrorBanner from '../shared/ui/GlobalErrorBanner.jsx';
import PublicRoadmap from '../features/roadmap/pages/PublicRoadmap.jsx';
import PublicItemView from '../features/roadmap/pages/PublicItemView.jsx';
import AdminLayout from '../features/admin/pages/AdminLayout.jsx';

function SkipToMain() {
  const { t } = useI18n();
  return (
    <a href="#main-content" className="skip-to-main">
      {t('skipToMain')}
    </a>
  );
}

function NotFound() {
  const { t } = useI18n();
  return <main id="main-content" className="loading-container" tabIndex={-1}><h1>404</h1><Link className="btn" to="/">{t('home')}</Link></main>;
}
function App() {
  return (
    <BrowserRouter>
      <SkipToMain />
      <GlobalErrorBanner />
      <Routes>
        <Route path="/" element={<PublicRoadmap />} />
        <Route path="/item/:id" element={<PublicItemView />} />
        <Route path="/admin" element={<AdminLayout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
