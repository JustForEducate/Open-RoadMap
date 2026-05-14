import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GlobalErrorBanner from './components/GlobalErrorBanner';
import PublicRoadmap from './pages/PublicRoadmap';
import PublicItemView from './pages/PublicItemView';
import AdminLayout from './pages/AdminLayout';

function App() {
  return (
    <BrowserRouter>
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
