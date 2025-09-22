import React from 'react';
import { useNavigate } from 'react-router-dom';

const Page = () => {
  const navigate = useNavigate();
  
  const handleModuleClick = (moduleId: string) => {
    // Mapeo de módulos a sus rutas correspondientes
    const moduleRoutes: { [key: string]: string } = {
      'vocales': '/practice/vocales',
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
      icon: <img src="/images/vocales.png" alt="Vocales" className="w-32 h-32 md:w-40 md:h-40 object-contain" />,
    },
    {
      id: 'abecedario',
      title: 'ABECEDARIO',
      description: 'Aprende el abecedario en lengua de señas de forma fácil y divertida.',
      color: 'from-teal-400 to-teal-500',
      icon: <img src="/images/abecedario.png" alt="Abecedario" className="w-32 h-32 md:w-40 md:h-40 object-contain" />,
    },
    {
      id: 'numeros',
      title: 'NÚMEROS',
      description: 'Aprende los números en lengua de señas y mejora tu comunicación.',
      color: 'from-amber-400 to-amber-500',
      icon: <img src="/images/numeros.png" alt="Números" className="w-32 h-32 md:w-40 md:h-40 object-contain" />,
    },
    {
      id: 'formar-palabras',
      title: 'FORMAR PALABRAS',
      description: 'Aprende a formar palabras completas en lengua de señas.',
      color: 'from-indigo-400 to-indigo-500',
      icon: <img src="/images/palabras.png" alt="Formar Palabras" className="w-32 h-32 md:w-40 md:h-40 object-contain" />,
    },
    {
      id: 'operaciones-matematicas',
      title: 'OPERACIONES MATEMÁTICAS',
      description: 'Aprende a realizar operaciones matemáticas en lengua de señas.',
      color: 'from-purple-400 to-purple-500',
      icon: <img src="/images/operaciones-matematicas.png" alt="Operaciones Matemáticas" className="w-32 h-32 md:w-40 md:h-40 object-contain" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 w-full">
        {/* Hero Section - Minimalista */}
        <section className="bg-white py-12 mb-12 rounded-xl shadow-sm border border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Aprende lengua de señas con nosotros
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Descubre una forma sencilla y accesible de aprender lengua de señas a tu propio ritmo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="#modulos" 
                className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors w-full sm:w-auto text-center shadow-sm"
              >
                Comenzar ahora
              </a>
              <a 
                href="#tutorial" 
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto text-center"
              >
                Ver demostración
              </a>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section id="modulos" className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Nuestros Módulos Educativos</h2>
            <div className="w-20 h-1 bg-blue-500 mx-auto rounded-full"></div>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Selecciona un módulo para comenzar tu aprendizaje en lengua de señas de manera interactiva y divertida.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 sm:gap-8 w-full">
            {modules.map((module) => (
              <div
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className={`group relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col h-full border border-gray-100 cursor-pointer`}
              >
                {/* Decorative accent */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${module.color}`}></div>
                
                <div className="p-6 sm:p-8 text-center flex flex-col items-center flex-grow w-full">
                  {/* Module Icon */}
                  <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-inner w-full max-w-[180px] mx-auto">
                    <div className="relative w-full h-full flex items-center justify-center">
                      {React.cloneElement(module.icon, {
                        className: "w-full h-auto max-h-32 object-contain"
                      })}
                      <div className={`absolute -inset-1 bg-gradient-to-r ${module.color} rounded-full blur opacity-20 group-hover:opacity-30 transition-all duration-300`}></div>
                    </div>
                  </div>
                  
                  {/* Module Title & Description */}
                  <h3 className="text-lg font-bold text-gray-800 mb-3">{module.title}</h3>
                  <p className="text-sm text-gray-600 mb-6 flex-grow px-2 leading-relaxed">
                    {module.description}
                  </p>
                  
                  {/* Action Button */}
                  <div
                    className={`mt-auto w-full py-2.5 px-4 text-sm font-medium text-white text-center rounded-lg transition-all duration-300 transform hover:scale-105 bg-gradient-to-r ${module.color} hover:shadow-md`}
                  >
                    Comenzar ahora
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden mb-12 border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 md:p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">¿Listo para aprender de verdad?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Únete a nuestra comunidad de aprendizaje y lleva tus habilidades al siguiente nivel con contenido exclusivo.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href="#registro" 
                className="inline-flex items-center justify-center bg-white text-blue-700 hover:bg-gray-100 font-medium py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Crear cuenta gratis
              </a>
              <a 
                href="/demo" 
                className="inline-flex items-center justify-center bg-transparent hover:bg-white/10 text-white font-medium py-3 px-8 rounded-full border border-white/20 transition-all duration-300"
              >
                Ver demostración
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Page;