import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useI18n } from './context/I18nContext';
import GlobalErrorBanner from './components/GlobalErrorBanner';
import PublicRoadmap from './pages/PublicRoadmap';
import PublicItemView from './pages/PublicItemView';
import AdminLayout from './pages/AdminLayout';

function SkipToMain() {
  const { t } = useI18n();
  return (
    <a href="#main-content" className="skip-to-main">
      {t('skipToMain')}
    </a>
  );
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
