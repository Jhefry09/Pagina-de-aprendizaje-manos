import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useVocalContext } from '../../hooks/useVocalContext';
import { type VocalModel, type NormalizedLandmark, type Results, type MediaPipeHandsInstance } from '../../types';

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
  const { vocal: selectedLetterParam } = useParams();
  const selectedLetter = selectedLetterParam || 'a';
  const [detectedLetter, setDetectedLetter] = useState('');
  const [highestScore, setHighestScore] = useState(0);
  const [writtenText, setWrittenText] = useState('');
  const [leftHandClosed, setLeftHandClosed] = useState(false);

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
      setHighestScore(maxScore);
      detectedLetterRef.current = detected;
    } else {
      // Reset scores when no right hand is detected
      setScores(initialScores);
      setDetectedLetter('');
      setHighestScore(0);
      detectedLetterRef.current = '';
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

  // Helper function to get item color and display name
  const getItemColor = (item: string, isDetected: boolean = false, isSelected: boolean = false) => {
    if (specialFunctions.includes(item)) {
      if (isDetected && isSelected) return 'text-green-600';
      if (isDetected) return 'text-black';
      if (item === 'espacio') return 'text-gray-600';
      if (item === 'borrar') return 'text-red-600';
      return 'text-gray-400';
    }
    
    const colors = [
      'text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500', 'text-purple-500',
      'text-pink-500', 'text-indigo-500', 'text-orange-500', 'text-teal-500', 'text-cyan-500',
      'text-emerald-500', 'text-lime-500', 'text-amber-500', 'text-rose-500', 'text-violet-500',
      'text-fuchsia-500', 'text-sky-500', 'text-stone-500', 'text-neutral-500', 'text-zinc-500',
      'text-slate-500', 'text-gray-500', 'text-red-600', 'text-blue-600', 'text-green-600', 'text-purple-600'
    ];
    
    const index = item.charCodeAt(0) - 'a'.charCodeAt(0);
    
    if (isDetected && isSelected) return 'text-green-600';
    if (isDetected) return 'text-black';
    if (isSelected) return colors[index % colors.length];
    return 'text-gray-400';
  };

  const getDisplayName = (item: string) => {
    if (item === 'espacio') return 'ESP';
    if (item === 'borrar') return 'DEL';
    return item.toUpperCase();
  };

  return (
    <section className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-700 font-montserrat">
            Entrenando letra <span className="text-[#f2994a]">{selectedLetter.toUpperCase()}</span>
          </h1>
          <p className="text-gray-600">Usa tu mano derecha (lado derecho de la pantalla) para formar letras/funciones y cierra la mano izquierda (lado izquierdo) para ejecutar la acción</p>
        </div>
        <Link
          to="/"
          className="px-4 py-2 text-sm font-semibold text-[#f2994a] hover:text-white hover:bg-[#f2994a] rounded-lg transition-all duration-300 border border-[#f2994a]"
        >
          Volver al Inicio
        </Link>
      </div>

      {/* Text Box for Written Letters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-700">Texto escrito:</span>
          <button
            onClick={clearText}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Limpiar
          </button>
        </div>
        <div className="min-h-[50px] p-3 border-2 border-gray-200 rounded-lg bg-gray-50">
          <span className="text-xl font-mono tracking-wider">
            {writtenText || 'El texto aparecerá aquí cuando cierres la mano izquierda...'}
          </span>
        </div>
      </div>

      {/* Hand Status Indicators */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-medium text-gray-700 mb-2">Mano Derecha (Lado derecho - Detección)</h3>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${detectedLetter ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{detectedLetter ? `Detectando: ${getDisplayName(detectedLetter)}` : 'No detectada'}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-medium text-gray-700 mb-2">Mano Izquierda (Lado izquierdo - Ejecutar)</h3>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${leftHandClosed ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm">{leftHandClosed ? 'Cerrada (Ejecutando)' : 'Abierta'}</span>
          </div>
        </div>
      </div>

      <div className="my-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-700">Precisión (Mano Derecha):</span>
          <span className="font-bold">{scores[detectedLetter] || '0.0'}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${detectedLetter === selectedLetter ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${highestScore}%` }}
          />
        </div>
      </div>

      <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mx-auto mb-6 shadow-lg" style={{ maxWidth: '640px' }}>
        <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]" width="640" height="480" />
      </div>

      <div className="text-center">
        {/* Alphabet and Special Functions Grid - Scrollable */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Precisión por Elemento:</h3>
          <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
            <div className="space-y-4">
              {/* Alphabet Letters */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2 px-1">Letras del Alfabeto:</h4>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-2">
                  {alphabet.map((letter) => (
                    <div key={letter} className="text-center p-2 rounded border-2 border-transparent hover:border-gray-300 transition-all">
                      <div className={`text-lg font-medium ${getItemColor(letter, letter === detectedLetter, letter === selectedLetter)}`}>
                        {letter.toUpperCase()}
                      </div>
                      <div className={`text-xs font-bold ${getItemColor(letter, letter === detectedLetter, letter === selectedLetter)}`}>
                        {scores[letter] || '0.0'}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Special Functions */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2 px-1">Funciones Especiales:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {specialFunctions.map((func) => (
                    <div key={func} className="text-center p-3 rounded border-2 border-transparent hover:border-gray-300 transition-all">
                      <div className={`text-sm font-medium ${getItemColor(func, func === detectedLetter, func === selectedLetter)}`}>
                        {getDisplayName(func)}
                      </div>
                      <div className={`text-xs font-bold ${getItemColor(func, func === detectedLetter, func === selectedLetter)}`}>
                        {scores[func] || '0.0'}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {func.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-lg font-medium text-gray-700 mb-1">Elemento detectado (Mano Derecha):</p>
          <div className={`text-4xl font-bold ${detectedLetter === selectedLetter ? 'text-green-600' : 'text-black'}`}>
            {detectedLetter ? getDisplayName(detectedLetter) : '—'}
          </div>
          {detectedLetter && (
            <div className="mt-2">
              <p className={`font-medium ${detectedLetter === selectedLetter ? 'text-green-600' : 'text-red-600'}`}>
                {detectedLetter === selectedLetter ? '¡Correcto! Cierra la mano izquierda para ejecutar.' : 'Intenta hacer el elemento seleccionado'}
              </p>
              {specialFunctions.includes(detectedLetter) && (
                <p className="text-sm text-gray-600 mt-1">
                  {detectedLetter === 'espacio' ? 'Agregará un espacio al texto' : 'Borrará el último carácter'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{writtenText.length}</div>
              <div className="text-sm text-gray-600">Caracteres escritos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{highestScore.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Precisión actual</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{allItems.filter(item => parseFloat(scores[item] || '0') > 50).length}</div>
              <div className="text-sm text-gray-600">Elementos mayor 50%</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PracticePage;
