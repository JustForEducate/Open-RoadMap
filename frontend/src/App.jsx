import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorProvider } from './context/ErrorContext';
import GlobalErrorBanner from './components/GlobalErrorBanner';
import PublicRoadmap from './pages/PublicRoadmap';
import PublicItemView from './pages/PublicItemView';
import AdminLayout from './pages/AdminLayout';

function App() {
  return (
    <BrowserRouter>
      <ErrorProvider>
        <GlobalErrorBanner />
        <Routes>
          <Route path="/" element={<PublicRoadmap />} />
          <Route path="/item/:id" element={<PublicItemView />} />
          <Route path="/admin" element={<AdminLayout />} />
        </Routes>
      </ErrorProvider>
    </BrowserRouter>
  );
}

export default App;
