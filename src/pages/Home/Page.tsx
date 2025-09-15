import { Link } from 'react-router-dom';

const HomePage = () => {
  const vocals = [
    { vocal: 'A', description: 'Puño cerrado, pulgar hacia arriba.' },
    { vocal: 'E', description: 'Dedos curvados hacia la palma.' },
    { vocal: 'I', description: 'Meñique extendido, otros cerrados.' },
    { vocal: 'O', description: 'Forma circular con todos los dedos.' },
    { vocal: 'U', description: 'Índice y medio extendidos y unidos.' },
  ];

  return (
    <section className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-700 font-montserrat">¡Hola!</h1>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Nivel 1</span>
          <span className="text-gray-500 text-lg">⭐</span>
        </div>
      </div>

      <div className="mb-8 p-6 bg-white rounded-lg shadow-md flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tus Lecciones</h2>
        <Link 
          to="/dashboard" 
          className="px-4 py-2 text-sm font-semibold text-[#f2994a] hover:text-white hover:bg-[#f2994a] rounded-lg transition-all duration-300 border border-[#f2994a]"
        >
          Ver más →
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-gray-700 mb-6">Vocales</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {vocals.map((vocal) => (
          <Link
            key={vocal.vocal}
            to={`/practice/${vocal.vocal}`}
            className="block p-4 bg-white rounded-lg shadow-md transition-transform transform hover:scale-105"
          >
            {/* Aquí irán las imágenes de `src/assets`. */}
            <div className="w-full h-40 bg-gray-200 mb-4 flex items-center justify-center">
              <span className="text-5xl font-bold text-gray-500">{vocal.vocal}</span>
            </div>
            <div className="card-content">
              <h3 className="text-xl font-bold font-montserrat">{`Vocal ${vocal.vocal}`}</h3>
              <p className="text-gray-600 text-sm mt-1">{vocal.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default HomePage;