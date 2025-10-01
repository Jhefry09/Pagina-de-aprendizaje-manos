import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVoice } from "../../hooks/useVoice";

interface UserData {
  usuario: string;
  name: string;
  id: number;
  rol: string;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

const Page = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const greeting = getGreeting();

  // Inicializar hook de voz con español
  const { speak } = useVoice({ lang: "es-ES" });

  // Cargar datos del usuario desde localStorage y escuchar cambios
  useEffect(() => {
    const loadUserData = () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
          console.error("Error al parsear datos del usuario:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUserData();

    setTimeout(() => {
      setIsLoading(false);
    }, 100);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        loadUserData();
      }
    };

    const handleLocalStorageUpdate = () => {
      loadUserData();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userDataUpdated", handleLocalStorageUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userDataUpdated", handleLocalStorageUpdate);
    };
  }, []);

  const handleModuleClick = (moduleId: string) => {
    const moduleMessages: { [key: string]: string } = {
      vocales:
        "Iniciando módulo de vocales. Aprende las vocales en lengua de señas.",
      abecedario:
        "Iniciando módulo de abecedario. Aprende todas las letras en lengua de señas.",
      numeros:
        "Iniciando módulo de números. Aprende los números en lengua de señas.",
      "formar-palabras":
        "Iniciando módulo de formar palabras. Aprende a combinar letras para formar palabras.",
      "operaciones-matematicas":
        "Iniciando módulo de operaciones matemáticas. Aprende operaciones en lengua de señas.",
    };

    const message = moduleMessages[moduleId] || "Iniciando módulo educativo.";
    speak(message);

    const moduleRoutes: { [key: string]: string } = {
      vocales: "/vocales",
      abecedario: "/abecedario",
      numeros: "/numeros-aprendizaje",
      "formar-palabras": "/practice/palabras",
      "operaciones-matematicas": "/numeros",
    };

    const route = moduleRoutes[moduleId] || "/training";
    navigate(route);
  };

  const modules = [
    {
      id: "vocales",
      title: "VOCALES",
      description:
        "Domina las vocales en lengua de señas con ejercicios interactivos y prácticos.",
      color: "from-blue-400 to-blue-500",
      icon: "vocales.png",
    },
    {
      id: "abecedario",
      title: "ABECEDARIO",
      description:
        "Aprende el abecedario en lengua de señas de forma fácil y divertida.",
      color: "from-teal-400 to-teal-500",
      icon: "abecedario.png",
    },
    {
      id: "numeros",
      title: "NÚMEROS",
      description:
        "Aprende los números en lengua de señas y mejora tu comunicación.",
      color: "from-amber-400 to-amber-500",
      icon: "numeros.png",
    },
    {
      id: "formar-palabras",
      title: "FORMAR PALABRAS",
      description: "Aprende a formar palabras completas en lengua de señas.",
      color: "from-indigo-400 to-indigo-500",
      icon: "palabras.png",
    },
    {
      id: "operaciones-matematicas",
      title: "OPERACIONES MATEMÁTICAS",
      description:
        "Aprende a realizar operaciones matemáticas en lengua de señas.",
      color: "from-purple-400 to-purple-500",
      icon: "operaciones-matematicas.png",
    },
  ];

  const userName = user?.usuario || user?.name || "Aprendiz";

  // Mensaje de bienvenida cuando se carga la página
  useEffect(() => {
    const timer = setTimeout(() => {
      speak(
        `Página de inicio cargada. ${greeting}, ${userName}. Selecciona un módulo educativo para comenzar tu aprendizaje en lengua de señas.`
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [speak, greeting, userName]);

  return (
    <div className="w-full">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 w-full">
        <section className="mb-8 sm:mb-12 mx-2 sm:mx-0">
          <div className="bg-white/95 backdrop-blur-sm py-8 sm:py-12 rounded-2xl shadow-2xl border border-white/20 max-w-4xl mx-auto">
            <div className="px-4 sm:px-6 lg:px-8 text-center">
              <div className="flex items-center justify-center space-x-2 mb-4 sm:mb-6">
                <span className="text-2xl">👋</span>
                <h1 className="global-title-dark">
                  {greeting}, {userName}!
                </h1>
              </div>
              <p className="global-large-text-dark max-w-2xl mx-auto px-2 text-center">
                Bienvenido a <strong>SeeTalk</strong>, tu plataforma de
                aprendizaje de lengua de señas. Selecciona un módulo para
                continuar con tu progreso educativo.
              </p>
            </div>
          </div>
        </section>

        <section id="modulos" className="mb-12 sm:mb-16 px-2 sm:px-0 relative">
          <div className="relative z-10">
            <div className="text-center mb-8 sm:mb-10">
              <h2
                className="text-3xl sm:text-4xl font-bold text-white mb-2 relative z-10
                         font-sans antialiased linux-font-render"
              >
                Nuestros Módulos Educativos
              </h2>
              <div className="w-16 sm:w-20 h-1 bg-amber-400 mx-auto rounded-full shadow-lg"></div>
              <p
                className="mt-3 sm:mt-4 text-lg text-gray-200 max-w-2xl mx-auto px-2
                         font-sans antialiased"
              >
                Selecciona un módulo para comenzar tu aprendizaje en lengua de
                señas de manera interactiva y divertida.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6 w-full">
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl sm:rounded-2xl shadow-md overflow-hidden animate-pulse"
                  >
                    <div className="h-1 sm:h-1.5 bg-gray-200"></div>
                    <div className="p-4 sm:p-5 md:p-6 text-center">
                      <div className="mb-4 sm:mb-5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gray-100 w-full max-w-[140px] sm:max-w-[160px] mx-auto h-24 sm:h-28"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))
              : modules.map((module) => (
                  <div
                    key={module.id}
                    onClick={() => handleModuleClick(module.id)}
                    className="group relative bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col h-full border border-gray-100 cursor-pointer hover:ring-1 hover:ring-opacity-20 hover:ring-offset-1 hover:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleModuleClick(module.id);
                      }
                    }}
                  >
                    <div
                      className={`absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r ${module.color}`}
                    ></div>

                    <div className="p-4 sm:p-5 md:p-6 text-center flex flex-col items-center flex-grow w-full">
                      <div className="mb-4 sm:mb-5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-inner w-full max-w-[140px] sm:max-w-[160px] mx-auto transform transition-transform duration-300 group-hover:scale-105">
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img
                            src={module.icon}
                            alt={module.title}
                            className="w-full h-auto max-h-24 sm:max-h-28 object-contain transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div
                            className={`absolute -inset-1 bg-gradient-to-r ${module.color} rounded-full blur opacity-20 group-hover:opacity-40 transition-all duration-300`}
                          ></div>
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3 group-hover:text-gray-900 transition-colors duration-200 line-clamp-2 h-12 sm:h-14 flex items-center justify-center">
                        {module.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 flex-grow px-1 leading-relaxed line-clamp-3">
                        {module.description}
                      </p>

                      <div
                        className={`mt-auto w-full py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-medium text-white text-center rounded-lg sm:rounded-lg transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-r ${module.color} hover:shadow-md group-hover:shadow-lg group-hover:opacity-90`}
                        aria-label={`Comenzar módulo de ${module.title}`}
                      >
                        Comenzar ahora
                      </div>
                    </div>

                    <div
                      className={`absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none`}
                    ></div>
                  </div>
                ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Page;
