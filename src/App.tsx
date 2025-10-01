import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
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
import VocalesPage from "./pages/vocales/vpage";
import AbecedarioPage from "./pages/abecedario/Page";
import NumerosAprendizajePage from "./pages/numeros-aprendizaje/Page";
import WelcomePage from "./pages/Welcome/Page";
import UserManagementPage from "./pages/gestion-usuarios/page";
import VocalStatistics from "./pages/estadisticas-entrenamiento/page";
import UserSettingsPage from "./pages/configuracion-usuario/page";
import { AnimatePresence } from "framer-motion";
import VocalPracticePage from "./pages/ParcticeVocals/Page";
import LetterPage from "./pages/practiceABC/page";
const AppContent = () => {
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/registro";
  const isWelcomePage = location.pathname === "/welcome";
  const isTrainingPage = location.pathname.startsWith("/training");
  const isNumerosPage = location.pathname.startsWith("/numeros");
  const isVocalesPage = location.pathname.startsWith("/vocales");
  const isAbecedarioPage = location.pathname.startsWith("/abecedario");
  const isGestionPage = location.pathname.startsWith("/gestion");
  const isEstadisticasPage = location.pathname.startsWith("/estadisticas");
  const isConfiguracionPage = location.pathname.startsWith("/configuracion");

  // Determinar enlace activo para navbar
  const activeLink =
    location.pathname === "/home"
      ? "inicio"
      : isTrainingPage
      ? "clases"
      : isNumerosPage
      ? "numeros"
      : isVocalesPage
      ? "vocales"
      : isAbecedarioPage
      ? "abecedario"
      : isGestionPage
      ? "gestion"
      : isEstadisticasPage
      ? "estadisticas"
      : isConfiguracionPage
      ? "configuracion"
      : "";

  // Rutas sin navbar (auth y welcome)
  if (isAuthPage || isWelcomePage) {
    return (
      <div className="min-h-screen w-full global-bg-static">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegistroPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
          </Routes>
        </AnimatePresence>
      </div>
    );
  }

  // Rutas principales con layout normal y navbar
  return (
    <div className="min-h-screen w-full global-bg-static">
      <Navbar activeLink={activeLink} />
      <main className="w-full">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/welcome" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/training" element={<TrainingPage />} />
            {/* 1. RUTA DINÁMICA DE ABECEDARIO: /practice/a, /practice/b, etc. */}
            <Route path="/practice/:vocal" element={<LetterPage />} />
            {/* 2. RUTA DE PRÁCTICA DE PALABRAS: /practice/palabras */}
            <Route path="/practice/:moduleType" element={<PracticePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/numeros" element={<NumerosPage />} />
            <Route path="/vocales" element={<VocalesPage />} />
            <Route
              path="/vocales-practica/:vocal"
              element={<VocalPracticePage />}
            />
            <Route path="/abecedario" element={<AbecedarioPage />} />
            <Route
              path="/numeros-aprendizaje"
              element={<NumerosAprendizajePage />}
            />
            <Route path="/gestion" element={<UserManagementPage />} />
            <Route path="/estadisticas" element={<VocalStatistics />} />
            <Route path="/configuracion" element={<UserSettingsPage />} />
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
