import { useState } from "react";

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

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0b3c5d] to-[#0b2345] gap-6">
      
      {/* Caja superior */}
      <div className="bg-white/95 rounded-lg shadow-xl p-8 w-[900px] text-center">
        <h2 className="text-2xl font-bold mb-2">Sección de Abecedario</h2>
        <p className="text-gray-700">
          Aprende todas las letras de la A a la Z con tutoriales paso a paso y prácticas guiadas.
        </p>
      </div>

      {/* Caja inferior */}
      <div className="bg-white/95 rounded-lg shadow-xl p-8 w-[900px] text-center">
        {/* Botón principal */}
        <button className="bg-gradient-to-b from-[#125C7C] to-[#071939] hover:opacity-90 text-white font-semibold px-6 py-2 rounded-md shadow mb-8">
          Seleccionar
        </button>

        {/* Grid de letras */}
        <div className="grid grid-cols-5 gap-6 justify-items-center">
          {letters.map((letter) => (
            <div
              key={letter}
              className="bg-gradient-to-b from-[#DA8739] to-[#7A491B] rounded-lg p-4 w-32 h-40 flex flex-col items-center justify-between shadow-md hover:scale-105 transition cursor-pointer"
              onClick={() => setSelected(letter)}
            >
              <img
                src={getImage(letter)}
                alt={`${letter} en señas`}
                className="w-20 h-20 object-contain"
              />
              <span className="text-white font-bold text-xl">{letter}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm">
            <h2 className="text-xl font-bold mb-4">Letra {selected}</h2>
            <img
              src={getImage(selected)}
              alt={`Letra ${selected} en señas`}
              className="w-32 h-32 mx-auto mb-4"
            />
            <p className="text-gray-600 mb-4">
              Posición de la mano para la letra {selected}.
            </p>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
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
