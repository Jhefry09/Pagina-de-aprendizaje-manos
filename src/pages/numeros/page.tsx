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

    // Mathematical symbols and numbers - removed interCambiar, added borrar
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const operators = ['+', '-', '*', '/', '=', '.'];
    const specialFunctions = ['borrar']; // Removed interCambiar
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
    // Remove this line that's causing the TypeScript error:
    // const [showingFirstOperand, setShowingFirstOperand] = useState(true);

    // Function to safely evaluate mathematical expression
    const evaluateExpression = (expression: string): string => {
        try {
            // Replace display symbols with JS operators
            let jsExpression = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-');

            // Basic validation - only allow numbers, operators, and decimal points
            if (!/^[\d+\-*/.() ]+$/.test(jsExpression)) {
                return 'Error: Expresión inválida';
            }

            // Evaluate using Function constructor for safety
            const evalResult = Function('"use strict"; return (' + jsExpression + ')')();

            if (typeof evalResult !== 'number' || !isFinite(evalResult)) {
                return 'Error: Resultado inválido';
            }

            return Number.isInteger(evalResult) ? evalResult.toString() : evalResult.toFixed(4);
        } catch (error) {
            return 'Error: Operación inválida';
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

        // Process right hand for symbol recognition
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

        // Process left hand for input trigger
        if (leftHandLandmarks) {
            const isLeftClosed = isHandClosed(leftHandLandmarks);
            setLeftHandClosed(isLeftClosed);

            const currentTime = Date.now();
            const timeSinceLastWrite = currentTime - lastWriteTimeRef.current;
            const minWriteInterval = 500;

            // En el handleResults callback, dentro de la lógica de la mano izquierda:
            if (isLeftClosed && !previousLeftHandClosedRef.current && detectedSymbolRef.current && rightHandLandmarks && timeSinceLastWrite >= minWriteInterval) {
                const detectedItem = detectedSymbolRef.current;

                if (detectedItem === 'borrar') {
                    // Borra el último carácter de la expresión (NO escribe "borrar")
                    setCurrentExpression(prev => prev.slice(0, -1));
                    setResult(null); // Limpia el resultado cuando se modifica la expresión
                } else if (detectedItem === '=') {
                    if (currentExpression.trim()) {
                        const calculatedResult = evaluateExpression(currentExpression);
                        setResult(calculatedResult);
                        setHistory(prev => [...prev, `${currentExpression} = ${calculatedResult}`]);
                    }
                } else {
                    // Agregar número u operador a la expresión
                    let displaySymbol = detectedItem;
                    if (detectedItem === '*') displaySymbol = '×';
                    if (detectedItem === '/') displaySymbol = '÷';
                    if (detectedItem === '-') displaySymbol = '−';

                    setCurrentExpression(prev => prev + displaySymbol);
                    setResult(null); // Limpiar resultado previo al agregar nueva entrada
                }

                lastWriteTimeRef.current = currentTime;
            }
            previousLeftHandClosedRef.current = isLeftClosed;
        } else {
            setLeftHandClosed(false);
            previousLeftHandClosedRef.current = false;
        }
    }, [vocalModels, allMathItems, initialScores, currentExpression]); // Removed showingFirstOperand from dependencies

// ... rest of existing code ...
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

    // Helper function to get item color and display name
    const getItemColor = (item: string, isDetected: boolean = false) => {
        if (numbers.includes(item)) {
            return isDetected ? 'text-blue-600 font-bold' : 'text-blue-500';
        }
        if (['+', '-', '*', '/', '='].includes(item)) {
            return isDetected ? 'text-orange-600 font-bold' : 'text-orange-500';
        }
        if (item === '.') {
            return isDetected ? 'text-green-600 font-bold' : 'text-green-500';
        }
        if (item === 'borrar') {
            return isDetected ? 'text-red-600 font-bold' : 'text-red-500';
        }
        return isDetected ? 'text-gray-800 font-bold' : 'text-gray-600';
    };

    const getDisplayName = (item: string) => {
        if (item === '*') return '×';
        if (item === '/') return '÷';
        if (item === '-') return '−';
        if (item === 'borrar') return 'DEL';
        return item;
    };

    return (
        <section className="p-6 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-700 font-montserrat">
                        Calculadora con <span className="text-[#f2994a]">Lenguaje de Señas</span>
                    </h1>
                    <p className="text-gray-600">
                        Usa tu mano derecha para formar números y operadores, cierra la mano izquierda para ejecutar
                    </p>
                </div>
                <Link
                    to="/"
                    className="px-4 py-2 text-sm font-semibold text-[#f2994a] hover:text-white hover:bg-[#f2994a] rounded-lg transition-all duration-300 border border-[#f2994a]"
                >
                    Volver al Inicio
                </Link>
            </div>

            {/* Calculator Display */}
            <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-700">Calculadora</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={deleteLast}
                            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                        >
                            Borrar último
                        </button>
                        <button
                            onClick={clearExpression}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                {/* Expression Display */}
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                    <div className="text-right">
                        <div className="text-sm text-gray-600 mb-2">Expresión:</div>
                        <div className="text-2xl font-mono tracking-wide text-gray-800 min-h-[2rem]">
                            {currentExpression || '0'}
                        </div>
                    </div>
                </div>

                {/* Result Display */}
                {result !== null && (
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                        <div className="text-right">
                            <div className="text-sm text-blue-600 mb-1">Resultado:</div>
                            <div className="text-3xl font-bold text-blue-800">
                                {result}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hand Status Indicators */}
            <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="font-medium text-gray-700 mb-2">Mano Derecha (Detección)</h3>
                    <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${detectedSymbol ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm">
              {detectedSymbol ? `Detectando: ${getDisplayName(detectedSymbol)}` : 'No detectada'}
            </span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="font-medium text-gray-700 mb-2">Mano Izquierda (Ejecutar)</h3>
                    <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${leftHandClosed ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm">{leftHandClosed ? 'Cerrada (Ejecutando)' : 'Abierta'}</span>
                    </div>
                </div>
            </div>

            {/* Precision Indicator */}
            <div className="my-6 bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Precisión:</span>
                    <span className="font-bold">{scores[detectedSymbol] || '0.0'}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                        className="h-full transition-all duration-300 bg-blue-500"
                        style={{ width: `${highestScore}%` }}
                    />
                </div>
            </div>

            {/* Camera View */}
            <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mx-auto mb-6 shadow-lg" style={{ maxWidth: '640px' }}>
                <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" autoPlay playsInline muted />
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]" width="640" height="480" />
            </div>

            {/* Math Symbols Grid */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Precisión por Símbolo:</h3>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
                    <div className="space-y-4">
                        {/* Numbers */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2 px-1">Números:</h4>
                            <div className="grid grid-cols-5 gap-2">
                                {numbers.map((number) => (
                                    <div key={number} className="text-center p-2 rounded border-2 border-transparent hover:border-gray-300 transition-all">
                                        <div className={`text-lg font-medium ${getItemColor(number, number === detectedSymbol)}`}>
                                            {number}
                                        </div>
                                        <div className={`text-xs font-bold ${getItemColor(number, number === detectedSymbol)}`}>
                                            {scores[number] || '0.0'}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Operators */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2 px-1">Operadores:</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {operators.map((op) => (
                                    <div key={op} className="text-center p-3 rounded border-2 border-transparent hover:border-gray-300 transition-all">
                                        <div className={`text-lg font-medium ${getItemColor(op, op === detectedSymbol)}`}>
                                            {getDisplayName(op)}
                                        </div>
                                        <div className={`text-xs font-bold ${getItemColor(op, op === detectedSymbol)}`}>
                                            {scores[op] || '0.0'}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Special Functions */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2 px-1">Funciones Especiales:</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {specialFunctions.map((func) => (
                                    <div key={func} className="text-center p-3 rounded border-2 border-transparent hover:border-gray-300 transition-all">
                                        <div className={`text-sm font-medium ${getItemColor(func, func === detectedSymbol)}`}>
                                            {getDisplayName(func)} - Borrar último carácter
                                        </div>
                                        <div className={`text-xs font-bold ${getItemColor(func, func === detectedSymbol)}`}>
                                            {scores[func] || '0.0'}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Detection Display */}
            <div className="text-center mb-6">
                <p className="text-lg font-medium text-gray-700 mb-1">Símbolo detectado:</p>
                <div className={`text-4xl font-bold ${getItemColor(detectedSymbol, true)}`}>
                    {detectedSymbol ? getDisplayName(detectedSymbol) : '—'}
                </div>
                {detectedSymbol && (
                    <p className="text-sm text-gray-600 mt-2">
                        Cierra la mano izquierda para añadir a la expresión
                    </p>
                )}
            </div>

            {/* History */}
            {history.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-700">Historial de Cálculos</h3>
                        <button
                            onClick={clearHistory}
                            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                            Limpiar Historial
                        </button>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                        {history.slice(-5).map((calc, index) => (
                            <div key={index} className="text-sm font-mono text-gray-700 p-2 bg-gray-50 rounded">
                                {calc}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-blue-600">{currentExpression.length}</div>
                        <div className="text-sm text-gray-600">Caracteres</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-green-600">{highestScore.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Precisión actual</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-purple-600">{history.length}</div>
                        <div className="text-sm text-gray-600">Cálculos realizados</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MathCalculatorPage;