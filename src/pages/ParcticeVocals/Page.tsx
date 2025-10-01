import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useVocalContext } from "../../hooks/useVocalContext";
import {
    type VocalModel,
    type NormalizedLandmark,
    type Results,
    type MediaPipeHandsInstance,
} from "../../types";
import "./VocalPractice.css";

// ====================================================================
// I. HELPERS (Funciones auxiliares)
// ====================================================================

// La función normalizeLandmarks es vital para hacer el reconocimiento independiente del tamaño y posición de la mano.
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

// La función compareHands calcula la similitud euclidiana y la convierte en un porcentaje de score.
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

import aImg from "../../assets/a-sena.png";
import eImg from "../../assets/e-sena.png";
import iImg from "../../assets/i-sena.png";
import oImg from "../../assets/o-sena.png";
import uImg from "../../assets/u-sena.png";

const vocalImages: Record<string, string> = {
    a: aImg,
    e: eImg,
    i: iImg,
    o: oImg,
    u: uImg,
};

const vocals = ["a", "e", "i", "o", "u"];
const itemsToTrack = [...vocals];

const VocalPracticePage = () => {
    const { vocalModels } = useVocalContext();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const handsRef = useRef<MediaPipeHandsInstance | null>(null);
    // eslint-disable-next-line
    const cameraRef = useRef<any>(null);
    const navigate = useNavigate(); // 👈 aquí declaras el hook
    // Estado para la página (usando un valor por defecto seguro)
    const { vocal: selectedLetterParam } = useParams<{ vocal: string }>();
    const selectedLetter =
        selectedLetterParam?.toLowerCase() &&
        vocalImages[selectedLetterParam.toLowerCase()]
            ? selectedLetterParam.toLowerCase()
            : "a";

    const initialScores = itemsToTrack.reduce((acc, item) => {
        acc[item] = "0.0";
        return acc;
    }, {} as Record<string, string>);

    const [scores, setScores] = useState<Record<string, string>>(initialScores);
    const [detectedLetter, setDetectedLetter] = useState("");
    const [highestScore, setHighestScore] = useState(0);
    const [isReady, setIsReady] = useState(false);

    // Nuevos estados para la lógica de desbloqueo de vocales
    const [unlockedVowels, setUnlockedVowels] = useState<string[]>(["a"]);
    const [secondsRemainingForUnlock, setSecondsRemainingForUnlock] = useState<number | null>(null);
    const unlockTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [justUnlockedVowel, setJustUnlockedVowel] = useState<string | null>(null);

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

            // Mantener dimensiones fijas para el canvas
            const canvasWidth = 640;
            const canvasHeight = 480;

            if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
            }

// Limpiar canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

// Dibujar video sin efecto espejo
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            let rightHandLandmarks = null;

            // Definir conexiones de la mano
            const HAND_CONNECTIONS = [
                [0, 1], [1, 2], [2, 3], [3, 4], // Pulgar
                [0, 5], [5, 6], [6, 7], [7, 8], // Índice
                [0, 9], [9, 10], [10, 11], [11, 12], // Medio
                [0, 13], [13, 14], [14, 15], [15, 16], // Anular
                [0, 17], [17, 18], [18, 19], [19, 20], // Meñique
                [5, 9], [9, 13], [13, 17] // Conexiones entre dedos
            ];

            // 1. Separar y dibujar la mano derecha (Detección)
            if (results.multiHandLandmarks && results.multiHandedness) {
                for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                    const handLandmarks = results.multiHandLandmarks[i];
                    const detectedHandedness =
                        results.multiHandedness[i]?.label || "Right";

                    // Etiquetado MediaPipe en selfieMode=false: 'Left' es la mano derecha del usuario (detección).
                    const isUserRightHand = detectedHandedness === "Left";

                    if (isUserRightHand) {
                        // Dibujar conexiones
                        ctx.strokeStyle = '#f2994a';
                        ctx.lineWidth = 2;

                        for (const [start, end] of HAND_CONNECTIONS) {
                            const startPoint = handLandmarks[start];
                            const endPoint = handLandmarks[end];
                            ctx.beginPath();
                            ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
                            ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
                            ctx.stroke();
                        }

                        // Dibujar puntos de landmarks
                        ctx.fillStyle = '#215c5c';
                        for (const landmark of handLandmarks) {
                            ctx.beginPath();
                            ctx.arc(
                                landmark.x * canvas.width,
                                landmark.y * canvas.height,
                                3, 0, 2 * Math.PI
                            );
                            ctx.fill();
                        }

                        rightHandLandmarks = handLandmarks;
                    }
                }
            }

            // 2. Procesar mano derecha para el reconocimiento (Score)
            if (rightHandLandmarks) {
                const normalizedHand = normalizeLandmarks(rightHandLandmarks);

                const newScores: Record<string, string> = {};
                let maxScore = 0;
                let detected = "";

                // Calcular scores
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
    // IV. SETUP Y CICLO DE VIDA
    // ====================================================================

    useEffect(() => {
        let setupComplete = false;

        const setupMediaPipe = () => {
            if (setupComplete) return;
            setupComplete = true;
            setIsReady(true);

            handsRef.current = new window.Hands({
                locateFile: (file: string) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });

            handsRef.current.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7,
                selfieMode: false,
                staticImageMode: false,
                smoothLandmarks: true,
                refineLandmarks: true,
            });

            handsRef.current.onResults(handleResults);

            if (videoRef.current && !cameraRef.current) {
                cameraRef.current = new window.Camera(videoRef.current, {
                    onFrame: async () => {
                        if (handsRef.current && videoRef.current) {
                            await handsRef.current.send({ image: videoRef.current });
                        }
                    },
                    width: 640,
                    height: 480,
                });
                cameraRef.current.start();
            }
        };

        const intervalId = setInterval(() => {
            if (window.Hands && window.Camera && !setupComplete) {
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

    // Efecto para controlar el inicio/detención del temporizador basado en la precisión
    useEffect(() => {
        if (!selectedLetter) return;

        const currentScore = parseFloat(scores[selectedLetter] || "0.0");
        const isTargetDetected = detectedLetter === selectedLetter;
        const currentIndex = vocals.indexOf(selectedLetter);
        const isLastVowel = currentIndex === vocals.length - 1;
        const nextVowel = !isLastVowel ? vocals[currentIndex + 1] : null;
        const isNextVowelAlreadyUnlocked = nextVowel
            ? unlockedVowels.includes(nextVowel)
            : true;

        // Condición para que el temporizador esté activo
        const shouldBeActive =
            isTargetDetected &&
            currentScore >= 88 &&
            !isLastVowel &&
            !isNextVowelAlreadyUnlocked &&
            !justUnlockedVowel;

        // Iniciar el temporizador si debe estar activo y no está corriendo
        if (shouldBeActive && unlockTimerRef.current === null) {
            console.log("✅ Iniciando temporizador de desbloqueo");
            setSecondsRemainingForUnlock(5);

            unlockTimerRef.current = setInterval(() => {
                setSecondsRemainingForUnlock((prev: number | null) => {
                    if (prev === null || prev <= 1) {
                        // Detener el intervalo
                        if (unlockTimerRef.current) {
                            clearInterval(unlockTimerRef.current);
                            unlockTimerRef.current = null;
                        }

                        // Desbloquear la vocal
                        if (prev === 1) {
                            const nextVowelIndex = currentIndex + 1;
                            if (nextVowelIndex < vocals.length) {
                                const nextVowelToUnlock = vocals[nextVowelIndex];
                                console.log("🎉 Desbloqueando vocal:", nextVowelToUnlock);

                                setUnlockedVowels((prevUnlocked) => {
                                    if (!prevUnlocked.includes(nextVowelToUnlock)) {
                                        return [...prevUnlocked, nextVowelToUnlock];
                                    }
                                    return prevUnlocked;
                                });

                                setJustUnlockedVowel(nextVowelToUnlock);
                            }
                        }
                        return 0;
                    }

                    console.log("⏱️ Segundos restantes:", prev - 1);
                    return prev - 1;
                });
            }, 1000);
        }
        // Detener el temporizador si no debe estar activo pero está corriendo
        else if (!shouldBeActive && unlockTimerRef.current !== null) {
            console.log("⏹️ Deteniendo temporizador (precisión < 90%)");
            clearInterval(unlockTimerRef.current);
            unlockTimerRef.current = null;
            setSecondsRemainingForUnlock(null);
        }
    }, [
        scores[selectedLetter],
        selectedLetter,
        detectedLetter,
        unlockedVowels,
        justUnlockedVowel,
    ]);

    // Efecto de limpieza cuando el componente se desmonta o cambia la letra seleccionada
    useEffect(() => {
        return () => {
            if (unlockTimerRef.current) {
                clearInterval(unlockTimerRef.current);
                unlockTimerRef.current = null;
            }
        };
    }, [selectedLetter]);

    // Resetear justUnlockedVowel cuando la letra seleccionada cambia
    useEffect(() => {
        setJustUnlockedVowel(null);
    }, [selectedLetter]);

    // ====================================================================
    // V. FUNCIONES DE DISPLAY Y RENDERIZADO
    // ====================================================================

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
        ];
        const index = vocals.indexOf(item);

        if (isDetected && isSelected) return "text-green-600";
        if (isDetected) return "text-black";
        if (isSelected) return colors[index % colors.length];
        return "text-gray-400";
    };

    const getDisplayName = (item: string) => {
        if (item === "espacio") return "ESP";
        if (item === "borrar") return "DEL";
        return item.toUpperCase();
    };

    const selectedVocalImg = vocalImages[selectedLetter] || vocalImages.a;

    const closePopup = () => {
        setJustUnlockedVowel(null);
    };

    return (
        <section className="p-5 w-full">
            {/* Popup de desbloqueo */}
            {justUnlockedVowel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-green-600 mb-2">
                                ¡Nueva vocal desbloqueada!
                            </h3>
                            <p className="text-gray-700 mb-6">
                                Has desbloqueado la vocal{" "}
                                <span className="font-bold text-3xl text-amber-600">
                  {justUnlockedVowel.toUpperCase()}
                </span>
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        navigate(`/vocales-practica/${justUnlockedVowel.toLowerCase()}`)
                                        window.location.href = `/vocales-practica/${justUnlockedVowel}`;
                                        closePopup();
                                    }}
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 text-center"
                                >
                                    Practicar '{justUnlockedVowel.toUpperCase()}'
                                </button>
                                <button
                                    onClick={closePopup}
                                    className="text-gray-600 hover:text-gray-800 font-medium py-2"
                                >
                                    Seguir practicando
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Camera and Detection Display */}
                <div className="vocal-practice-container">
                    <h2 className="text-xl font-semibold mb-3 text-gray-800">
                        Práctica de Vocal {selectedLetter.toUpperCase()}
                    </h2>

                    {/* Hand Detection Status */}
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
                {detectedLetter ? `✋ Detectado: ${getDisplayName(detectedLetter)}` : '⚠️ Mano derecha NO detectada'}
              </span>
                        </div>
                    </div>

                    {/* Camera Feed */}
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

                {/* Right: Target Vocal and Progress */}
                <div className="vocal-practice-container">
                    <h2 className="text-lg font-semibold mb-2 text-gray-800">
                        Vocal Objetivo
                    </h2>

                    {/* Target Vocal Card */}
                    <div className="vocal-target-card mb-4">
                        <div className="vocal-practice-sign-card">
                            <img
                                src={selectedVocalImg}
                                alt={`${selectedLetter.toUpperCase()} en señas`}
                                className="w-20 h-20 object-contain mb-2"
                            />
                            <span className="vocal-practice-sign-letter">
                {selectedLetter.toUpperCase()}
              </span>
                        </div>

                        {/* Precision Bar */}
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

                    {/* Detection Display */}
                    <div className="vocal-target-card mb-4">
                        <h3 className="text-base font-semibold text-gray-700 mb-3">
                            Mano Detectada
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

                    {/* Progress Section */}
                    <div className="vocal-target-card mb-4">
                        <h3 className="text-base font-semibold text-gray-700 mb-3">
                            Progreso de Desbloqueo
                        </h3>
                        {secondsRemainingForUnlock !== null &&
                        secondsRemainingForUnlock > 0 ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 w-full">
                                <p className="text-sm font-medium text-blue-800 mb-2">
                                    ¡Mantén la posición para desbloquear la siguiente vocal!
                                </p>
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="relative w-full max-w-xs h-4 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-1000 ease-linear"
                                            style={{
                                                width: `${(secondsRemainingForUnlock / 10) * 100}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-bold text-blue-700 w-8 text-center">
                    {secondsRemainingForUnlock}s
                  </span>
                                </div>
                                <p className="text-xs text-blue-600 mt-1">
                                    Progreso:{" "}
                                    {Math.round(((10 - secondsRemainingForUnlock) / 10) * 100)}%
                                </p>
                            </div>
                        ) : secondsRemainingForUnlock === 0 ? (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                                <p className="font-medium">¡Listo para desbloquear!</p>
                                <p className="text-sm">
                                    Mantén la posición un momento más...
                                </p>
                            </div>
                        ) : (
                            (() => {
                                const currentIndex = vocals.indexOf(selectedLetter);
                                const nextVowelIndex = currentIndex + 1;
                                if (nextVowelIndex < vocals.length) {
                                    const nextVowel = vocals[nextVowelIndex];
                                    if (unlockedVowels.includes(nextVowel)) {
                                        return (
                                            <p className="text-sm text-green-600 font-bold">
                                                ¡Vocal '{nextVowel.toUpperCase()}' desbloqueada!
                                            </p>
                                        );
                                    } else {
                                        return (
                                            <p className="text-sm text-gray-500">
                                                Practica '{selectedLetter.toUpperCase()}' para
                                                desbloquear '{nextVowel.toUpperCase()}'
                                            </p>
                                        );
                                    }
                                } else {
                                    return (
                                        <p className="text-sm text-green-600 font-bold">
                                            ¡Todas las vocales desbloqueadas!
                                        </p>
                                    );
                                }
                            })()
                        )}
                    </div>

                    {/* Scores Grid */}
                    <div className="vocal-target-card">
                        <h3 className="text-base font-semibold text-gray-700 mb-3">
                            Malla de Scores
                        </h3>
                        <div className="vocal-practice-scores-grid">
                            {itemsToTrack.map((item) => (
                                <div
                                    key={item}
                                    className={`vocal-practice-score-item ${
                                        item === selectedLetter ? "selected" : ""
                                    } ${
                                        item === detectedLetter ? "detected" : ""
                                    }`}
                                >
                                    <div
                                        className={`text-xs font-medium ${getItemColor(
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

export default VocalPracticePage;
