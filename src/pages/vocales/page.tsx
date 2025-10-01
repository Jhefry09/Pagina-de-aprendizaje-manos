import { useNavigate } from "react-router-dom";
import aImg from "../../assets/a-sena.png";
import eImg from "../../assets/e-sena.png";
import iImg from "../../assets/i-sena.png";
import oImg from "../../assets/o-sena.png";
import uImg from "../../assets/u-sena.png";
import ProgressTable from "../../components/ProgressTable";
import { vowelsData } from "../../data/progressData";

export default function Vocales() {
  const navigate = useNavigate();
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
          {/* Header with Title */}
          <div className="mb-12">
            <div className="text-left">
              <h2 className="global-title-dark mb-2 text-3xl font-bold">Vocales</h2>
              <p className="global-body-text-dark text-lg">
                Domina las vocales en lengua de señas con ejercicios interactivos y prácticos.
              </p>
            </div>
          </div>

          {/* Tarjetas de vocales */}
          <div className="flex justify-center gap-8 flex-wrap">
            {vocales.map((v) => (
              <div
                key={v.letra}
                className="sign-card hover:scale-110 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/vocales-practica/${v.letra.toLowerCase()}`)}
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
