import { useState, useRef, useEffect, useCallback } from "react";
import type { NormalizedLandmark, Results, MediaPipeHandsInstance, VocalModel } from "../../types";
import "./PracticeWords.css";
import { useVocalContext } from '../../hooks/useVocalContext';

// Cargar todas las imágenes de src/assets/abecedario
const images = import.meta.glob("../../assets/abecedario/*-sena.png", { eager: true }) as Record<
    string,
    { default: string }
>;

// Cargar imágenes de acciones especiales
const actionImages = import.meta.glob("../../assets/abecedario/{Espacio,Borrar}.png", { eager: true }) as Record<
    string,
    { default: string }
>;

// Función para obtener la imagen de una letra
function getImage(letter: string) {
    const entry = Object.entries(images).find(([path]) =>
        path.toLowerCase().includes(`${letter.toLowerCase()}-sena.png`)
    );
    return entry ? entry[1].default : "";
}

// Función para obtener la imagen de una acción especial
function getActionImage(action: string) {
    const actionName = action === 'espacio' ? 'Espacio' : 'Borrar';
    const entry = Object.entries(actionImages).find(([path]) =>
        path.includes(`${actionName}.png`)
    );
    return entry ? entry[1].default : "";
}


// Helper functions translated from the HTML file
const normalizeLandmarks = (landmarks: NormalizedLandmark[]) => {
    if (!landmarks || landmarks.length === 0) return [];
    const cx = landmarks.reduce((sum, p) => sum + p.x, 0) / landmarks.length;
    const cy = landmarks.reduce((sum, p) => sum + p.y, 0) / landmarks.length;
    const cz = landmarks.reduce((sum, p) => sum + p.z, 0) / landmarks.length;
    let normalized = landmarks.map(p => ({ x: p.x - cx, y: p.y - cy, z: p.z - cz }));
    const maxDist = Math.max(...normalized.map(p => Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z)));
    if (maxDist === 0) return normalized; // Avoid division by zero
    normalized = normalized.map(p => ({ x: p.x / maxDist, y: p.y / maxDist, z: p.z / maxDist }));
    return normalized;
};

const compareHands = (landmarks1: NormalizedLandmark[], landmarks2: NormalizedLandmark[]) => {
    if (!landmarks1 || !landmarks2 || landmarks1.length === 0 || landmarks2.length === 0) return '0.0';
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
    const similarity = Math.max(0, Math.min(1, 1 - (totalDist / n)));
    return (similarity * 100).toFixed(1);
};

// Function to detect if left hand is closed
const isHandClosed = (landmarks: NormalizedLandmark[]) => {
    if (!landmarks || landmarks.length < 21) return false;

    // MediaPipe hand landmark indices
    // Thumb: 4, Index: 8, Middle: 12, Ring: 16, Pinky: 20
    // We'll check if fingertips are close to their respective MCP joints
    const thumbTip = landmarks[4];
    const thumbMCP = landmarks[2];
    const indexTip = landmarks[8];
    const indexMCP = landmarks[5];
    const middleTip = landmarks[12];
    const middleMCP = landmarks[9];
    const ringTip = landmarks[16];
    const ringMCP = landmarks[13];
    const pinkyTip = landmarks[20];
    const pinkyMCP = landmarks[17];

    // Calculate distances
    const thumbDist = Math.sqrt(Math.pow(thumbTip.x - thumbMCP.x, 2) + Math.pow(thumbTip.y - thumbMCP.y, 2));
    const indexDist = Math.sqrt(Math.pow(indexTip.x - indexMCP.x, 2) + Math.pow(indexTip.y - indexMCP.y, 2));
    const middleDist = Math.sqrt(Math.pow(middleTip.x - middleMCP.x, 2) + Math.pow(middleTip.y - middleMCP.y, 2));
    const ringDist = Math.sqrt(Math.pow(ringTip.x - ringMCP.x, 2) + Math.pow(ringTip.y - ringMCP.y, 2));
    const pinkyDist = Math.sqrt(Math.pow(pinkyTip.x - pinkyMCP.x, 2) + Math.pow(pinkyTip.y - pinkyMCP.y, 2));

    // Threshold for considering a finger "closed"
    const threshold = 0.05;

    // At least 4 fingers should be closed
    const closedFingers = [thumbDist, indexDist, middleDist, ringDist, pinkyDist].filter(dist => dist < threshold).length;
    return closedFingers >= 4;
};

const LetterPage = () => {
    const { vocalModels } = useVocalContext();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const handsRef = useRef<MediaPipeHandsInstance | null>(null);
    // eslint-disable-next-line
    const cameraRef = useRef<any>(null);
    const detectedLetterRef = useRef<string>('');
    // const previousLeftHandClosedRef = useRef<boolean>(false); // Ya no se necesita el trigger
    // const lastWriteTimeRef = useRef<number>(0); // Ya no se necesita el tiempo de escritura

    // All alphabet letters and special functions (usando los nombres del backend)
    const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    const specialFunctions = ['espacio', 'borrar'];
    // eslint-disable-next-line
    const allItems = [...alphabet, ...specialFunctions];

    const initialScores = allItems.reduce((acc, item) => {
        acc[item] = '0.0';
        return acc;
    }, {} as Record<string, string>);

    const [scores, setScores] = useState<Record<string, string>>(initialScores);
    const [detectedLetter, setDetectedLetter] = useState('');
    // const [writtenText, setWrittenText] = useState(''); // ELIMINADO: Ya no se necesita el texto
    const [leftHandClosed, setLeftHandClosed] = useState(false); // Se mantiene para el feedback de detección

    // Estado para el feedback visual de las cards
    const [highlightedLetter, setHighlightedLetter] = useState<string>('');
    const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Nuevo estado para el porcentaje de la letra detectada
    const [detectedScore, setDetectedScore] = useState(0);
    
    // 🔥 NUEVO ESTADO: Para la letra que se mantiene resaltada después del timeout
    const [lastSuccessfulLetter, setLastSuccessfulLetter] = useState<string>('');


    // Memoize the results handler to prevent recreation on every render
    const handleResults = useCallback((results: Results) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Ajustar dimensiones del canvas al video
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        // Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar video con efecto espejo
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        let rightHandLandmarks = null;
        let leftHandLandmarks = null;

        // Definir conexiones de la mano
        const HAND_CONNECTIONS = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Pulgar
            [0, 5], [5, 6], [6, 7], [7, 8], // Índice
            [0, 9], [9, 10], [10, 11], [11, 12], // Medio
            [0, 13], [13, 14], [14, 15], [15, 16], // Anular
            [0, 17], [17, 18], [18, 19], [19, 20], // Meñique
            [5, 9], [9, 13], [13, 17] // Conexiones entre dedos
        ];

        // Separate right and left hands
        if (results.multiHandLandmarks && results.multiHandedness) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const handLandmarks = results.multiHandLandmarks[i];
                const detectedHandedness = results.multiHandedness[i]?.label || 'Right';

                const isUserRightHand = detectedHandedness === 'Left';
                const isUserLeftHand = detectedHandedness === 'Right';

                // Dibujar conexiones
                ctx.strokeStyle = isUserRightHand ? '#f2994a' : '#cccccc';
                ctx.lineWidth = isUserRightHand ? 2 : 1;

                for (const [start, end] of HAND_CONNECTIONS) {
                    const startPoint = handLandmarks[start];
                    const endPoint = handLandmarks[end];
                    ctx.beginPath();
                    // Invertir X para que coincida con el espejo del video
                    ctx.moveTo((1 - startPoint.x) * canvas.width, startPoint.y * canvas.height);
                    ctx.lineTo((1 - endPoint.x) * canvas.width, endPoint.y * canvas.height);
                    ctx.stroke();
                }

                // Dibujar puntos de landmarks
                ctx.fillStyle = isUserRightHand ? '#215c5c' : '#999999';
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

                if (isUserRightHand) {
                    rightHandLandmarks = handLandmarks;
                } else if (isUserLeftHand) {
                    leftHandLandmarks = handLandmarks;
                }
            }
        }

        // Process right hand for letter recognition
        if (rightHandLandmarks) {
            const normalizedHand = normalizeLandmarks(rightHandLandmarks);

            const newScores: Record<string, string> = {};
            let maxScore = 0;
            let detected = '';

            // Calculate similarity scores for all letters and special functions
            for (const item of allItems) {
                const itemBase = vocalModels.find((v: VocalModel) => v.vocal === item);
                if (itemBase) {
                    const baseLandmarks = normalizeLandmarks(itemBase.landmarks);
                    const score = parseFloat(compareHands(normalizedHand, baseLandmarks));
                    newScores[item] = score.toFixed(1);
                    if (score > maxScore) {
                        maxScore = score;
                        detected = item;
                    }
                } else {
                    newScores[item] = '0.0';
                }
            }

            setScores(newScores);
            setDetectedLetter(detected);
            detectedLetterRef.current = detected;
            setDetectedScore(maxScore); // Actualizar el porcentaje detectado

            // Implementar feedback visual como en numeros/page.tsx
            if (detected && maxScore > 60) {
                setHighlightedLetter(detected);

                // Limpiar timeout anterior si existe
                if (highlightTimeoutRef.current) {
                    clearTimeout(highlightTimeoutRef.current);
                }

                // Establecer nuevo timeout para quitar el highlight Y GUARDAR la última correcta
                highlightTimeoutRef.current = setTimeout(() => {
                    setHighlightedLetter('');
                    setLastSuccessfulLetter(detected); // 🔥 Guardar la última letra exitosa
                }, 800); // 800ms de duración del highlight
            }
        } else {
            // Reset scores when no right hand is detected
            setScores(initialScores);
            setDetectedLetter('');
            detectedLetterRef.current = '';
            setDetectedScore(0); // Resetear el porcentaje
            setHighlightedLetter(''); // Limpiar highlight cuando no hay mano
        }

        // Process left hand (Se mantiene solo para el feedback visual, el trigger de escritura se elimina)
        if (leftHandLandmarks) {
            const isLeftClosed = isHandClosed(leftHandLandmarks);
            setLeftHandClosed(isLeftClosed);
            // ELIMINADO: La lógica de escritura que usaba previousLeftHandClosedRef y lastWriteTimeRef
        } else {
            setLeftHandClosed(false);
            // ELIMINADO: previousLeftHandClosedRef.current = false;
        }
    }, [vocalModels, allItems, initialScores]);

    // Initialize MediaPipe only once
    useEffect(() => {
        let setupComplete = false;

        const setupMediaPipe = () => {
            if (setupComplete) return;
            setupComplete = true;

            handsRef.current = new (window as any).Hands({ // Casting a any para acceder a Hands
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });

            // Use the non-null assertion operator '!' to tell TypeScript that handsRef.current is not null here.
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
                // Apply the non-null assertion here as well for consistency
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
            // Limpiar timeout del highlight
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
            }
            setupComplete = false;
        };
        // eslint-disable-next-line
    }, []); // Empty dependency array - setup only once

    // Update the results handler when vocalModels change
    useEffect(() => {
        if (handsRef.current) {
            handsRef.current.onResults(handleResults);
        }
    }, [handleResults]);

    // ELIMINADO: const clearText = () => { setWrittenText(''); };


    const getDisplayName = (item: string) => {
        if (item === 'espacio') return 'ESPACIO';
        if (item === 'borrar') return 'BORRAR';
        return item.toUpperCase();
    };

    // Función para obtener la clase de color de la barra de progreso
    const getProgressBarColor = (score: number) => {
        if (score > 80) return 'bg-green-500';
        if (score > 60) return 'bg-lime-500';
        if (score > 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };


    return (
        <section className="p-5 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Camera and Text Display */}
                <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-black-200 p-4">
                    <h2 className="text-xl font-semibold mb-3 text-gray-800">
                        Práctica de Señas
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
                                {detectedLetter ? `✋ Seña Detectada: ${getDisplayName(detectedLetter)}` : '⚠️ Mano derecha NO detectada'}
                            </span>
                        </div>
                        <div className={`p-3 rounded-lg flex items-center flex-1 ${
                            leftHandClosed ? 'bg-blue-50 border-2 border-blue-300' : 'bg-yellow-50 border-2 border-yellow-300'
                        }`}>
                            <div className={`w-3 h-3 rounded-full mr-2 ${
                                leftHandClosed ? 'bg-blue-500 animate-pulse' : 'bg-yellow-500'
                            }`}></div>
                            <span className={`font-semibold text-sm ${
                                leftHandClosed ? 'text-blue-700' : 'text-yellow-700'
                            }`}>
                                {leftHandClosed ? '✊ Mano izquierda cerrada' : '✋ Mano izquierda abierta'}
                            </span>
                        </div>
                    </div>

                    {/* Camera Feed */}
                    <div className="relative w-full bg-gray-900 rounded-xl overflow-hidden shadow-lg mb-4">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover hidden"
                            autoPlay
                            playsInline
                            muted
                        />
                        <canvas
                            ref={canvasRef}
                            className="w-full h-auto"
                            width="640"
                            height="480"
                        />
                    </div>

                    {/* BARRA DE PORCENTAJES AÑADIDA AQUÍ */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-4">
                        <h3 className="text-base font-semibold text-gray-700 mb-3">
                            Precisión de la Seña Detectada
                        </h3>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${
                                        getProgressBarColor(detectedScore).replace('bg', 'text') // Usar el mismo color para el texto
                                    }`}>
                                        {detectedLetter ? getDisplayName(detectedLetter) : 'Sin Seña'}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-bold inline-block ${
                                        getProgressBarColor(detectedScore).replace('bg', 'text') // Usar el mismo color para el texto
                                    }`}>
                                        {detectedScore.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-3 mb-4 text-xs flex rounded bg-gray-200">
                                <div
                                    style={{ width: `${detectedScore}%` }}
                                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${getProgressBarColor(detectedScore)}`}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Alphabet Cards - Contenedor Expandido con Espaciado Correcto */}
                <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-black-200 p-3">
                    <h2 className="text-lg font-semibold mb-2 text-gray-800">
                        Letras del Alfabeto
                    </h2>

                    {/* Alphabet Cards - Espaciado visible entre cards manteniendo tamaño original */}
                    <div className="grid grid-cols-6 gap-4 mb-4">
                        {alphabet.map((letter) => {
                            const isDetected = letter === detectedLetter;
                            const isHighlighted = letter === highlightedLetter;
                            // 🔥 NUEVA COMPROBACIÓN: Resaltado persistente si no está en el highlight temporal
                            const isLastSuccessful = letter === lastSuccessfulLetter && !isHighlighted; 
                            const score = parseFloat(scores[letter] || '0');
                            const imageUrl = getImage(letter);
                            return (
                                <div
                                    key={letter}
                                    className={`sign-card !w-auto !h-auto min-w-[60px] min-h-[80px] transition-all duration-300 ${
                                        isDetected ? 'ring-2 ring-amber-400 ring-offset-2 scale-105' : ''
                                    } ${
                                        isHighlighted ? 'bg-gradient-to-br from-green-200 to-green-300 shadow-lg scale-110 ring-2 ring-green-400' : ''
                                    } ${
                                        // Aplicar el resaltado persistente
                                        isLastSuccessful ? 'bg-blue-100 border border-blue-300' : ''
                                    }`}
                                    style={{ width: 'auto', height: 'auto' }}
                                >
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={`${letter} en señas`}
                                            className="w-10 h-10 object-contain mb-1"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mb-1">
                                            <span className="text-base font-bold text-gray-400">{letter.toUpperCase()}</span>
                                        </div>
                                    )}
                                    <span className="sign-letter text-xs">{letter.toUpperCase()}</span>
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

                    {/* Special Actions Cards - Con imágenes coherentes con el abecedario */}
                    <div className="border-t border-gray-300 pt-3">
                        <h3 className="text-base font-semibold text-gray-700 mb-2">Acciones Especiales</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {specialFunctions.map((func) => {
                                const isDetected = func === detectedLetter;
                                const isHighlighted = func === highlightedLetter;
                                // 🔥 NUEVA COMPROBACIÓN: Resaltado persistente si no está en el highlight temporal
                                const isLastSuccessful = func === lastSuccessfulLetter && !isHighlighted; 
                                const score = parseFloat(scores[func] || '0');
                                const actionImageUrl = getActionImage(func);
                                return (
                                    <div
                                        key={func}
                                        className={`sign-card !w-auto !h-auto min-w-[60px] min-h-[80px] transition-all duration-300 ${
                                            isDetected
                                                ? 'ring-2 ring-amber-400 ring-offset-2 scale-105'
                                                : ''
                                        } ${
                                            isHighlighted ? 'bg-gradient-to-br from-green-200 to-green-300 shadow-lg scale-110 ring-2 ring-green-400' : ''
                                        } ${
                                            // Aplicar el resaltado persistente
                                            isLastSuccessful ? 'bg-blue-100 border border-blue-300' : ''
                                        }`}
                                        style={{ width: 'auto', height: 'auto' }}
                                    >
                                        {actionImageUrl ? (
                                            <img
                                                src={actionImageUrl}
                                                alt={`${func} en señas`}
                                                className="w-10 h-10 object-contain mb-1"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mb-1">
                                                <span className="text-base font-bold text-gray-400">
                                                    {func === 'espacio' ? '␣' : '⌫'}
                                                </span>
                                            </div>
                                        )}
                                        <span className="sign-letter text-xs">
                                            {func === 'espacio' ? 'ESPACIO' : 'BORRAR'}
                                        </span>
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

export default LetterPage;