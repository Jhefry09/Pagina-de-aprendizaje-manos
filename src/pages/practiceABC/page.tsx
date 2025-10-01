import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom"; // Se mantiene por si se usa en el futuro, pero no se usa en la lógica actual
import { useVocalContext } from "../../hooks/useVocalContext";
import {
    type VocalModel,
    type NormalizedLandmark,
    type Results,
    type MediaPipeHandsInstance,
} from "../../types";
import "./VocalPractice.css"; // Se mantiene el CSS original
import { useAuthLogic } from "../../hooks/useAuthLogic.ts"; // Se mantiene por si se usa en el futuro

// ====================================================================
// I. HELPERS (Funciones auxiliares - Copiadas de VocalPractice.tsx)
// ====================================================================

const normalizeLandmarks = (landmarks: NormalizedLandmark[]) => {
    if (!landmarks || landmarks.length === 0) return [];
    const cx = landmarks.reduce((sum, p) => sum + p.x, 0) / landmarks.length;
    const cy = landmarks.reduce((sum, p) => sum + p.y, 0) / landmarks.length;
    const cz = landmarks.reduce((sum, p) => sum + p.z, 0) / landmarks.length;
    let normalized = landmarks.map((p) => ({
        x: p.x - cx,
        y: p.y - cy,
        z: p.z - cz,
    }));
    const maxDist = Math.max(
        ...normalized.map((p) => Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z))
    );
    if (maxDist === 0) return normalized;
    normalized = normalized.map((p) => ({
        x: p.x / maxDist,
        y: p.y / maxDist,
        z: p.z / maxDist,
    }));
    return normalized;
};

const compareHands = (
    landmarks1: NormalizedLandmark[],
    landmarks2: NormalizedLandmark[]
) => {
    if (
        !landmarks1 ||
        !landmarks2 ||
        landmarks1.length === 0 ||
        landmarks2.length === 0
    )
        return "0.0";
    const n = Math.min(landmarks1.length, landmarks2.length);
    let totalDist = 0;
    for (let i = 0; i < n; i++) {
        const p1 = landmarks1[i];
        const p2 = landmarks2[i];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        totalDist += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    const similarity = Math.max(0, Math.min(1, 1 - totalDist / n));
    return (similarity * 100).toFixed(1);
};

// ====================================================================
// II. COMPONENTE PRINCIPAL
// ====================================================================

// === LÓGICA DE IMÁGENES (Basada en el código de referencia) ===
// NOTA: Asume que las imágenes del abecedario están en la misma estructura que en el código de referencia:
// "../../assets/abecedario/*-sena.png"

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
    return entry ? entry[1].default : null;
}

// Generamos el array completo del abecedario (A-Z) para la detección
const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
// Se elimina 'espacio' y 'borrar' para simplificar al foco de las letras.
const itemsToTrack = [...alphabet];

const AlphabetPracticePage = () => {
    const { vocalModels } = useVocalContext();
    // const { user } = useAuthLogic(); // Se mantiene por si se usa en el futuro
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const handsRef = useRef<MediaPipeHandsInstance | null>(null);
    // eslint-disable-next-line
    const cameraRef = useRef<any>(null);

    // Estado para la letra actual de práctica (se usa el primer elemento por defecto)
    const { vocal: selectedLetterParam } = useParams<{ vocal: string }>();
    const defaultLetter = alphabet[0]; // 'a'
    const selectedLetter =
        selectedLetterParam?.toLowerCase() && alphabet.includes(selectedLetterParam.toLowerCase())
            ? selectedLetterParam.toLowerCase()
            : defaultLetter;

    const initialScores = itemsToTrack.reduce((acc, item) => {
        acc[item] = "0.0";
        return acc;
    }, {} as Record<string, string>);

    const [scores, setScores] = useState<Record<string, string>>(initialScores);
    const [detectedLetter, setDetectedLetter] = useState("");
    const [highestScore, setHighestScore] = useState(0);
    const [isReady, setIsReady] = useState(false);
    
    // Se elimina toda la lógica de 'vocales', 'desbloqueo', 'timers' y 'popups'

    // ====================================================================
    // III. HANDLER PRINCIPAL DE MEDIAPIPE (Solo Detección Mano Derecha)
    // ====================================================================
    const handleResults = useCallback(
        (results: Results) => {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (!canvas || !video) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const canvasWidth = 640;
            const canvasHeight = 480;

            if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
            }

            // Dibujar video con efecto espejo (tomado del código de referencia para mejor UX)
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            ctx.restore();

            let rightHandLandmarks = null;

            const HAND_CONNECTIONS = [
                [0, 1], [1, 2], [2, 3], [3, 4],
                [0, 5], [5, 6], [6, 7], [7, 8],
                [0, 9], [9, 10], [10, 11], [11, 12],
                [0, 13], [13, 14], [14, 15], [15, 16],
                [0, 17], [17, 18], [18, 19], [19, 20],
                [5, 9], [9, 13], [13, 17]
            ];

            if (results.multiHandLandmarks && results.multiHandedness) {
                for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                    const handLandmarks = results.multiHandLandmarks[i];
                    const detectedHandedness =
                        results.multiHandedness[i]?.label || "Right";

                    // 'Left' en MediaPipe es la mano derecha del usuario
                    const isUserRightHand = detectedHandedness === "Left";

                    if (isUserRightHand) {
                        ctx.strokeStyle = '#f2994a';
                        ctx.lineWidth = 2;

                        for (const [start, end] of HAND_CONNECTIONS) {
                            const startPoint = handLandmarks[start];
                            const endPoint = handLandmarks[end];
                            ctx.beginPath();
                            // Invertir X para que coincida con el espejo del video
                            ctx.moveTo((1 - startPoint.x) * canvas.width, startPoint.y * canvas.height);
                            ctx.lineTo((1 - endPoint.x) * canvas.width, endPoint.y * canvas.height);
                            ctx.stroke();
                        }

                        ctx.fillStyle = '#215c5c';
                        for (const landmark of handLandmarks) {
                            ctx.beginPath();
                            // Invertir X para que coincida con el espejo del video
                            ctx.arc(
                                (1 - landmark.x) * canvas.width,
                                landmark.y * canvas.height,
                                3, 0, 2 * Math.PI
                            );
                            ctx.fill();
                        }

                        rightHandLandmarks = handLandmarks;
                    }
                }
            }

            if (rightHandLandmarks) {
                const normalizedHand = normalizeLandmarks(rightHandLandmarks);

                const newScores: Record<string, string> = {};
                let maxScore = 0;
                let detected = "";

                // Iterar sobre TODO el abecedario
                for (const item of itemsToTrack) {
                    const itemBase = vocalModels.find(
                        (v: VocalModel) => v.vocal === item
                    );
                    if (itemBase) {
                        const baseLandmarks = normalizeLandmarks(itemBase.landmarks);
                        const score = parseFloat(
                            compareHands(normalizedHand, baseLandmarks)
                        );
                        newScores[item] = score.toFixed(1);
                        if (score > maxScore) {
                            maxScore = score;
                            detected = item;
                        }
                    } else {
                        newScores[item] = "0.0";
                    }
                }

                setScores(newScores);
                setDetectedLetter(detected);
                setHighestScore(maxScore);
            } else {
                setScores(initialScores);
                setDetectedLetter("");
                setHighestScore(0);
            }
        },
        [vocalModels, initialScores]
    );

    // ====================================================================
    // IV. SETUP Y CICLO DE VIDA (Copiado de VocalPractice.tsx)
    // ====================================================================

    useEffect(() => {
        let setupComplete = false;

        const setupMediaPipe = () => {
            if (setupComplete) return;
            setupComplete = true;
            setIsReady(true);

            handsRef.current = new (window as any).Hands({ // Casting a any para acceder a Hands
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });

            // Use the non-null assertion operator '!' here
            handsRef.current!.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7,
                selfieMode: false,
                staticImageMode: false,
                smoothLandmarks: true,
                refineLandmarks: true,
            });

            // Use the non-null assertion operator '!' here
            handsRef.current!.onResults(handleResults);

            if (videoRef.current && !cameraRef.current) {
                cameraRef.current = new (window as any).Camera(videoRef.current, { // Casting a any para acceder a Camera
                    onFrame: async () => {
                        if (videoRef.current && handsRef.current) {
                            await handsRef.current.send({ image: videoRef.current });
                        }
                    },
                    width: 640,
                    height: 480,
                });
                // Also apply the non-null assertion here for consistency
                cameraRef.current!.start();
            }
        };

        const intervalId = setInterval(() => {
            if ((window as any).Hands && (window as any).Camera && !setupComplete) {
                clearInterval(intervalId);
                setupMediaPipe();
            }
        }, 100);

        return () => {
            clearInterval(intervalId);
            if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current = null;
            }
            if (handsRef.current) {
                handsRef.current.close();
                handsRef.current = null;
            }
            setupComplete = false;
        };
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (handsRef.current) {
            handsRef.current.onResults(handleResults);
        }
    }, [handleResults]);

    // Se elimina todo el useEffect de la lógica de desbloqueo de vocales

    // ====================================================================
    // V. FUNCIONES DE DISPLAY Y RENDERIZADO
    // ====================================================================

    // Función para obtener la clase de color de la puntuación
    const getItemColor = (
        item: string,
        isDetected: boolean = false,
        isSelected: boolean = false
    ) => {
        // Colores de ejemplo para las letras objetivo (para que se vea diferente)
        const colors = [
            "text-red-600",
            "text-blue-600",
            "text-green-600",
            "text-purple-600",
            "text-amber-600",
            "text-cyan-600",
        ];
        const index = itemsToTrack.indexOf(item); // Usar itemsToTrack (el alfabeto)

        if (isDetected && isSelected) return "text-green-600";
        if (isDetected) return "text-black";
        if (isSelected) return colors[index % colors.length];
        return "text-gray-400";
    };

    const getDisplayName = (item: string) => {
        // En el alfabeto solo son letras, no hay acciones especiales
        return item.toUpperCase();
    };

    const selectedLetterImg = getImage(selectedLetter);

    // Se elimina closePopup y el JSX del popup de desbloqueo

    return (
        <section className="p-5 w-full">
            {/* Se elimina el popup de justUnlockedVowel */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Panel Izquierdo: Cámara y Detección */}
                <div className="vocal-practice-container">
                    <h2 className="text-xl font-semibold mb-3 text-gray-800">
                        Práctica de Abecedario ({selectedLetter.toUpperCase()})
                    </h2>

                    <div className="mb-3 flex gap-2">
                        <div className={`p-3 rounded-lg flex items-center flex-1 ${
                            detectedLetter ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'
                        }`}>
                            <div className={`w-3 h-3 rounded-full mr-2 ${
                                detectedLetter ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                            }`}></div>
                            <span className={`font-semibold text-sm ${
                                detectedLetter ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {detectedLetter ? `✋ Seña Detectada: ${getDisplayName(detectedLetter)}` : '⚠️ Mano derecha NO detectada'}
                            </span>
                        </div>
                    </div>

                    <div className="vocal-practice-camera">
                        <video
                            ref={videoRef}
                            className="hidden"
                            autoPlay
                            playsInline
                            muted
                        />
                        <canvas
                            ref={canvasRef}
                            className="vocal-practice-canvas"
                            width="640"
                            height="480"
                        />
                        <div className="vocal-practice-status">
                            {isReady ? "Reconocimiento Activo" : "Cargando MediaPipe..."}
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Objetivo y Scores */}
                <div className="vocal-practice-container">
                    <h2 className="text-lg font-semibold mb-2 text-gray-800">
                        Seña Objetivo
                    </h2>

                    <div className="vocal-target-card mb-4">
                        <div className="vocal-practice-sign-card">
                            {selectedLetterImg ? (
                                <img
                                    src={selectedLetterImg}
                                    alt={`${selectedLetter.toUpperCase()} en señas`}
                                    className="w-20 h-20 object-contain mb-2"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                                    <span className="text-3xl font-bold text-gray-500">{selectedLetter.toUpperCase()}</span>
                                </div>
                            )}
                            <span className="vocal-practice-sign-letter">
                                {selectedLetter.toUpperCase()}
                            </span>
                        </div>

                        <div className="w-full mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-gray-700 text-sm">
                                    Precisión:
                                </span>
                                <span className="font-bold text-sm">
                                    {scores[selectedLetter] || "0.0"}%
                                </span>
                            </div>
                            <div className="vocal-practice-precision-bar">
                                <div
                                    className={`vocal-practice-precision-fill ${
                                        detectedLetter === selectedLetter ? "precision-high" : "precision-low"
                                    }`}
                                    style={{ width: `${scores[selectedLetter] || "0.0"}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="vocal-target-card mb-4">
                        <h3 className="text-base font-semibold text-gray-700 mb-3">
                            Mejor Coincidencia
                        </h3>
                        <div
                            className={`text-4xl font-bold mb-2 ${
                                detectedLetter ? "text-amber-600" : "text-gray-400"
                            }`}
                        >
                            {detectedLetter ? getDisplayName(detectedLetter) : "Ninguna"}
                        </div>
                        <span className="text-base font-normal text-gray-500">
                            Precisión: {highestScore.toFixed(1)}%
                        </span>
                    </div>

                    {/* Se elimina el card de "Progreso de Desbloqueo" */}

                    <div className="vocal-target-card">
                        <h3 className="text-base font-semibold text-gray-700 mb-3">
                            Malla de Scores (Abecedario)
                        </h3>
                        {/* Se ajusta a un grid más grande para el alfabeto */}
                        <div className="grid grid-cols-6 gap-2"> 
                            {itemsToTrack.map((item) => (
                                <div
                                    key={item}
                                    className={`p-1.5 flex flex-col items-center justify-center rounded-lg border transition-all duration-200 ${
                                        item === selectedLetter ? "bg-blue-100 border-blue-400" : "bg-white border-gray-200"
                                    } ${
                                        item === detectedLetter ? "ring-2 ring-amber-400 ring-offset-1" : ""
                                    }`}
                                >
                                    <div
                                        className={`text-sm font-medium ${getItemColor(
                                            item,
                                            item === detectedLetter,
                                            item === selectedLetter
                                        )}`}
                                    >
                                        {getDisplayName(item)}
                                    </div>
                                    <div
                                        className={`text-xs font-bold ${getItemColor(
                                            item,
                                            item === detectedLetter,
                                            item === selectedLetter
                                        )}`}
                                    >
                                        {scores[item] || "0.0"}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AlphabetPracticePage;