import { useNavigate } from "react-router-dom";
import { useVoice, VoiceMessages } from "../../hooks/useVoice";
import aImg from "../../assets/a-sena.png";
import eImg from "../../assets/e-sena.png";
import iImg from "../../assets/i-sena.png";
import oImg from "../../assets/o-sena.png";
import uImg from "../../assets/u-sena.png";
import ProgressTable from "../../components/ProgressTable";
import { vowelsData } from "../../data/progressData";

export default function Vocales() {
  const navigate = useNavigate();

  // ✅ Se elimina la configuración de ElevenLabs.
  // Se llama al hook useVoice directamente (con idioma opcional).
  const { speak } = useVoice({ lang: "es-ES" });

  const vocales = [
    { letra: "A", img: aImg },
    { letra: "E", img: eImg },
    { letra: "I", img: iImg },
    { letra: "O", img: oImg },
    { letra: "U", img: uImg },
  ];

  const handleVocalClick = (vocal: string) => {
    // ✅ Se combina el mensaje de navegación y el mensaje de la vocal en una sola llamada
    // y se usa onEnd para navegar, asegurando la secuencia correcta.
    const vocalMessage =
      VoiceMessages[`VOCAL_${vocal}_DETECTED` as keyof typeof VoiceMessages];
    const fullMessage = `${VoiceMessages.NAVIGATION_VOCALES}. ${vocalMessage}.`;

    speak(fullMessage, {
      onEnd: () => {
        navigate(`/vocales-practica/${vocal.toLowerCase()}`);
      },
    });
  };

  return (
    <section className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-12 lg:py-16">
      <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-8">
        {/* Left Column - Content */}
        <div className="lg:col-span-2">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
            {/* Header with Title */}
            <div className="mb-12">
              <div className="text-left">
                <h2 className="global-title-dark mb-2 text-3xl font-bold">
                  Vocales
                </h2>
                <p className="global-body-text-dark text-lg">
                  Domina las vocales en lengua de señas con ejercicios
                  interactivos y prácticos.
                </p>
              </div>
            </div>

            {/* Tarjetas de vocales */}
            <div className="flex justify-center gap-8 flex-wrap">
              {vocales.map((v) => (
                <div
                  key={v.letra}
                  className="sign-card hover:scale-110 transition-all duration-300 cursor-pointer"
                  onClick={() => handleVocalClick(v.letra)}
                >
                  <img
                    src={v.img}
                    alt={`${v.letra} en señas`}
                    className="w-20 h-20 object-contain"
                  />
                  <span className="sign-letter">{v.letra}</span>
                </div>
              ))}
            </div>
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
    </section>
  );
}
