import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useVocalContext } from '../../hooks/useVocalContext';
import { type VocalModel, type NormalizedLandmark, type Results, type MediaPipeHandsInstance } from '../../types';

// Helper functions for hand recognition
const normalizeLandmarks = (landmarks: NormalizedLandmark[]) => {
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

    const thumbDist = Math.sqrt(Math.pow(thumbTip.x - thumbMCP.x, 2) + Math.pow(thumbTip.y - thumbMCP.y, 2));
    const indexDist = Math.sqrt(Math.pow(indexTip.x - indexMCP.x, 2) + Math.pow(indexTip.y - indexMCP.y, 2));
    const middleDist = Math.sqrt(Math.pow(middleTip.x - middleMCP.x, 2) + Math.pow(middleTip.y - middleMCP.y, 2));
    const ringDist = Math.sqrt(Math.pow(ringTip.x - ringMCP.x, 2) + Math.pow(ringTip.y - ringMCP.y, 2));
    const pinkyDist = Math.sqrt(Math.pow(pinkyTip.x - pinkyMCP.x, 2) + Math.pow(pinkyTip.y - pinkyMCP.y, 2));

    const threshold = 0.05;
    const closedFingers = [thumbDist, indexDist, middleDist, ringDist, pinkyDist].filter(dist => dist < threshold).length;
    return closedFingers >= 4;
};

const MathCalculatorPage = () => {
    const { vocalModels } = useVocalContext();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const handsRef = useRef<MediaPipeHandsInstance | null>(null);
    const cameraRef = useRef<any>(null);
    const detectedSymbolRef = useRef<string>('');
    const previousLeftHandClosedRef = useRef<boolean>(false);
    const lastWriteTimeRef = useRef<number>(0);

    // Mathematical symbols and numbers
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const operators = ['+', '-', '*', '/', '=', '.'];
    const specialFunctions = ['borrar'];
    const allMathItems = [...numbers, ...operators, ...specialFunctions];

    const initialScores = allMathItems.reduce((acc, item) => {
        acc[item] = '0.0';
        return acc;
    }, {} as Record<string, string>);

    const [scores, setScores] = useState<Record<string, string>>(initialScores);
    const [detectedSymbol, setDetectedSymbol] = useState('');
    const [highestScore, setHighestScore] = useState(0);
    const [currentExpression, setCurrentExpression] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [leftHandClosed, setLeftHandClosed] = useState(false);

    // Function to safely evaluate mathematical expression
    const evaluateExpression = (expression: string): string => {
        try {
            let jsExpression = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-');

            if (!/^[\d+\-*/.() ]+$/.test(jsExpression)) {
                return 'Error: Expresión inválida';
            }

            const evalResult = Function('"use strict"; return (' + jsExpression + ')')();

            if (typeof evalResult !== 'number' || !isFinite(evalResult)) {
                return 'Error: Resultado inválido';
            }

            return Number.isInteger(evalResult) ? evalResult.toString() : evalResult.toFixed(4);
        } catch (error) {
            return 'Error: Operación inválida';
        }
    };

    // Helper function to get image name for operators
    const getImageName = (operator: string): string => {
        const imageMap: Record<string, string> = {
            '+': 'mas-sena.png',
            '-': 'menos-sena.png', 
            '*': 'mult-sena.png',
            '/': 'div-sena.png',
            '=': 'igual-sena.png',
            '.': 'punto-sena.png'
        };
        return imageMap[operator] || 'default-sena.png';
    };

    // Image error handler
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.currentTarget;
        target.style.display = 'none';
        const nextElement = target.nextElementSibling as HTMLElement;
        if (nextElement) {
            nextElement.style.display = 'inline';
        }
    };

    // Special image error handler for the delete button
    const handleDeleteImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.currentTarget;
        target.style.display = 'none';
        const nextElement = target.nextElementSibling as HTMLElement;
        if (nextElement) {
            nextElement.style.display = 'inline';
        }
    };

    // Memoize the results handler
    const handleResults = useCallback((results: Results) => {
        const canvasCtx = canvasRef.current?.getContext('2d');
        if (!canvasCtx || !canvasRef.current) return;

        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        let rightHandLandmarks = null;
        let leftHandLandmarks = null;

        if (results.multiHandLandmarks && results.multiHandedness) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const handLandmarks = results.multiHandLandmarks[i];
                const detectedHandedness = results.multiHandedness[i]?.label || 'Right';

                const isUserRightHand = detectedHandedness === 'Left';
                const isUserLeftHand = detectedHandedness === 'Right';

                window.drawConnectors(canvasCtx, handLandmarks, window.HAND_CONNECTIONS, {
                    color: isUserRightHand ? '#f2994a' : '#2196f3',
                    lineWidth: 2
                });
                window.drawLandmarks(canvasCtx, handLandmarks, {
                    color: isUserRightHand ? '#215c5c' : '#1565c0',
                    lineWidth: 1
                });

                if (isUserRightHand) {
                    rightHandLandmarks = handLandmarks;
                } else if (isUserLeftHand) {
                    leftHandLandmarks = handLandmarks;
                }
            }
        }

        if (rightHandLandmarks) {
            const normalizedHand = normalizeLandmarks(rightHandLandmarks);

            const newScores: Record<string, string> = {};
            let maxScore = 0;
            let detected = '';

            for (const item of allMathItems) {
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
            setDetectedSymbol(detected);
            setHighestScore(maxScore);
            detectedSymbolRef.current = detected;
        } else {
            setScores(initialScores);
            setDetectedSymbol('');
            setHighestScore(0);
            detectedSymbolRef.current = '';
        }

        if (leftHandLandmarks) {
            const isLeftClosed = isHandClosed(leftHandLandmarks);
            setLeftHandClosed(isLeftClosed);

            const currentTime = Date.now();
            const timeSinceLastWrite = currentTime - lastWriteTimeRef.current;
            const minWriteInterval = 500;

            if (isLeftClosed && !previousLeftHandClosedRef.current && detectedSymbolRef.current && rightHandLandmarks && timeSinceLastWrite >= minWriteInterval) {
                const detectedItem = detectedSymbolRef.current;

                if (detectedItem === 'borrar') {
                    setCurrentExpression(prev => prev.slice(0, -1));
                    setResult(null);
                } else if (detectedItem === '=') {
                    if (currentExpression.trim()) {
                        const calculatedResult = evaluateExpression(currentExpression);
                        setResult(calculatedResult);
                        setHistory(prev => [...prev, `${currentExpression} = ${calculatedResult}`]);
                    }
                } else {
                    let displaySymbol = detectedItem;
                    if (detectedItem === '*') displaySymbol = '×';
                    if (detectedItem === '/') displaySymbol = '÷';
                    if (detectedItem === '-') displaySymbol = '−';

                    setCurrentExpression(prev => prev + displaySymbol);
                    setResult(null);
                }

                lastWriteTimeRef.current = currentTime;
            }
            previousLeftHandClosedRef.current = isLeftClosed;
        } else {
            setLeftHandClosed(false);
            previousLeftHandClosedRef.current = false;
        }
    }, [vocalModels, allMathItems, initialScores, currentExpression]);

    useEffect(() => {
        let setupComplete = false;

        const setupMediaPipe = () => {
            if (setupComplete) return;
            setupComplete = true;

            handsRef.current = new window.Hands({
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });

            handsRef.current.setOptions({
                maxNumHands: 2,
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
                        if (videoRef.current && handsRef.current) {
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
    }, []);

    useEffect(() => {
        if (handsRef.current) {
            handsRef.current.onResults(handleResults);
        }
    }, [handleResults]);

    const clearExpression = () => {
        setCurrentExpression('');
        setResult(null);
    };

    const clearHistory = () => {
        setHistory([]);
    };

    const deleteLast = () => {
        setCurrentExpression(prev => prev.slice(0, -1));
        setResult(null);
    };

    const getDisplayName = (item: string) => {
        if (item === '*') return '×';
        if (item === '/') return '÷';
        if (item === '-') return '−';
        if (item === 'borrar') return 'DEL';
        return item;
    };

    return (
        <section className="p-4 min-h-screen bg-gray-800">
            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white">
                        SECCION REALIZAR OPERACIONES
                    </h1>
                    <Link
                        to="/"
                        className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        Volver
                    </Link>
                </div>
                <div className="flex items-center text-sm text-gray-300 mt-2">
                    <span className="mr-4">Start</span>
                    <span className="mr-4">Learn AI</span>
                    <span className="mr-4">Inicio</span>
                    <span className="mr-4">Clases</span>
                    <span className="mr-4">Entrenar IA</span>
                    <span className="mr-4">Usuarios</span>
                    <span className="mr-4">Configuracion</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Columna izquierda - Cámara y Calculadora */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Cámara */}
                    <div className="bg-gray-900 rounded-lg p-4">
                        <h2 className="text-blue-400 text-sm mb-3 flex items-center">
                            <span className="mr-2">📷</span> Camara
                        </h2>
                        <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                            <video 
                                ref={videoRef} 
                                className="w-full h-full object-cover transform scale-x-[-1]" 
                                autoPlay 
                                playsInline 
                                muted 
                            />
                            <canvas 
                                ref={canvasRef} 
                                className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]" 
                                width="640" 
                                height="480" 
                            />
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-3">
                            <div className="w-full bg-gray-700 rounded-full h-1">
                                <div 
                                    className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
                                    style={{ width: `${highestScore}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Calculadora */}
                    <div className="bg-gray-900 rounded-lg p-4">
                        <h2 className="text-blue-400 text-sm mb-3">Calculadora</h2>
                        
                        {/* Display */}
                        <div className="bg-black rounded-lg p-4 mb-4">
                            <div className="text-right">
                                <div className="text-gray-400 text-sm mb-1">Expresión:</div>
                                <div className="text-white text-xl font-mono min-h-[1.5rem] break-words">
                                    {currentExpression || '0'}
                                </div>
                                {result !== null && (
                                    <>
                                        <div className="text-blue-400 text-sm mt-2 mb-1">Resultado:</div>
                                        <div className="text-green-400 text-2xl font-bold break-words">
                                            {result}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Controles */}
                        <div className="space-y-2 mb-4">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={deleteLast}
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-2 px-3 rounded transition-colors"
                                >
                                    Borrar último
                                </button>
                                <button
                                    onClick={clearExpression}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded transition-colors"
                                >
                                    Limpiar
                                </button>
                            </div>
                            
                            {/* Estado de manos */}
                            <div className="text-xs text-gray-300 space-y-1 bg-gray-800 p-2 rounded">
                                <div className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full mr-2 ${detectedSymbol ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                    <span>Derecha: {detectedSymbol ? getDisplayName(detectedSymbol) : 'Sin detectar'}</span>
                                </div>
                                <div className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full mr-2 ${leftHandClosed ? 'bg-blue-400' : 'bg-gray-500'}`}></div>
                                    <span>Izquierda: {leftHandClosed ? 'Cerrada' : 'Abierta'}</span>
                                </div>
                                <div className="text-center text-yellow-300 font-bold">
                                    Precisión: {scores[detectedSymbol] || '0.0'}%
                                </div>
                            </div>
                        </div>

                        {/* Historial */}
                        {history.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400 text-xs">Historial</span>
                                    <button
                                        onClick={clearHistory}
                                        className="text-red-400 hover:text-red-300 text-xs"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                                <div className="max-h-24 overflow-y-auto space-y-1">
                                    {history.slice(-3).map((calc, index) => (
                                        <div key={index} className="text-xs font-mono text-gray-300 bg-gray-800 p-2 rounded">
                                            {calc}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna derecha - Lenguaje de señas */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-900 rounded-lg p-4 h-full">
                        <h2 className="text-blue-400 text-sm mb-3">Lenguaje de señas</h2>
                        
                        {/* Grid de números 4x4 */}
                        <div className="grid grid-cols-4 gap-1 mb-3">
                            {numbers.map((num) => (
                                <div 
                                    key={num}
                                    className={`bg-blue-600 rounded-lg p-3 flex flex-col items-center justify-center transition-all ${
                                        detectedSymbol === num ? 'ring-2 ring-yellow-400 bg-blue-500' : 'hover:bg-blue-700'
                                    }`}
                                    style={{ minHeight: '60px' }}
                                >
                                    <img 
                                        src={`/src/assets/numeros/${num}-sena.png`}
                                        alt={`Señal ${num}`}
                                        className="w-6 h-6 object-contain mb-1"
                                        onError={handleImageError}
                                    />
                                    <span className={`text-white text-xs font-bold ${detectedSymbol === num ? 'text-yellow-300' : ''}`}>
                                        {num}
                                    </span>
                                    <span className="text-blue-200 text-xs">{scores[num]}%</span>
                                </div>
                            ))}
                        </div>

                        {/* Operadores - grid 3x2 */}
                        <div className="grid grid-cols-3 gap-1 mb-3">
                            {['+', '-', '*', '/', '=', '.'].map((op) => (
                                <div 
                                    key={op}
                                    className={`bg-orange-600 rounded-lg p-2 flex flex-col items-center justify-center transition-all ${
                                        detectedSymbol === op ? 'ring-2 ring-yellow-400 bg-orange-500' : 'hover:bg-orange-700'
                                    }`}
                                    style={{ minHeight: '45px' }}
                                >
                                    <img 
                                        src={`/src/assets/numeros/${getImageName(op)}`}
                                        alt={`Señal ${op}`}
                                        className="w-5 h-5 object-contain mb-1"
                                        onError={handleImageError}
                                    />
                                    <span className={`text-white font-bold text-sm ${detectedSymbol === op ? 'text-yellow-300' : ''}`}>
                                        {getDisplayName(op)}
                                    </span>
                                    <span className="text-orange-200 text-xs">{scores[op]}%</span>
                                </div>
                            ))}
                        </div>

                        {/* Función especial - Borrar */}
                        <div className="grid grid-cols-1 gap-1">
                            <div 
                                className={`bg-red-700 rounded-lg p-3 flex items-center justify-center transition-all ${
                                    detectedSymbol === 'borrar' ? 'ring-2 ring-yellow-400 bg-red-600' : 'hover:bg-red-800'
                                }`}
                            >
                                <img 
                                    src="/src/assets/numeros/borrar-sena.png"
                                    alt="Señal borrar"
                                    className="w-6 h-6 object-contain mr-2"
                                    onError={handleDeleteImageError}
                                />
                                <span className="text-white text-lg mr-2" style={{ display: 'none' }}>🗑️</span>
                                <span className={`text-white font-bold text-sm ${detectedSymbol === 'borrar' ? 'text-yellow-300' : ''}`}>
                                    Borrar
                                </span>
                                <span className="text-red-200 text-xs ml-2">{scores.borrar}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MathCalculatorPage;