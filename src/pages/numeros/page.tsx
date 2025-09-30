import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useVocalContext } from '../../hooks/useVocalContext';
import { type VocalModel, type NormalizedLandmark, type Results, type MediaPipeHandsInstance } from '../../types';

// Cargar todas las imágenes de números
const images = import.meta.glob("../../assets/numeros/*-sena.png", { eager: true }) as Record<
  string,
  { default: string }
>;

// Función para obtener la imagen de un número
function getImage(number: string) {
  const entry = Object.entries(images).find(([path]) =>
    path.toLowerCase().includes(`${number}-sena.png`)
  );
  return entry ? entry[1].default : "";
}

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

const NumbersPage = () => {
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

    const initialScores = allMathItems.reduce((acc: Record<string, string>, item: string) => {
        acc[item] = '0.0';
        return acc;
    }, {} as Record<string, string>);

    const [scores, setScores] = useState<Record<string, string>>(initialScores);
    const [detectedSymbol, setDetectedSymbol] = useState('');
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

    const clearExpression = () => {
        setCurrentExpression('');
        setResult(null);
    };


    const getDisplayName = (item: string) => {
        if (item === '*') return '×';
        if (item === '/') return '÷';
        if (item === '-') return '−';
        if (item === 'borrar') return 'DEL';
        return item;
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
            detectedSymbolRef.current = detected;
        } else {
            setScores(initialScores);
            setDetectedSymbol('');
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

    return (
        <section className="p-5 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: Camera and Text Display */}
            <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-black-200 p-4">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                Operaciones Matematicas
              </h2>

              {/* Hand Detection Status */}
              <div className="mb-3 flex gap-2">
                <div className={`p-3 rounded-lg flex items-center flex-1 ${
                  detectedSymbol ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'
                }`}>
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    detectedSymbol ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                  <span className={`font-semibold text-sm ${
                    detectedSymbol ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {detectedSymbol ? `✋ Detectado: ${getDisplayName(detectedSymbol)}` : '⚠️ Mano derecha NO detectada'}
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
                    {leftHandClosed ? '✊ Listo para escribir' : '✋ Esperando acción'}
                  </span>
                </div>
              </div>

              {/* Camera Feed */}
              <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-lg mb-4">
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
                  width="576"
                  height="432"
                />
              </div>

              {/* Text Display con Botones - Sin Espacio Vertical Sobrante */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200">
                {/* Título y Botones en la misma línea */}
                <div className="flex justify-between items-center p-2 pb-1">
                  <h3 className="text-base font-semibold text-gray-700">Expresión Matemática</h3>
                  <div className="flex gap-1.5">
                    <Link
                      to="/home"
                      className="px-2 py-1 text-xs font-medium text-amber-600 hover:text-white hover:bg-amber-600 rounded transition-all duration-200 border border-amber-600 flex items-center gap-1"
                    >
                      <span>←</span> Volver
                    </Link>
                    <button
                      onClick={clearExpression}
                      className="px-2 py-1 text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 rounded transition-all duration-200 border border-red-600 flex items-center gap-1"
                    >
                      🗑️ Limpiar
                    </button>
                  </div>
                </div>
                
                {/* Campo de Texto - Altura exacta sin espacio sobrante */}
                <div className="px-2 pb-2">
                  <div className="p-2 border-2 border-dashed border-gray-300 rounded-lg bg-white/80">
                    <p className={`text-base font-mono break-words leading-normal ${
                      !currentExpression ? 'text-gray-400 italic' : 'text-gray-800'
                    }`}>
                      {currentExpression || 'La expresión aparecerá aquí cuando cierres la mano izquierda...'}
                    </p>
                    {result !== null && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-green-600 font-bold text-lg">
                          = {result}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* History - Compacto */}
                  {history.length > 0 && (
                    <div className="mt-2">
                      <div className="text-gray-600 text-xs mb-1">Historial reciente:</div>
                      <div className="max-h-12 overflow-y-auto space-y-1">
                        {history.slice(-2).map((calc, index) => (
                          <div key={index} className="text-xs font-mono text-gray-600 bg-gray-50 p-1 rounded">
                            {calc}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

        {/* Right: Mathematical Signs - Contenedor Expandido con Espaciado Correcto */}
        <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-black-200 p-3">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">
            Lenguaje de Señas Matemático
          </h2>

          {/* Number Cards - Espaciado visible entre cards manteniendo tamaño original */}
          <div className="grid grid-cols-5 gap-4 mb-4">
                {numbers.map((number) => {
                  const isDetected = number === detectedSymbol;
                  const score = parseFloat(scores[number] || '0');
                  const imageUrl = getImage(number);
                  return (
                    <div 
                      key={number}
                      className={`sign-card !w-auto !h-auto min-w-[60px] min-h-[80px] transition-all duration-300 ${
                        isDetected ? 'ring-2 ring-amber-400 ring-offset-2 scale-105' : ''
                      }`}
                      style={{ width: 'auto', height: 'auto' }}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${number} en señas`}
                          className="w-10 h-10 object-contain mb-1"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mb-1">
                          <span className="text-base font-bold text-gray-400">{number}</span>
                        </div>
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
            <div className="grid grid-cols-3 gap-4">
                  {operators.map((operator) => {
                    const isDetected = operator === detectedSymbol;
                    const score = parseFloat(scores[operator] || '0');
                    return (
                      <div 
                        key={operator}
                        className={`sign-card !w-auto !h-auto min-w-[60px] min-h-[80px] transition-all duration-300 ${
                          isDetected ? 'ring-2 ring-amber-400 ring-offset-2 scale-105' : ''
                        }`}
                        style={{ width: 'auto', height: 'auto' }}
                      >
                        <img 
                          src={`/assets/numeros/${getImageName(operator)}`}
                          alt={`Señal ${operator}`}
                          className="w-10 h-10 object-contain mb-1"
                          onError={handleImageError}
                        />
                        <span className="sign-letter text-xs">
                          {getDisplayName(operator)}
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
                        className={`sign-card !w-auto !h-auto min-w-[60px] min-h-[80px] transition-all duration-300 ${
                          isDetected ? 'ring-2 ring-amber-400 ring-offset-2 scale-105' : ''
                        }`}
                        style={{ width: 'auto', height: 'auto' }}
                      >
                        <img 
                          src="/assets/numeros/borrar-sena.png"
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