import aImg from "../../assets/a-sena.png";
import eImg from "../../assets/e-sena.png";
import iImg from "../../assets/i-sena.png";
import oImg from "../../assets/o-sena.png";
import uImg from "../../assets/u-sena.png";
import { useNavigate } from "react-router-dom";

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
    <div className="w-full flex flex-col items-center justify-center pt-20 pb-6 gap-6">
      
      {/* Caja superior */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 w-[800px] text-center">
        <h2 className="global-title-dark mb-2">Sección de Vocales</h2>
        <p className="global-body-text-dark">
          Domina las vocales en lengua de señas con ejercicios interactivos y prácticos.
        </p>
      </div>

      {/* Caja inferior */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 w-[800px] text-center">
        <h3 className="text-xl font-semibold mb-6 text-gray-800">Selecciona una vocal para practicar</h3>
        
        {/* Tarjetas de vocales */}
        <div className="flex justify-center gap-8">
          {vocales.map((v) => (
            <div
              key={v.letra}
              className="sign-card cursor-pointer transform transition-transform hover:scale-105"
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
    </div>
  );
}
