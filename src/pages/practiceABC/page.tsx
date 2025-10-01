import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Se agrega useNavigate
import { useVocalContext } from "../../hooks/useVocalContext";
import {
    type VocalModel,
    type NormalizedLandmark,
    type Results,
    type MediaPipeHandsInstance,
} from "../../types";
import "./VocalPractice.css";
import { useAuthLogic } from "../../hooks/useAuthLogic.ts"; // Se descomenta para usar el usuario

// Interfaz para los datos de las letras del backend (similar a VocalData)
interface LetterData {
    id: number;
    vocal: string; // Se mantiene 'vocal' como nombre de campo en el backend, pero representa una letra
    vectoresJson: string;
    contadorModificaciones: number;
}

// Función para completar una letra (adaptada de completarLetra de VocalPractice.tsx)
async function completarLetra(usuarioId: number, letter: string, letters: LetterData[]) {
    const encontrada = letters.find(
        (l) => l.vocal.toLowerCase() === letter.toLowerCase()
    );

    if (!encontrada) {
        console.error("No se encontró la letra:", letter);
        return false;
    }

    const letterId = encontrada.id;

    try {
        const response = await fetch("/api/progreso/completar", { // Asumiendo la misma API
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                usuarioId,
                vocalId: letterId, // El backend espera 'vocalId' aunque sea una letra
            }),
        });

        if (response.ok) {
            console.log("Letra completada exitosamente:", letter);
            return true;
        } else {
            console.error("Error al completar letra:", response.status);
            return false;
        }
    } catch (error) {
        console.error("Error en la petición:", error);
        return false;
    }
}

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
const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'ñ', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']; // Se agrega 'ñ'
const itemsToTrack = [...alphabet];

const AlphabetPracticePage = () => {
    const { vocalModels } = useVocalContext();
    const { user } = useAuthLogic(); // Se usa el hook de autenticación
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const handsRef = useRef<MediaPipeHandsInstance | null>(null);
    // eslint-disable-next-line
    const cameraRef = useRef<any>(null);
    const navigate = useNavigate(); // Se inicializa useNavigate

    // Estado para almacenar las letras del backend
    const [letters, setLetters] = useState<LetterData[]>([]);

    // Estado para la letra actual de práctica
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

    // Nuevos estados para la lógica de desbloqueo de letras (adaptados de vocales)
    const [unlockedLetters, setUnlockedLetters] = useState<string[]>(["a"]); // 'a' siempre desbloqueada
    const [secondsRemainingForUnlock, setSecondsRemainingForUnlock] = useState<number | null>(null);
    const unlockTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [justUnlockedLetter, setJustUnlockedLetter] = useState<string | null>(null);
    // Nuevo estado para indicar que todas las letras han sido completadas
    const [allLettersCompleted, setAllLettersCompleted] = useState<boolean>(false);


    // ====================================================================
    // Efecto para cargar las letras desde el backend (adaptado de vocales)
    // ====================================================================
    useEffect(() => {
        const fetchLetters = async () => {
            try {
                const response = await fetch("/api/vocales"); // Asumiendo que la API de letras es la misma o similar
                if (response.ok) {
                    const data = await response.json();
                    setLetters(data);
                    console.log("Letras cargadas:", data);
                } else {
                    console.error("Error al cargar letras:", response.status);
                }
            } catch (error) {
                console.error("Error en la petición de letras:", error);
            }
        };

        fetchLetters();
    }, []);

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

    // ====================================================================
    // Lógica de desbloqueo y progreso (adaptada de VocalPractice.tsx)
    // ====================================================================
    useEffect(() => {
        if (!selectedLetter) return;

        const currentScore = parseFloat(scores[selectedLetter] || "0.0");
        const isTargetDetected = detectedLetter === selectedLetter;
        const currentIndex = alphabet.indexOf(selectedLetter);
        const isLastLetter = currentIndex === alphabet.length - 1;
        const nextLetter = !isLastLetter ? alphabet[currentIndex + 1] : null;
        const isNextLetterAlreadyUnlocked = nextLetter
            ? unlockedLetters.includes(nextLetter)
            : true;

        const shouldBeActive =
            isTargetDetected &&
            currentScore >= 88 &&
            !justUnlockedLetter &&
            (isLastLetter || !isNextLetterAlreadyUnlocked);

        if (shouldBeActive && unlockTimerRef.current === null) {
            console.log("✅ Iniciando temporizador de desbloqueo/completado");
            setSecondsRemainingForUnlock(5); // 5 segundos para completar

            unlockTimerRef.current = setInterval(() => {
                setSecondsRemainingForUnlock((prev: number | null) => {
                    if (prev === null || prev <= 1) {
                        if (unlockTimerRef.current) {
                            clearInterval(unlockTimerRef.current);
                            unlockTimerRef.current = null;
                        }

                        if (prev === 1) {
                            if (isLastLetter) {
                                console.log("🎉 ¡Todas las letras completadas!");
                                setAllLettersCompleted(true);
                            } else {
                                const nextLetterIndex = currentIndex + 1;
                                if (nextLetterIndex < alphabet.length) {
                                    const nextLetterToUnlock = alphabet[nextLetterIndex];
                                    console.log("🎉 Desbloqueando letra:", nextLetterToUnlock);

                                    setUnlockedLetters((prevUnlocked) => {
                                        if (!prevUnlocked.includes(nextLetterToUnlock)) {
                                            return [...prevUnlocked, nextLetterToUnlock];
                                        }
                                        return prevUnlocked;
                                    });

                                    setJustUnlockedLetter(nextLetterToUnlock);
                                }
                            }
                        }
                        return 0;
                    }

                    console.log("⏱️ Segundos restantes:", prev - 1);
                    return prev - 1;
                });
            }, 1000);
        }
        else if (!shouldBeActive && unlockTimerRef.current !== null) {
            console.log("⏹️ Deteniendo temporizador (precisión < 88% o no detectado)");
            clearInterval(unlockTimerRef.current);
            unlockTimerRef.current = null;
            setSecondsRemainingForUnlock(null);
        }
    }, [
        scores[selectedLetter],
        selectedLetter,
        detectedLetter,
        unlockedLetters,
        justUnlockedLetter,
        allLettersCompleted,
        alphabet, // Añadir al array de dependencias
    ]);

    useEffect(() => {
        return () => {
            if (unlockTimerRef.current) {
                clearInterval(unlockTimerRef.current);
                unlockTimerRef.current = null;
            }
        };
    }, [selectedLetter]);

    useEffect(() => {
        setJustUnlockedLetter(null);
        setAllLettersCompleted(false); // Resetear al cambiar de letra
    }, [selectedLetter]);

    // ====================================================================
    // V. FUNCIONES DE DISPLAY Y RENDERIZADO
    // ====================================================================

    // Función para obtener la clase de color de la puntuación
    const getItemColor = (
        item: string,
        isDetected: boolean = false,
        isSelected: boolean = false
    ) => {
        const colors = [
            "text-red-600",
            "text-blue-600",
            "text-green-600",
            "text-purple-600",
            "text-amber-600",
            "text-cyan-600",
        ];
        const index = itemsToTrack.indexOf(item);

        if (isDetected && isSelected) return "text-green-600";
        if (isDetected) return "text-black";
        if (isSelected) return colors[index % colors.length];
        return "text-gray-400";
    };

    const getDisplayName = (item: string) => {
        return item.toUpperCase();
    };

    const selectedLetterImg = getImage(selectedLetter);

    const closePopup = () => {
        setJustUnlockedLetter(null);
        setAllLettersCompleted(false);
    };

    return (
        <section className="p-5 w-full">
            {/* Popup para letra desbloqueada */}
            {justUnlockedLetter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-green-600 mb-2">
                                ¡Nueva letra desbloqueada!
                            </h3>
                            <p className="text-gray-700 mb-6">
                                Has desbloqueado la letra{" "}
                                <span className="font-bold text-3xl text-amber-600">
                                    {justUnlockedLetter.toUpperCase()}
                                </span>
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={async () => {
                                        if (!user) {
                                            console.error("Usuario no autenticado");
                                            closePopup();
                                            return;
                                        }

                                        // Completar la letra ACTUAL (la que se estuvo practicando)
                                        const success = await completarLetra(user.id, selectedLetter, letters);

                                        if (success) {
                                            navigate(`/practice/${justUnlockedLetter.toLowerCase()}`);
                                        } else {
                                            console.error("No se pudo completar la letra");
                                        }

                                        closePopup();
                                    }}
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 text-center"
                                >
                                    Practicar '{justUnlockedLetter.toUpperCase()}'
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!user) {
                                            console.error("Usuario no autenticado");
                                            closePopup();
                                            return;
                                        }

                                        // Completar la letra ACTUAL (la que se estuvo practicando)
                                        const success = await completarLetra(user.id, selectedLetter, letters);
                                        if (success) {
                                            console.log("Letra completada exitosamente:", selectedLetter);
                                        } else {
                                            console.error("No se pudo completar la letra");
                                        }

                                        closePopup();
                                    }}
                                    className="text-gray-600 hover:text-gray-800 font-medium py-2"
                                >
                                    Seguir practicando
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Nuevo Popup de felicitación por completar todas las letras */}
            {allLettersCompleted && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-purple-600 mb-2">
                                ¡Felicidades!
                            </h3>
                            <p className="text-gray-700 mb-6">
                                Has completado la práctica de todas las letras del abecedario. ¡Excelente trabajo!
                            </p>
                            <button
                                onClick={async () => {
                                    if (!user) {
                                        console.error("Usuario no autenticado");
                                        closePopup();
                                        return;
                                    }

                                    // Completar la última letra (ej. 'z')
                                    const success = await completarLetra(user.id, selectedLetter, letters);
                                    if (success) {
                                        console.log(`Letra '${selectedLetter}' completada exitosamente.`);
                                    } else {
                                        console.error(`No se pudo completar la letra '${selectedLetter}'.`);
                                    }

                                    closePopup();
                                    navigate("/abecedario"); // Navegar a la página principal del abecedario
                                }}
                                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 text-center"
                            >
                                Volver al Abecedario
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

                    {/* Card de "Progreso de Desbloqueo" (adaptado de vocales) */}
                    <div className="vocal-target-card mb-4">
                        <h3 className="text-base font-semibold text-gray-700 mb-3">
                            Progreso de Desbloqueo
                        </h3>
                        {secondsRemainingForUnlock !== null &&
                        secondsRemainingForUnlock > 0 ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 w-full">
                                <p className="text-sm font-medium text-blue-800 mb-2">
                                    {selectedLetter === alphabet[alphabet.length - 1]
                                        ? '¡Mantén la posición para completar todo el abecedario!'
                                        : '¡Mantén la posición para desbloquear la siguiente letra!'}
                                </p>
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="relative w-full max-w-xs h-4 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-1000 ease-linear"
                                            style={{
                                                width: `${(secondsRemainingForUnlock / 5) * 100}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-bold text-blue-700 w-8 text-center">
                                        {secondsRemainingForUnlock}s
                                    </span>
                                </div>
                                <p className="text-xs text-blue-600 mt-1">
                                    Progreso:{" "}
                                    {Math.round(((5 - secondsRemainingForUnlock) / 5) * 100)}%
                                </p>
                            </div>
                        ) : secondsRemainingForUnlock === 0 ? (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                                <p className="font-medium">
                                    {selectedLetter === alphabet[alphabet.length - 1] ? '¡Felicidades, has completado la última letra!' : '¡Listo para desbloquear!'}
                                </p>
                                <p className="text-sm">
                                    {selectedLetter === alphabet[alphabet.length - 1] ? 'Un momento...' : 'Mantén la posición un momento más...'}
                                </p>
                            </div>
                        ) : (
                            (() => {
                                const currentIndex = alphabet.indexOf(selectedLetter);
                                const nextLetterIndex = currentIndex + 1;
                                if (nextLetterIndex < alphabet.length) {
                                    const nextLetter = alphabet[nextLetterIndex];
                                    if (unlockedLetters.includes(nextLetter)) {
                                        return (
                                            <p className="text-sm text-green-600 font-bold">
                                                ¡Letra '{nextLetter.toUpperCase()}' desbloqueada!
                                            </p>
                                        );
                                    } else {
                                        return (
                                            <p className="text-sm text-gray-500">
                                                Practica '{selectedLetter.toUpperCase()}' para
                                                desbloquear '{nextLetter.toUpperCase()}'
                                            </p>
                                        );
                                    }
                                } else {
                                    return (
                                        <p className="text-sm text-green-600 font-bold">
                                            ¡Todas las letras desbloqueadas!
                                        </p>
                                    );
                                }
                            })()
                        )}
                    </div>

                    <div className="vocal-target-card">
                        <h3 className="text-base font-semibold text-gray-700 mb-3">
                            Malla de Scores (Abecedario)
                        </h3>
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
