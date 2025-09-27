import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { TransitionProvider } from "./contexts/TransitionProvider";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/Home/Page";
import TrainingPage from "./pages/Training/Page";
import PracticePage from "./pages/PracticeWords/Page";
import DashboardPage from "./pages/Dashboard/Page";
import LoginPage from "./pages/Login/Page";
import WelcomePage from "./pages/Welcome/Page";
import { AnimatePresence } from "framer-motion";

const AppContent = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isTrainingPage = location.pathname.startsWith('/training');
  const isPracticePage = location.pathname.startsWith('/practice');
  
  const activeLink = isHomePage ? 'inicio' : isTrainingPage ? 'clases' : isPracticePage ? 'practicar' : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <Navbar activeLink={activeLink} />
      <main className="pt-20 md:pt-24">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/practice/:moduleType" element={<PracticePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <TransitionProvider>
          <AppContent />
        </TransitionProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
