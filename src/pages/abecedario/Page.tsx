import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressTable from "../../components/ProgressTable";
import { alphabetData } from "../../data/progressData";

// Cargar todas las imágenes de src/assets/abecedario
const images = import.meta.glob("../../assets/abecedario/*-sena.png", { eager: true }) as Record<
  string,
  { default: string }
>;

// Función para obtener la imagen de una letra
function getImage(letter: string) {
  const entry = Object.entries(images).find(([path]) =>
    path.toLowerCase().includes(`${letter.toLowerCase()}-sena.png`)
  );
  return entry ? entry[1].default : "";
}

// Lista de letras
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Abecedario() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  // 🔥 NUEVA FUNCIÓN: Maneja la selección y navegación
  const handleSelectLetter = (letter: string) => {
    setSelected(letter); // Opcional, pero mantiene el resaltado visual
    // Navegar a la ruta dinámica: /practice/(la letra en minúsculas)
    navigate(`/practice/${letter.toLowerCase()}`);
  };


  return (
    <div className="w-full pt-20 pb-6 px-6">
      {/* Two Column Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
        
        {/* Left Column - Main Content */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Header with Title */}
          <div className="mb-12">
            <div className="text-left">
              <h2 className="global-title-dark mb-2 text-3xl font-bold">Abecedario</h2>
              <p className="global-body-text-dark text-lg">
                Aprende todas las letras de la A a la Z con tutoriales paso a paso y prácticas guiadas.
              </p>
            </div>
          </div>

          {/* Grid de letras */}
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-5 gap-6">
            {letters.map((letter) => {
              const imageUrl = getImage(letter);
              return (
                <div
                  key={letter}
                  className={`sign-card cursor-pointer transition-all duration-300 hover:scale-110 ${
                    selected === letter ? 'ring-4 ring-emerald-500 ring-offset-2 scale-105' : ''
                  }`}
                  // 🔥 CAMBIO CLAVE: Llama a la nueva función de manejo
                  onClick={() => handleSelectLetter(letter)} 
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`${letter} en señas`}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No img</span>
                    </div>
                  )}
                  <span className="sign-letter text-sm">
                    {letter}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Progress Panel */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ProgressTable 
            items={alphabetData}
            title="Progreso del Abecedario"
            icon="🔡"
            type="abecedario"
            actionButton={{
              label: "Formar Palabras",
              onClick: () => navigate('/practice/palabras')
            }}
          />
        </div>
      </div>
    </div>
  );
}
