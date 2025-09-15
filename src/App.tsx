import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HomePage from './pages/Home/Page';
import DashboardPage from './pages/Dashboard/Page';
import TrainingPage from './pages/Training/Page';
import PracticePage from './pages/Practice/Page';

const App = () => {
  return (
    <Router>
      <div className="flex min-h-screen bg-[#e0e0e0] font-roboto text-gray-800">
        <Sidebar />
        <main className="flex-grow p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/practice/:vocal" element={<PracticePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;