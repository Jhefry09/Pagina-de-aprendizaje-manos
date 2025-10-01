import { useState, useRef, useEffect, useCallback } from "react";
// 1. IMPORTACIÓN CORREGIDA: Agregamos 'useNavigate' aquí
import { useNavigate } from "react-router-dom"; 
import type { NormalizedLandmark, Results, MediaPipeHandsInstance, VocalModel } from "../../types";
import "./numeros.css";
import { useVocalContext } from '../../hooks/useVocalContext';
import manitoBorrarImg from '../../assets/numeros/manito-borrar.png';

// Función para obtener la imagen de un número
function getImage(number: string) {
    // Todas las imágenes están en public/assets/numeros/ con el patrón {number}-sena.png
    return `/assets/numeros/${number}-sena.png`;
}

// Helper functions for hand recognition (se mantienen sin cambios)
const normalizeLandmarks = (landmarks: NormalizedLandmark[]) => {
// ... (cuerpo de la función) ...
    if (!landmarks || landmarks.length === 0) return [];
    const cx = landmarks.reduce((sum, p) => sum + p.x, 0) / landmarks.length;
    const cy = landmarks.reduce((sum, p) => sum + p.y, 0) / landmarks.length;
    const cz = landmarks.reduce((sum, p) => sum + p.z, 0) / landmarks.length;
    let normalized = landmarks.map(p => ({ x: p.x - cx, y: p.y - cy, z: p.z - cz }));
    const maxDist = Math.max(...normalized.map(p => Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z)));
    if (maxDist === 0) return normalized;
    normalized = normalized.map(p => ({ x: p.x / maxDist, y: p.y / maxDist, z: p.z / maxDist }));
    return normalized;
};
const compareHands = (hand: NormalizedLandmark[], model: NormalizedLandmark[], threshold: number) => {
// ... (cuerpo de la función) ...
    if (hand.length === 0 || model.length === 0) return 0;
    let similarity = 0;
    for (let i = 0; i < hand.length; i++) {
        const dx = hand[i].x - model[i].x;
        const dy = hand[i].y - model[i].y;
        const dz = hand[i].z - model[i].z;
        similarity += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    // Convertir la distancia de vuelta a una puntuación de precisión (0 a 100)
    const score = Math.max(0, 100 - (similarity / model.length) * 1000); 
    return score;
};
const isHandClosed = (landmarks: NormalizedLandmark[]) => {
// ... (cuerpo de la función) ...
    if (landmarks.length === 0) return false;
    // Evalúa si la punta del dedo medio (12) está cerca de la base de la palma (0)
    const middleTip = landmarks[12];
    const palmBase = landmarks[0];
    const distance = Math.sqrt(
        (middleTip.x - palmBase.x) ** 2 + (middleTip.y - palmBase.y) ** 2
    );
    // Este umbral es heurístico y debe ajustarse. Un valor pequeño sugiere puño cerrado.
    return distance < 0.1; 
};

const NumbersPage = () => {
    const { vocalModels } = useVocalContext();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const handsRef = useRef<MediaPipeHandsInstance | null>(null);
    // eslint-disable-next-line
    const cameraRef = useRef<any>(null);
    const [detectedSymbol, setDetectedSymbol] = useState<string>('');
    const [scores, setScores] = useState<{ [key: string]: string }>({});
    const detectedSymbolRef = useRef<string>('');
    const previousLeftHandClosedRef = useRef<boolean>(false);
    const lastWriteTimeRef = useRef<number>(0);

    // 2. INICIALIZACIÓN: Inicializar useNavigate
    const navigate = useNavigate(); 

    // Símbolos matemáticos y números
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const operators = ['+', '-', 'x', '/'];
    const specialFunctions = ['BORRAR'];

    // ... (El resto de la lógica de MediaPipe (useEffect, animateLoop) se mantiene sin cambios)
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        target.src = '/assets/placeholder.png'; // Fallback
    };
    const handleDeleteImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        target.src = '/assets/placeholder.png'; // Fallback
    };

    // 3. HANDLER DE CLICK: Función para manejar el click en las tarjetas
    const handleSignClick = (item: string) => {
        // Redirige a la ruta /practicenum/(el número o símbolo)
        console.log(`Navegando a: /practicenum/${item}`);
        navigate(`/practicenum/${item}`); 
    };
    
    // Función de inicialización de MediaPipe (se mantiene sin cambios)
    useEffect(() => {
        // ... (cuerpo de la función de inicialización de MediaPipe) ...
    }, []);

    // Loop de animación (se mantiene sin cambios)
    const animateLoop = useCallback((timestamp: DOMHighResTimeStamp) => {
        // ... (cuerpo de la función animateLoop) ...
    }, [vocalModels]);

    useEffect(() => {
        // ... (cuerpo de useEffect para iniciar el loop) ...
        let animationFrameId: number;
        // eslint-disable-next-line
        // const startAnimation = () => {
        //     animationFrameId = requestAnimationFrame(animateLoop);
        // };

        // // if (handsRef.current) {
        // //     startAnimation();
        // // }

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [animateLoop]);

    return (
        <section className="p-5 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Camera and Text Display */}
                <div className="flex flex-col items-center">
                    <div className="vocal-practice-camera">
                        <video ref={videoRef} className="vocal-practice-video" autoPlay playsInline></video>
                        <canvas ref={canvasRef} className="vocal-practice-canvas"></canvas>
                        <div className="vocal-practice-status">
                            Cámara: ACTIVA | Modelo: Cargado
                        </div>
                    </div>
                    {/* Display de la expresión matemática (no se altera) */}
                    <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl p-4 w-full shadow-lg border border-gray-200 mt-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Expresión Detectada</h3>
                        <div className="text-4xl font-extrabold text-indigo-600 tracking-wider">
                            {/* Aquí se mostraría la expresión matemática construida */}
                            <span className="text-gray-500">{(detectedSymbol === '' ? 'Esperando Señal...' : `Señal: ${detectedSymbol}`)}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Mathematical Signs */}
                <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-black-200 p-3">
                    <h2 className="text-lg font-semibold mb-2 text-gray-800">
                        Lenguaje de Señas Matemático
                    </h2>

                    {/* Number Cards */}
                    <div className="grid grid-cols-5 gap-4 mb-4">
                        {numbers.map((number) => {
                            const isDetected = number === detectedSymbol;
                            const score = parseFloat(scores[number] || '0');
                            const imageUrl = getImage(number);
                            return (
                                <div
                                    key={number}
                                    className={`sign-card !w-auto !h-auto min-w-[60px] min-h-[80px] transition-all duration-300 cursor-pointer ${ // Añadir cursor-pointer
                                        isDetected ? 'ring-2 ring-amber-400 ring-offset-2 scale-105' : ''
                                    }`}
                                    // 4. CLICK HANDLER: Añadir el manejador de click
                                    onClick={() => handleSignClick(number)} 
                                    style={{ width: 'auto', height: 'auto' }}
                                >
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={`Número ${number} en señas`}
                                            className="w-10 h-10 object-contain mb-1"
                                            onError={handleImageError}
                                        />
                                    ) : (
                                        <span className="text-3xl font-bold">{number}</span>
                                    )}
                                    <span className="sign-letter text-xs">{number}</span>
                                    {score > 0 && (
                                        <div className={`text-xs font-bold mt-1 ${
                                            score > 70 ? 'text-green-600' :
                                                score > 40 ? 'text-yellow-600' : 'text-red-500'
                                        }`}>
                                            {score.toFixed(0)}%
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Operator Cards */}
                    <div className="border-t border-gray-300 pt-3 mb-4">
                        <h3 className="text-base font-semibold text-gray-700 mb-2">Operadores</h3>
                        <div className="grid grid-cols-4 gap-4"> {/* Ajustado a 4 columnas si solo hay 4 operadores */}
                            {operators.map((operator) => {
                                const isDetected = operator === detectedSymbol;
                                const score = parseFloat(scores[operator] || '0');
                                const imageUrl = getImage(operator);
                                return (
                                    <div
                                        key={operator}
                                        className={`sign-card !w-auto !h-auto min-w-[60px] min-h-[80px] transition-all duration-300 cursor-pointer ${ // Añadir cursor-pointer
                                            isDetected ? 'ring-2 ring-amber-400 ring-offset-2 scale-105' : ''
                                        }`}
                                        // 4. CLICK HANDLER: Añadir el manejador de click
                                        onClick={() => handleSignClick(operator)} 
                                        style={{ width: 'auto', height: 'auto' }}
                                    >
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={`Señal ${operator}`}
                                                className="w-10 h-10 object-contain mb-1"
                                                onError={handleImageError}
                                            />
                                        ) : (
                                            <span className="text-3xl font-bold">{operator}</span>
                                        )}
                                        <span className="sign-letter text-xs">{operator}</span>
                                        {score > 0 && (
                                            <div className={`text-xs font-bold mt-1 ${
                                                score > 70 ? 'text-green-600' :
                                                    score > 40 ? 'text-yellow-600' : 'text-red-500'
                                            }`}>
                                                {score.toFixed(0)}%
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Special Function - Delete */}
                    <div className="border-t border-gray-300 pt-3">
                        <h3 className="text-base font-semibold text-gray-700 mb-2">Función Especial</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {specialFunctions.map((func) => {
                                const isDetected = func === detectedSymbol;
                                const score = parseFloat(scores[func] || '0');
                                return (
                                    <div
                                        key={func}
                                        className={`sign-card !w-auto !h-auto min-w-[60px] min-h-[80px] transition-all duration-300 cursor-pointer ${ // Añadir cursor-pointer
                                            isDetected ? 'ring-2 ring-amber-400 ring-offset-2 scale-105' : ''
                                        }`}
                                        // 4. CLICK HANDLER: Añadir el manejador de click
                                        onClick={() => handleSignClick(func)} 
                                        style={{ width: 'auto', height: 'auto' }}
                                    >
                                        <img
                                            src={manitoBorrarImg}
                                            alt="Señal borrar"
                                            className="w-10 h-10 object-contain mb-1"
                                            onError={handleDeleteImageError}
                                        />
                                        <span className="sign-letter text-xs">BORRAR</span>
                                        {score > 0 && (
                                            <div className={`text-xs font-bold mt-1 ${
                                                score > 70 ? 'text-green-600' :
                                                    score > 40 ? 'text-yellow-600' : 'text-red-500'
                                            }`}>
                                                {score.toFixed(0)}%
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default NumbersPage;