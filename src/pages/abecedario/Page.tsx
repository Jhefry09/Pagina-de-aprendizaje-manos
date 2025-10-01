import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressTable from "../../components/ProgressTable";
import { alphabetData } from "../../data/progressData";
import { useVoice, VoiceMessages } from "../../hooks/useVoice";

// ✅ Importa todas las imágenes de forma dinámica
const images = import.meta.glob("../../assets/abecedario/*-sena.png", { eager: true }) as Record<
    string,
    { default: string }
>;

function getImage(letter: string) {
    const entry = Object.entries(images).find(([path]) =>
        path.toLowerCase().includes(`${letter.toLowerCase()}-sena.png`)
    );
    return entry ? entry[1].default : "";
}

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Abecedario() {
    const [selected, setSelected] = useState<string | null>(null);
    const navigate = useNavigate();
    const { speak } = useVoice({ lang: "es-ES" });

    const handleLetterClick = (letter: string) => {
        setSelected(letter);

        const letterMessage =
            VoiceMessages[`LETTER_${letter}_DETECTED` as keyof typeof VoiceMessages] ||
            `Has seleccionado la letra ${letter}`;

        const fullMessage = `${VoiceMessages.NAVIGATION_ABECEDARIO}. ${letterMessage}.`;

        speak(fullMessage, {
            onEnd: () => {
                navigate(`/abecedario-practica/${letter.toLowerCase()}`);
            },
        });
    };

    return (
        <div className="w-full pt-20 pb-6 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">

                {/* Left Column */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
                    <div className="mb-12 text-left">
                        <h2 className="global-title-dark mb-2 text-3xl font-bold">Abecedario</h2>
                        <p className="global-body-text-dark text-lg">
                            Aprende todas las letras de la A a la Z con tutoriales paso a paso y prácticas guiadas.
                        </p>
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
                                    onClick={() => handleLetterClick(letter)}
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
                                    <span className="sign-letter text-sm">{letter}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column */}
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
