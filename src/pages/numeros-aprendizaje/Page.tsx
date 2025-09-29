import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Cargar todas las imágenes de src/assets/numeros
const images = import.meta.glob("../../assets/numeros/*-sena.png", { eager: true }) as Record<
  string,
  { default: string }
>;

// Crear un diccionario { 0: url, 1: url, ... 9: url, div: url, ... }
const numberImages: Record<string, string> = {};

Object.entries(images).forEach(([path, mod]) => {
  const match = path.match(/(\w+)-sena\.png$/i);
  if (match) {
    const key = match[1]; // "0", "1", ..., "9", "div", "mas", "mult", "menos"
    numberImages[key] = mod.default;
  }
});

// Lista de números del 0 al 9
const numbers = Array.from({ length: 10 }, (_, i) => i.toString());

// Lista de operaciones
const operations = ["div", "mas", "mult", "menos"];

export default function Page() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="w-full flex flex-col items-center justify-center pt-20 pb-6 gap-6">
      
      {/* Caja superior */}
      <div className="bg-white/95 rounded-lg shadow-xl p-8 w-[900px] text-center">
        <h2 className="text-2xl font-bold mb-2">Sección de Números</h2>
        <p className="text-gray-700">
          Aprende todos los números del 1 al 10 con tutoriales paso a paso y prácticas guiadas.
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
            onClick={() => navigate('/numeros')}
            className="bg-gradient-to-b from-[#125C7C] to-[#071939] hover:opacity-90 text-white font-semibold px-6 py-2 rounded-md shadow global-body-text"
          >
            Realizar Operaciones
          </button>
        </div>

        {/* Grid de números */}
        <div className="grid grid-cols-5 gap-6 justify-items-center">
          {numbers.map((num) => (
            <div
              key={num}
              className="sign-card"
              onClick={() => setSelected(num)}
            >
              <img
                src={numberImages[num]}
                alt={`Número ${num} en señas`}
                className="w-20 h-20 object-contain"
              />
              <span className="sign-letter">{num}</span>
            </div>
          ))}
        </div>

        {/* Grid de operaciones (solo imágenes, sin texto) */}
        <div className="grid grid-cols-4 gap-6 justify-items-center">
          {operations.map((op) => (
            <div
              key={op}
              className="bg-gradient-to-b from-[#DA8739] to-[#7A491B] rounded-lg p-4 w-32 h-32 flex items-center justify-center shadow-md hover:scale-105 transition cursor-pointer"
              onClick={() => setSelected(op)}
            >
              <img
                src={numberImages[op]}
                alt={`${op} en señas`}
                className="w-20 h-20 object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm">
            <h2 className="text-xl font-bold mb-4">Número {selected}</h2>
            <img
              src={numberImages[selected]}
              alt={`${selected} en señas`}
              className="w-32 h-32 mx-auto mb-4"
            />
            <p className="text-gray-600 mb-4">
              Posición de la mano para el número {selected}.
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
