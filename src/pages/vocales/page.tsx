import aImg from "../../assets/a-sena.png";
import eImg from "../../assets/e-sena.png";
import iImg from "../../assets/i-sena.png";
import oImg from "../../assets/o-sena.png";
import uImg from "../../assets/u-sena.png";
import { Link } from "react-router-dom";

export default function Vocales() {
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
        {/* Botón principal */}
        <Link to="/vocales-practica/a">
          <button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg mb-8 global-body-text">
            Seleccionar
          </button>
        </Link>

        {/* Tarjetas de vocales */}
        <div className="flex justify-center gap-8">
          {vocales.map((v) => (
            <div
              key={v.letra}
              className="sign-card"
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
