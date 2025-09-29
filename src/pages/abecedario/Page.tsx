import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

  return (
    <div className="w-full flex flex-col items-center justify-center pt-20 pb-6 gap-6">
      
      {/* Caja superior */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 w-[900px] text-center">
        <h2 className="global-title-dark mb-2">Sección de Abecedario</h2>
        <p className="global-body-text-dark">
          Aprende todas las letras de la A a la Z con tutoriales paso a paso y prácticas guiadas.
        </p>
      </div>

      {/* Caja inferior */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 w-[900px] text-center">
        {/* Botones de acción */}
        <div className="flex justify-center gap-4 mb-8">
          <button className="bg-gradient-to-b from-[#125C7C] to-[#071939] hover:opacity-90 text-white font-semibold px-6 py-2 rounded-md shadow global-body-text">
            Seleccionar
          </button>
          <button 
            onClick={() => navigate('/practice/palabras')}
            className="bg-gradient-to-b from-[#125C7C] to-[#071939] hover:opacity-90 text-white font-semibold px-6 py-2 rounded-md shadow global-body-text"
          >
            Formar Palabras
          </button>
        </div>

        {/* Grid de letras */}
        <div className="grid grid-cols-5 gap-8 justify-items-center">
          {letters.map((letter) => (
            <div
              key={letter}
              className="sign-card"
              onClick={() => setSelected(letter)}
            >
              <img
                src={getImage(letter)}
                alt={`${letter} en señas`}
                className="w-20 h-20 object-contain"
              />
              <span className="sign-letter">{letter}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm">
            <h2 className="global-subtitle-dark mb-4">Letra {selected}</h2>
            <img
              src={getImage(selected)}
              alt={`Letra ${selected} en señas`}
              className="w-32 h-32 mx-auto mb-4"
            />
            <p className="global-body-text-dark mb-4">
              Posición de la mano para la letra {selected}.
            </p>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition global-body-text"
              onClick={() => setSelected(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
