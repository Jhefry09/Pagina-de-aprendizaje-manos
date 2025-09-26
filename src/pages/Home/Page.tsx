// import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { AuthContextType } from '../../contexts/auth-context';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const Page = () => {
  const navigate = useNavigate();
  const auth = useAuth() as AuthContextType;
  const greeting = getGreeting();
  
  const handleModuleClick = (moduleId: string) => {
    // Mapeo de módulos a sus rutas correspondientes
    const moduleRoutes: { [key: string]: string } = {
      'vocales': '/vocales',
      'abecedario': '/practice/abecedario',
      'numeros': '/practice/numeros',
      'formar-palabras': '/practice/palabras',
      'operaciones-matematicas': '/practice/matematicas'
    };
    
    const route = moduleRoutes[moduleId] || '/training';
    navigate(route);
  };
  const modules = [
    {
      id: 'vocales',
      title: 'VOCALES',
      description: 'Domina las vocales en lengua de señas con ejercicios interactivos y prácticos.',
      color: 'from-blue-400 to-blue-500',
      icon: '/images/vocales.png'
    },
    {
      id: 'abecedario',
      title: 'ABECEDARIO',
      description: 'Aprende el abecedario en lengua de señas de forma fácil y divertida.',
      color: 'from-teal-400 to-teal-500',
      icon: '/images/abecedario.png'
    },
    {
      id: 'numeros',
      title: 'NÚMEROS',
      description: 'Aprende los números en lengua de señas y mejora tu comunicación.',
      color: 'from-amber-400 to-amber-500',
      icon: '/images/numeros.png'
    },
    {
      id: 'formar-palabras',
      title: 'FORMAR PALABRAS',
      description: 'Aprende a formar palabras completas en lengua de señas.',
      color: 'from-indigo-400 to-indigo-500',
      icon: '/images/palabras.png'
    },
    {
      id: 'operaciones-matematicas',
      title: 'OPERACIONES MATEMÁTICAS',
      description: 'Aprende a realizar operaciones matemáticas en lengua de señas.',
      color: 'from-purple-400 to-purple-500',
      icon: '/images/operaciones-matematicas.png'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 w-full">
        {/* Hero Section - Minimalista */}
        <section className="bg-white py-8 sm:py-12 mb-8 sm:mb-12 rounded-xl shadow-sm border border-gray-100 mx-2 sm:mx-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4 sm:mb-6">
              <span className="text-2xl">👋</span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                {greeting}, {auth.user?.name || 'Aprendiz'}
              </h1>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Aprende lengua de señas con nosotros
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Descubre una forma sencilla y accesible de aprender lengua de señas a tu propio ritmo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md mx-auto">
              <a 
                href="#modulos" 
                className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors text-center shadow-sm text-sm sm:text-base"
              >
                Comenzar ahora
              </a>
              <a 
                href="#tutorial" 
                className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-center text-sm sm:text-base"
              >
                Ver demostración
              </a>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section id="modulos" className="mb-12 sm:mb-16 px-2 sm:px-0">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">Nuestros Módulos Educativos</h2>
            <div className="w-16 sm:w-20 h-1 bg-blue-500 mx-auto rounded-full"></div>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
              Selecciona un módulo para comenzar tu aprendizaje en lengua de señas de manera interactiva y divertida.
            </p>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6 w-full">
            {modules.map((module) => (
              <div
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className="group relative bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col h-full border border-gray-100 cursor-pointer hover:ring-1 hover:ring-opacity-20 hover:ring-offset-1 hover:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleModuleClick(module.id);
                  }
                }}
              >
                {/* Decorative accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r ${module.color}`}></div>
                
                <div className="p-4 sm:p-5 md:p-6 text-center flex flex-col items-center flex-grow w-full">
                  {/* Module Icon */}
                  <div className="mb-4 sm:mb-5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-inner w-full max-w-[140px] sm:max-w-[160px] mx-auto transform transition-transform duration-300 group-hover:scale-105">
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img 
                        src={module.icon} 
                        alt={module.title}
                        className="w-full h-auto max-h-24 sm:max-h-28 object-contain transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className={`absolute -inset-1 bg-gradient-to-r ${module.color} rounded-full blur opacity-20 group-hover:opacity-40 transition-all duration-300`}></div>
                    </div>
                  </div>
                  
                  {/* Module Title & Description */}
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3 group-hover:text-gray-900 transition-colors duration-200 line-clamp-2 h-12 sm:h-14 flex items-center justify-center">
                    {module.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 flex-grow px-1 leading-relaxed line-clamp-3">
                    {module.description}
                  </p>
                  
                  {/* Action Button */}
                  <div
                    className={`mt-auto w-full py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-medium text-white text-center rounded-lg sm:rounded-lg transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-r ${module.color} hover:shadow-md group-hover:shadow-lg group-hover:opacity-90`}
                    aria-label={`Comenzar módulo de ${module.title}`}
                  >
                    Comenzar ahora
                  </div>
                </div>
                
                {/* Hover effect */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none`}></div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Page;
