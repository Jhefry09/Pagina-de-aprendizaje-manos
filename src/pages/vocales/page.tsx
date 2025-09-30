import aImg from "../../assets/a-sena.png";
import eImg from "../../assets/e-sena.png";
import iImg from "../../assets/i-sena.png";
import oImg from "../../assets/o-sena.png";
import uImg from "../../assets/u-sena.png";
import { Link } from "react-router-dom";
import ProgressTable from "../../components/ProgressTable";
import { vowelsData } from "../../data/progressData";

export default function Vocales() {
  const vocales = [
    { letra: "A", img: aImg },
    { letra: "E", img: eImg },
    { letra: "I", img: iImg },
    { letra: "O", img: oImg },
    { letra: "U", img: uImg },
  ];

  return (
    <div className="w-full pt-20 pb-6 px-6">
      {/* Two Column Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
        
        {/* Left Column - Main Content */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Header with Title and Button */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
            {/* Title aligned to left */}
            <div className="text-left">
              <h2 className="global-title-dark mb-2 text-3xl font-bold">Vocales</h2>
              <p className="global-body-text-dark text-lg">
                Domina las vocales en lengua de señas con ejercicios interactivos y prácticos.
              </p>
            </div>
            
            {/* Button aligned to right */}
            <div className="flex-shrink-0">
              <Link to="/vocales-practica/a">
                <button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg global-body-text transition-all duration-300 hover:scale-105">
                  Comenzar Práctica
                </button>
              </Link>
            </div>
          </div>

          {/* Tarjetas de vocales */}
          <div className="flex justify-center gap-8 flex-wrap">
            {vocales.map((v) => (
              <div
                key={v.letra}
                className="sign-card hover:scale-110 transition-all duration-300"
              >
                <img
                  src={v.img}
                  alt={`${v.letra} en señas`}
                  className="w-20 h-20 object-contain"
                />
                <span className="sign-letter">
                  {v.letra}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Progress Panel */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ProgressTable 
            items={vowelsData}
            title="Progreso de Vocales"
            icon="🔤"
            type="vocales"
          />
        </div>
      </div>
    </div>
  );
}
