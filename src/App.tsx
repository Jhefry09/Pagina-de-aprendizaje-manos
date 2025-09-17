import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { TransitionProvider } from './contexts/TransitionProvider';
import Sidebar from './components/Sidebar';
import HomePage from './pages/Home/Page';
import TrainingPage from './pages/Training/Page';
import PracticePage from './pages/Practice/Page';
import { AnimatePresence } from 'framer-motion';

const AppContent = () => {
  const location = useLocation();
  
  return (
    <div className="flex min-h-screen bg-[#e0e0e0] font-roboto text-gray-800">
      <Sidebar />
      <main className="flex-grow p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/practice/:vocal" element={<PracticePage />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <TransitionProvider>
        <AppContent />
      </TransitionProvider>
    </Router>
  );
};

export default App;