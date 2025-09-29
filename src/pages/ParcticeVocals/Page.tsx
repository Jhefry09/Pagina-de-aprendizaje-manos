import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVocalContext } from '../../hooks/useVocalContext'; 
import { type VocalModel, type NormalizedLandmark, type Results, type MediaPipeHandsInstance } from '../../types';

// ====================================================================
// I. HELPERS (Funciones auxiliares)
// ====================================================================

// La función normalizeLandmarks es vital para hacer el reconocimiento independiente del tamaño y posición de la mano.
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

// La función compareHands calcula la similitud euclidiana y la convierte en un porcentaje de score.
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


// NOTA: isHandClosed y las funciones/variables relacionadas con la mano izquierda ya no son necesarias.

// ====================================================================
// II. COMPONENTE PRINCIPAL
// ====================================================================

// Importa las imágenes para la tarjeta de referencia
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

const vocals = ['a', 'e', 'i', 'o', 'u'];
const specialFunctions = ['espacio', 'borrar'];
// Solo vamos a rastrear VOWELS y SPECIAL FUNCTIONS para el score grid
const itemsToTrack = [...vocals, ...specialFunctions];


const VocalPracticePage = () => {
  const { vocalModels } = useVocalContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<MediaPipeHandsInstance | null>(null);
  // eslint-disable-next-line
  const cameraRef = useRef<any>(null);
  
  // Se eliminaron: detectedLetterRef, previousLeftHandClosedRef, lastWriteTimeRef
  
  // Estado para la página (usando un valor por defecto seguro)
  const { vocal: selectedLetterParam } = useParams<{ vocal: string }>();
  const selectedLetter = (selectedLetterParam?.toLowerCase() && vocalImages[selectedLetterParam.toLowerCase()]) 
    ? selectedLetterParam.toLowerCase() : 'a';

  const initialScores = itemsToTrack.reduce((acc, item) => {
    acc[item] = '0.0';
    return acc;
  }, {} as Record<string, string>);

  const [scores, setScores] = useState<Record<string, string>>(initialScores);
  const [detectedLetter, setDetectedLetter] = useState('');
  const [highestScore, setHighestScore] = useState(0); // Máximo score detectado
  // Se eliminaron: writtenText, leftHandClosed
  const [isReady, setIsReady] = useState(false); // Estado para indicar que MediaPipe está cargado


  // ====================================================================
  // III. HANDLER PRINCIPAL DE MEDIAPIPE (Solo Detección Mano Derecha)
  // ====================================================================
  const handleResults = useCallback((results: Results) => {
    const canvasCtx = canvasRef.current?.getContext('2d');
    if (!canvasCtx || !canvasRef.current) return;

    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    let rightHandLandmarks = null;

    // 1. Separar y dibujar la mano derecha (Detección)
    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const handLandmarks = results.multiHandLandmarks[i];
        const detectedHandedness = results.multiHandedness[i]?.label || 'Right';
        
        // Etiquetado MediaPipe en selfieMode=false: 'Left' es la mano derecha del usuario (detección). 
        const isUserRightHand = detectedHandedness === 'Left'; 
        
        if (isUserRightHand) {
          // Configuración mejorada para visualización de la mano
          const color = '#f2994a'; // Naranja para las conexiones
          const landmarkColor = '#215c5c'; // Azul oscuro para los puntos
          
          // 1. Primero dibujamos las conexiones principales
          window.drawConnectors(canvasCtx, handLandmarks, window.HAND_CONNECTIONS, { 
            color: color, 
            lineWidth: 3,
            lineCap: 'round',
            lineJoin: 'round'
          });
          
          // 2. Luego dibujamos las líneas adicionales para los dedos
          const fingerConnections = [
            [0, 1, 2, 3, 4],       // Pulgar
            [0, 5, 6, 7, 8],       // Índice
            [0, 9, 10, 11, 12],    // Medio
            [0, 13, 14, 15, 16],   // Anular
            [0, 17, 18, 19, 20]    // Meñique
          ];
          
          fingerConnections.forEach(finger => {
            for (let i = 1; i < finger.length; i++) {
              const start = handLandmarks[finger[i - 1]];
              const end = handLandmarks[finger[i]];
              if (start && end) {
                canvasCtx.beginPath();
                canvasCtx.moveTo(start.x * canvasRef.current!.width, start.y * canvasRef.current!.height);
                canvasCtx.lineTo(end.x * canvasRef.current!.width, end.y * canvasRef.current!.height);
                canvasCtx.strokeStyle = color;
                canvasCtx.lineWidth = 3;
                canvasCtx.stroke();
              }
            }
          });
          
          // 3. Finalmente, dibujamos los puntos de referencia por encima de las líneas
          window.drawLandmarks(canvasCtx, handLandmarks, { 
            color: landmarkColor,
            lineWidth: 7,
            fillColor: landmarkColor,
            // eslint-disable-next-line
            radius: (data: { from: any; to: any }) => {
              const isFingerTip = [4, 8, 12, 16, 20].includes(data.to);
              return isFingerTip ? 6 : 5; // Puntos ligeramente más grandes en las puntas
            }
          });
          
          rightHandLandmarks = handLandmarks;
          // Si encontramos la mano derecha, podemos detener el bucle o seguir si es necesario, 
          // pero solo nos interesa el primer match de la mano correcta.
        }
      }
    }

    // 2. Procesar mano derecha para el reconocimiento (Score)
    if (rightHandLandmarks) {
      const normalizedHand = normalizeLandmarks(rightHandLandmarks);
      
      const newScores: Record<string, string> = {};
      let maxScore = 0;
      let detected = '';

      // Calcular scores, solo para los elementos que estamos rastreando (Vowels + Special)
      for (const item of itemsToTrack) {
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
    } else {
      setScores(initialScores);
      setDetectedLetter('');
      setHighestScore(0);
    }

    // 3. Se eliminó el procesamiento de la mano izquierda (Trigger de escritura).
    // Esto garantiza que el flujo de video no se interrumpe y la malla no se congela.
  }, [vocalModels, initialScores]);


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
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      // Importante: maxNumHands se puede reducir a 1 si solo quieres detectar la derecha, 
      // pero se mantiene en 2 por si tienes modelos duales en el futuro, aunque la lógica 
      // de handleResults solo procesa la mano derecha. Para esta vista, lo dejaremos en 1
      // para optimizar ligeramente, ya que el usuario solo quiere una malla.
      handsRef.current.setOptions({
        maxNumHands: 1, // Se ajusta a 1, ya que solo procesamos la mano de detección/score
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
    // eslint-disable-next-line
  }, []); 

  useEffect(() => {
    if (handsRef.current) {
      handsRef.current.onResults(handleResults);
    }
  }, [handleResults]);

  // Se eliminó la función clearText

  // ====================================================================
  // V. FUNCIONES DE DISPLAY Y RENDERIZADO (Diseño limpio)
  // ====================================================================

  const getItemColor = (item: string, isDetected: boolean = false, isSelected: boolean = false) => {
    if (specialFunctions.includes(item)) {
      if (isDetected && isSelected) return 'text-green-600';
      if (isDetected) return 'text-black';
      if (item === 'espacio') return 'text-gray-600';
      if (item === 'borrar') return 'text-red-600';
      return 'text-gray-400';
    }
    
    // Paleta de colores para las vocales (A, E, I, O, U)
    const colors = ['text-red-600', 'text-blue-600', 'text-green-600', 'text-purple-600', 'text-amber-600'];
    const index = vocals.indexOf(item); // 0 a 4
    
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

  const selectedVocalImg = vocalImages[selectedLetter] || vocalImages.a;
  const barColor = detectedLetter === selectedLetter ? 'bg-green-500' : 'bg-amber-500';

  return (
    <section className="w-full flex flex-col items-center justify-center pt-8 pb-6 gap-6">
      
      {/* 1. Caja Superior: Header y Guía */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 w-[800px]">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/vocales" 
            className="px-4 py-2 text-sm font-semibold text-[#f2994a] hover:text-white hover:bg-[#f2994a] rounded-lg transition-all duration-300 border border-[#f2994a]"
          >
            VOLVER
          </Link>
          <h1 className="text-2xl font-bold text-gray-700 font-montserrat">
            Práctica de Vocal <span className="text-[#f2994a]">{selectedLetter.toUpperCase()}</span>
          </h1>
          <div className='w-[80px]'></div>
        </div>
        <p className="text-gray-600 text-center">
            Concentra tu mano **derecha** (lado derecho) en formar la seña de la vocal objetivo.
        </p>
      </div>

      {/* 2. Contenedor Principal: Cámara y Referencia */}
      <div className="flex justify-center gap-6 w-[800px]">
        
        {/* Columna Izquierda: Cámara y Stats */}
        <div className="flex flex-col gap-6 w-1/2">
          
          {/* Cámara y Malla (Solo dibuja la malla de la mano derecha) */}
          <div className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
            <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]" width="640" height="480" />
            <div className="absolute top-2 left-2 text-white text-xs font-mono bg-black/50 px-2 py-1 rounded">
                {isReady ? 'Reconocimiento Activo' : 'Cargando MediaPipe...'}
            </div>
          </div>
          
          {/* Indicador de Detección (Solo Mano Derecha) */}
          <div className="flex w-full">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 p-4 text-center w-full">
              <h3 className="font-medium text-gray-700 mb-1 text-sm">Mano Detectada (Detección)</h3>
              <div className={`text-xl font-bold ${detectedLetter ? 'text-amber-600' : 'text-gray-400'}`}>
                {detectedLetter ? getDisplayName(detectedLetter) : 'Ninguna'}{' '}
                <span className="text-sm font-normal text-gray-500">({highestScore.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
          
        </div>


        {/* Columna Derecha: Target, Precisión y Malla de Scores */}
        <div className="flex flex-col gap-6 w-1/2">

          {/* Tarjeta de Referencia (Estilo Vocal Card) */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 flex flex-col items-center">
            <h2 className="text-lg font-bold text-gray-700 mb-4">VOCAL OBJETIVO</h2>
            <div className="bg-gradient-to-b from-[#DA8739] to-[#7A491B] rounded-xl p-6 w-40 h-52 flex flex-col items-center justify-between shadow-lg">
                <img
                    src={selectedVocalImg}
                    alt={`${selectedLetter.toUpperCase()} en señas`}
                    className="w-24 h-24 object-contain"
                />
                <span className="text-white font-bold text-5xl mt-3">
                    {selectedLetter.toUpperCase()}
                </span>
            </div>
            
            {/* Barra de Precisión del Objetivo */}
            <div className="w-full mt-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700 text-sm">Precisión:</span>
                    <span className="font-bold text-sm">{scores[selectedLetter] || '0.0'}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${scores[selectedLetter] || '0.0'}%` }}
                    ></div>
                </div>
            </div>
          </div>

          {/* Malla de Puntuación (Malla Reducida a Vocales y Funciones) */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-700 text-center">Malla de Scores</h3>
            <div className="grid grid-cols-4 gap-2">
              {itemsToTrack.map((item) => (
                <div key={item} className={`text-center p-2 rounded-lg border-2 ${item === selectedLetter ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'} transition-all`}>
                  <div className={`text-sm font-medium ${getItemColor(item, item === detectedLetter, item === selectedLetter)}`}>
                    {getDisplayName(item)}
                  </div>
                  <div className={`text-xs font-bold ${getItemColor(item, item === detectedLetter, item === selectedLetter)}`}>
                    {scores[item] || '0.0'}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* 3. Se eliminó la Caja Inferior: Área de Escritura */}

    </section>
  );
};

export default VocalPracticePage;