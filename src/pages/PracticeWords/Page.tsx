import { useState, useRef, useEffect, useCallback } from 'react';
import {  Link } from 'react-router-dom';
import { useVocalContext } from '../../hooks/useVocalContext';
import { type VocalModel, type NormalizedLandmark, type Results, type MediaPipeHandsInstance } from '../../types';

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

const PracticePage = () => {
  const { vocalModels } = useVocalContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<MediaPipeHandsInstance | null>(null);
  const cameraRef = useRef<any>(null);
  const detectedLetterRef = useRef<string>('');
  const previousLeftHandClosedRef = useRef<boolean>(false);
  const lastWriteTimeRef = useRef<number>(0);

  // All alphabet letters and special functions (usando los nombres del backend)
  const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  const specialFunctions = ['espacio', 'borrar']; // Cambiado a minúsculas para coincidir con el backend
  const allItems = [...alphabet, ...specialFunctions];
  
  const initialScores = allItems.reduce((acc, item) => {
    acc[item] = '0.0';
    return acc;
  }, {} as Record<string, string>);

  const [scores, setScores] = useState<Record<string, string>>(initialScores);
  const [detectedLetter, setDetectedLetter] = useState('');
  const [writtenText, setWrittenText] = useState('');
  const [leftHandClosed, setLeftHandClosed] = useState(false);
  
  // Estado para el feedback visual de las cards
  const [highlightedLetter, setHighlightedLetter] = useState<string>('');
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize the results handler to prevent recreation on every render
  const handleResults = useCallback((results: Results) => {
    const canvasCtx = canvasRef.current?.getContext('2d');
    if (!canvasCtx || !canvasRef.current) return;

    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    let rightHandLandmarks = null;
    let leftHandLandmarks = null;

    // Separate right and left hands
    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const handLandmarks = results.multiHandLandmarks[i];
        const detectedHandedness = results.multiHandedness[i]?.label || 'Right';
        
        const isUserRightHand = detectedHandedness === 'Left';
        const isUserLeftHand = detectedHandedness === 'Right';
        
        // Draw hand connections and landmarks
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
      
      // Implementar feedback visual como en numeros/page.tsx
      if (detected && maxScore > 60) {
        setHighlightedLetter(detected);
        
        // Limpiar timeout anterior si existe
        if (highlightTimeoutRef.current) {
          clearTimeout(highlightTimeoutRef.current);
        }
        
        // Establecer nuevo timeout para quitar el highlight
        highlightTimeoutRef.current = setTimeout(() => {
          setHighlightedLetter('');
        }, 800); // 800ms de duración del highlight
      }
    } else {
      // Reset scores when no right hand is detected
      setScores(initialScores);
      setDetectedLetter('');
      detectedLetterRef.current = '';
      setHighlightedLetter(''); // Limpiar highlight cuando no hay mano
    }

    // Process left hand for writing trigger
    if (leftHandLandmarks) {
      const isLeftClosed = isHandClosed(leftHandLandmarks);
      setLeftHandClosed(isLeftClosed);
      
      // Detect transition from open to closed (trigger writing)
      const currentTime = Date.now();
      const timeSinceLastWrite = currentTime - lastWriteTimeRef.current;
      const minWriteInterval = 500; // 0.5 seconds between writes
      
      if (isLeftClosed && !previousLeftHandClosedRef.current && detectedLetterRef.current && rightHandLandmarks && timeSinceLastWrite >= minWriteInterval) {
        const detectedItem = detectedLetterRef.current;
        
        // Handle special functions (usando los nombres del backend)
        if (detectedItem === 'espacio') {
          setWrittenText(prev => prev + ' ');
        } else if (detectedItem === 'borrar') {
          setWrittenText(prev => prev.slice(0, -1));
        } else {
          // Regular letter
          setWrittenText(prev => prev + detectedItem.toLowerCase());
        }
        
        lastWriteTimeRef.current = currentTime;
      }
      previousLeftHandClosedRef.current = isLeftClosed;
    } else {
      setLeftHandClosed(false);
      previousLeftHandClosedRef.current = false;
    }
  }, [vocalModels, allItems, initialScores]);

  // Initialize MediaPipe only once
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
      // Limpiar timeout del highlight
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      setupComplete = false;
    };
  }, []); // Empty dependency array - setup only once

  // Update the results handler when vocalModels change
  useEffect(() => {
    if (handsRef.current) {
      handsRef.current.onResults(handleResults);
    }
  }, [handleResults]);

  const clearText = () => {
    setWrittenText('');
  };


  const getDisplayName = (item: string) => {
    if (item === 'espacio') return 'ESPACIO';
    if (item === 'borrar') return 'BORRAR';
    return item.toUpperCase();
  };

  return (
    <section className="p-5 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Camera and Text Display */}
        <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-black-200 p-4">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Vista Previa
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
              <h3 className="text-base font-semibold text-gray-700">Texto Formado</h3>
              <div className="flex gap-1.5">
                <Link
                  to="/home"
                  className="px-2 py-1 text-xs font-medium text-amber-600 hover:text-white hover:bg-amber-600 rounded transition-all duration-200 border border-amber-600 flex items-center gap-1"
                >
                  <span>←</span> Volver
                </Link>
                <button
                  onClick={clearText}
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
                  !writtenText ? 'text-gray-400 italic' : 'text-gray-800'
                }`}>
                  {writtenText || 'El texto aparecerá aquí cuando cierres la mano izquierda...'}
                </p>
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
              const score = parseFloat(scores[letter] || '0');
              const imageUrl = getImage(letter);
              return (
                <div 
                  key={letter}
                  className={`sign-card !w-auto !h-auto min-w-[60px] min-h-[80px] transition-all duration-300 ${
                    isDetected ? 'ring-2 ring-amber-400 ring-offset-2 scale-105' : ''
                  } ${
                    isHighlighted ? 'bg-gradient-to-br from-green-200 to-green-300 shadow-lg scale-110 ring-2 ring-green-400' : ''
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

export default PracticePage;
