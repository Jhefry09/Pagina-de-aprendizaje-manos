import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressTable from "../../components/ProgressTable";
import { numbersData } from "../../data/progressData";

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
    <div className="w-full pt-20 pb-6 px-6">
      {/* Two Column Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
        
        {/* Left Column - Main Content */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Header with Title */}
          <div className="mb-12">
            <div className="text-left">
              <h2 className="global-title-dark mb-2 text-3xl font-bold">Números</h2>
              <p className="global-body-text-dark text-lg">
                Aprende todos los números del 0 al 9 con tutoriales paso a paso y prácticas guiadas.
              </p>
            </div>
          </div>

          {/* Sección de Números */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🔢</span>
              Números (0-9)
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {numbers.map((number) => {
                const imageUrl = numberImages[number];
                return (
                  <div
                    key={number}
                    className={`sign-card cursor-pointer transition-all duration-300 hover:scale-110 ${
                      selected === number ? 'ring-4 ring-emerald-500 ring-offset-2 scale-105' : ''
                    }`}
                    onClick={() => setSelected(number)}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`${number} en señas`}
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No img</span>
                      </div>
                    )}
                    <span className="sign-letter">
                      {number}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sección de Operaciones */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">➕</span>
              Operaciones Matemáticas
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {operations.map((operation) => {
                const imageUrl = numberImages[operation];
                const operationLabels: Record<string, string> = {
                  'mas': '+',
                  'menos': '-',
                  'mult': '×',
                  'div': '÷'
                };
                return (
                  <div
                    key={operation}
                    className={`sign-card cursor-pointer transition-all duration-300 hover:scale-110 ${
                      selected === operation ? 'ring-4 ring-emerald-500 ring-offset-2 scale-105' : ''
                    }`}
                    onClick={() => setSelected(operation)}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`${operation} en señas`}
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No img</span>
                      </div>
                    )}
                    <span className="sign-letter">
                      {operationLabels[operation] || operation}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Progress Panel */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ProgressTable 
            items={numbersData}
            title="Progreso de Números"
            icon="🔢"
            type="numeros"
            actionButton={{
              label: "Realizar Operaciones",
              onClick: () => navigate('/numeros')
            }}
          />
        </div>
      </div>
    </div>
  );
}
