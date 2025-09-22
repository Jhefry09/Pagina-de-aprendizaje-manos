import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { TransitionProvider } from "./contexts/TransitionProvider";
import Navbar from "./components/Navbar";
import HomePage from "./pages/Home/Page";
import TrainingPage from "./pages/Training/Page";
import PracticePage from "./pages/Practice_Words/Page";
import { AnimatePresence } from "framer-motion";

const AppContent = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isTrainingPage = location.pathname.startsWith('/training');
  const isPracticePage = location.pathname.startsWith('/practice');
  
  const activeLink = isHomePage ? 'inicio' : isTrainingPage ? 'clases' : isPracticePage ? 'practicar' : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <Navbar 
        userName="Carlos" 
        userRole="Administrador" 
        activeLink={activeLink} 
      />
      <main className="pt-20 md:pt-24">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/practice/:moduleType" element={<PracticePage />} />
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
