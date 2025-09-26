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
import RegistroPage from "./pages/Registro/page";
import NumerosPage from "./pages/numeros/page";
import { AnimatePresence } from "framer-motion";

const AppContent = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isTrainingPage = location.pathname.startsWith('/training');
  const isPracticePage = location.pathname.startsWith('/practice');
  const isNumerosPage = location.pathname.startsWith('/numeros');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/registro';
  
  const activeLink = isHomePage ? 'inicio' : isTrainingPage ? 'clases' : isPracticePage ? 'practicar' : isNumerosPage ? 'numeros' : '';

  // Rutas de autenticación sin layout principal
  if (isAuthPage) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
        </Routes>
      </AnimatePresence>
    );
  }

  // Rutas principales con layout normal
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <Navbar activeLink={activeLink} />
      <main className="pt-20 md:pt-24">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/practice/:moduleType" element={<PracticePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/numeros" element={<NumerosPage />} />
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
