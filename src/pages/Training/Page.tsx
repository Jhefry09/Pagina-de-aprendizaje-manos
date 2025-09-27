import { useState, useRef, useEffect } from "react";
import { useVocalContext } from "../../hooks/useVocalContext";
import {
  type NormalizedLandmark,
  type Results,
  type MediaPipeHandsInstance,
} from "../../types";

const TrainingPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { updateVocalModel } = useVocalContext();
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[]>([]);
  const [selectedLetter, setSelectedLetter] = useState("");
  const [apiResponse, setApiResponse] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRightHandDetected, setIsRightHandDetected] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const loadScript = (src: string) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = (error) => {
        console.error(`Error loading script: ${src}`, error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    let hands: MediaPipeHandsInstance | null = null;
    type CameraType = { start: () => Promise<void>; stop?: () => void } | null;
    let camera: CameraType = null;
    let isMounted = true;

    const initializeMediaPipe = async () => {
      try {
        if (!window.Hands || !window.Camera) {
          await loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
          );
          await loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
          );
          await loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js",
          );
        }

        hands = new window.Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
          selfieMode: false,
          staticImageMode: false,
          smoothLandmarks: true,
          refineLandmarks: true,
        });

        hands.onResults((results: Results) => {
          if (!isMounted) return;
          const canvasCtx = canvasRef.current?.getContext("2d");
          if (canvasCtx && canvasRef.current) {
            canvasCtx.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height,
            );
            
            let rightHandLandmarks = null;
            let foundRightHand = false;

            if (results.multiHandLandmarks && results.multiHandedness) {
              for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const handLandmarks = results.multiHandLandmarks[i];
                const detectedHandedness = results.multiHandedness[i]?.label || 'Right';
                
                const isUserRightHand = detectedHandedness === 'Left';
                
                window.drawConnectors(
                  canvasCtx,
                  handLandmarks,
                  window.HAND_CONNECTIONS,
                  { 
                    color: isUserRightHand ? "#f2994a" : "#cccccc", 
                    lineWidth: 2 
                  },
                );
                window.drawLandmarks(canvasCtx, handLandmarks, {
                  color: isUserRightHand ? "#215c5c" : "#999999",
                  lineWidth: 1,
                });

                if (isUserRightHand) {
                  rightHandLandmarks = handLandmarks;
                  foundRightHand = true;
                }
              }
            }

            setIsRightHandDetected(foundRightHand);
            if (foundRightHand && rightHandLandmarks) {
              setLandmarks(rightHandLandmarks);
            } else {
              setLandmarks([]);
            }
          }
        });

        if (videoRef.current) {
          interface CameraType {
            start(): Promise<void>;
            stop(): void;
          }
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && hands) {
                try {
                  await hands.send({ image: videoRef.current });
                } catch (error) {
                  console.error("Error sending frame to MediaPipe:", error);
                }
              }
            },
            width: 320,
            height: 240,
          }) as unknown as CameraType;
          await camera.start();
          console.log("Camera started successfully");
        }
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    initializeMediaPipe();

    const videoElement = videoRef.current;
    return () => {
      isMounted = false;
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (hands) {
        try {
          hands.close();
        } catch (error) {
          console.error("Error closing MediaPipe hands:", error);
        }
      }
    };
  }, []);

  const startCountdown = (letter: string) => {
    if (!isRightHandDetected) {
      setApiResponse({
        type: "error",
        message: "Por favor, muestra tu mano DERECHA frente a la cámara antes de entrenar.",
      });
      return;
    }

    setSelectedLetter(letter);
    setCountdown(3);
    setApiResponse(null);
    
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownRef.current as NodeJS.Timeout);
          captureAndSaveModel(letter);
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
    setSelectedLetter("");
  };

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const captureAndSaveModel = async (letter: string) => {
    if (landmarks.length === 0 || !isRightHandDetected) {
      setApiResponse({
        type: "error",
        message: "No se detectó la mano DERECHA para capturar el modelo. Intenta de nuevo.",
      });
      setSelectedLetter("");
      setCountdown(null);
      return;
    }

    const normalizedLandmarks = landmarks.map((lm, idx) => ({
      id: idx,
      x: lm.x,
      y: lm.y,
      z: lm.z,
    }));

    updateVocalModel(letter, normalizedLandmarks);
    setSelectedLetter("");
    setCountdown(null);

    try {
      const response = await fetch("/letras/procesar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: letter.toLowerCase(),
          vectoresJson: {
            landmarks: normalizedLandmarks,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setApiResponse({
          type: "error",
          message:
            data.message ||
            "Error al procesar la letra. Por favor, inténtalo de nuevo.",
        });
        return;
      }
      setApiResponse({
        type: "success",
        message:
          data.message ||
          `Modelo para la letra '${letter.toUpperCase()}' guardado exitosamente con mano derecha.`,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setApiResponse({
        type: "error",
        message: `Error de conexión: ${errorMessage}. Por favor, verifica tu conexión e inténtalo de nuevo.`,
      });
    }
  };

  // Definir las letras del alfabeto y funciones especiales con colores
  const alphabet = [
    { letter: "a", color: "bg-red-400 hover:bg-red-500" },
    { letter: "b", color: "bg-blue-400 hover:bg-blue-500" },
    { letter: "c", color: "bg-green-400 hover:bg-green-500" },
    { letter: "d", color: "bg-yellow-400 hover:bg-yellow-500" },
    { letter: "e", color: "bg-purple-400 hover:bg-purple-500" },
    { letter: "f", color: "bg-pink-400 hover:bg-pink-500" },
    { letter: "g", color: "bg-indigo-400 hover:bg-indigo-500" },
    { letter: "h", color: "bg-orange-400 hover:bg-orange-500" },
    { letter: "i", color: "bg-teal-400 hover:bg-teal-500" },
    { letter: "j", color: "bg-cyan-400 hover:bg-cyan-500" },
    { letter: "k", color: "bg-emerald-400 hover:bg-emerald-500" },
    { letter: "l", color: "bg-lime-400 hover:bg-lime-500" },
    { letter: "m", color: "bg-amber-400 hover:bg-amber-500" },
    { letter: "n", color: "bg-rose-400 hover:bg-rose-500" },
    { letter: "ñ", color: "bg-violet-300 hover:bg-violet-400" },
    { letter: "o", color: "bg-violet-400 hover:bg-violet-500" },
    { letter: "p", color: "bg-fuchsia-400 hover:bg-fuchsia-500" },
    { letter: "q", color: "bg-sky-400 hover:bg-sky-500" },
    { letter: "r", color: "bg-stone-400 hover:bg-stone-500" },
    { letter: "s", color: "bg-neutral-400 hover:bg-neutral-500" },
    { letter: "t", color: "bg-zinc-400 hover:bg-zinc-500" },
    { letter: "u", color: "bg-slate-400 hover:bg-slate-500" },
    { letter: "v", color: "bg-gray-400 hover:bg-gray-500" },
    { letter: "w", color: "bg-red-500 hover:bg-red-600" },
    { letter: "x", color: "bg-blue-500 hover:bg-blue-600" },
    { letter: "y", color: "bg-green-500 hover:bg-green-600" },
    { letter: "z", color: "bg-purple-500 hover:bg-purple-600" },
  ];

  // Números
  const numbers = [
    { letter: "0", color: "bg-slate-600 hover:bg-slate-700" },
    { letter: "1", color: "bg-slate-600 hover:bg-slate-700" },
    { letter: "2", color: "bg-slate-600 hover:bg-slate-700" },
    { letter: "3", color: "bg-slate-600 hover:bg-slate-700" },
    { letter: "4", color: "bg-slate-600 hover:bg-slate-700" },
    { letter: "5", color: "bg-slate-600 hover:bg-slate-700" },
    { letter: "6", color: "bg-slate-600 hover:bg-slate-700" },
    { letter: "7", color: "bg-slate-600 hover:bg-slate-700" },
    { letter: "8", color: "bg-slate-600 hover:bg-slate-700" },
    { letter: "9", color: "bg-slate-600 hover:bg-slate-700" },
  ];

  // Símbolos matemáticos
  const mathSymbols = [
    { letter: ".", color: "bg-orange-600 hover:bg-orange-700", displayName: "." },
    { letter: "/", color: "bg-orange-600 hover:bg-orange-700", displayName: "÷" },
    { letter: "*", color: "bg-orange-600 hover:bg-orange-700", displayName: "×" },
    { letter: "-", color: "bg-orange-600 hover:bg-orange-700", displayName: "−" },
    { letter: "+", color: "bg-orange-600 hover:bg-orange-700", displayName: "+" },
    { letter: "=", color: "bg-orange-600 hover:bg-orange-700", displayName: "=" },
  ];

  // Funciones especiales
  const specialFunctions = [
    { letter: "espacio", color: "bg-gray-600 hover:bg-gray-700", displayName: "ESP" },
    { letter: "borrar", color: "bg-red-600 hover:bg-red-700", displayName: "DEL" },
    { letter: "interCambiar", color: "bg-blue-600 hover:bg-blue-700", displayName: "↔" },
  ];

  return (
    <section className="p-6 w-full">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="global-title-dark font-montserrat">
              Entrenamiento de Gestos del Alfabeto
            </h1>
            <p className="global-body-text-dark">
              Crea un nuevo modelo de gesto para cada letra del alfabeto usando tu mano DERECHA
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webcam Preview */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Vista Previa
          </h2>
          
          {/* Hand detection status */}
          <div className="mb-4 p-3 rounded-lg flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${isRightHandDetected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`font-medium ${isRightHandDetected ? 'text-green-700' : 'text-red-700'}`}>
              {isRightHandDetected ? 'Mano derecha detectada ✋' : 'Mano derecha NO detectada - Levanta tu mano DERECHA'}
            </span>
          </div>

          <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mx-auto mb-6 shadow-lg">
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
          
          {!isRightHandDetected && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-yellow-800 text-sm">
                  <strong>Importante:</strong> Levanta tu mano DERECHA (la que aparece del lado derecho en la pantalla). Las otras manos se muestran en gris y no se usarán para entrenar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Panel de Control
          </h2>
          <div className="w-full">
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Selecciona una letra del alfabeto, número, símbolo o función especial:
            </h3>
            
            {/* Scrollable alphabet grid */}
            <div className="max-h-96 overflow-y-auto mb-6 p-2 border rounded-lg">
              <div className="space-y-4">
                {/* Alphabet Letters */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2 px-2">Letras del Alfabeto:</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {alphabet.map(({ letter, color }) => (
                      <button
                        key={letter}
                        onClick={() => startCountdown(letter)}
                        disabled={!!countdown || !isRightHandDetected}
                        className={`relative flex items-center justify-center p-3 rounded-lg shadow-sm transition-all duration-300 ${
                          selectedLetter === letter
                            ? `${color.replace("hover:", "")} text-white scale-105 shadow-md`
                            : `${color} text-white hover:shadow-md transform hover:scale-102`
                        } ${countdown || !isRightHandDetected ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <span className="text-lg font-bold">
                          {letter.toUpperCase()}
                        </span>
                        {selectedLetter === letter && countdown && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg">
                            <span className="text-2xl font-bold text-white">
                              {countdown}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Numbers */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2 px-2">Números:</h4>
                  <div className="grid grid-cols-5 gap-3">
                    {numbers.map(({ letter, color }) => (
                      <button
                        key={letter}
                        onClick={() => startCountdown(letter)}
                        disabled={!!countdown || !isRightHandDetected}
                        className={`relative flex items-center justify-center p-3 rounded-lg shadow-sm transition-all duration-300 ${
                          selectedLetter === letter
                            ? `${color.replace("hover:", "")} text-white scale-105 shadow-md`
                            : `${color} text-white hover:shadow-md transform hover:scale-102`
                        } ${countdown || !isRightHandDetected ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <span className="text-lg font-bold">
                          {letter}
                        </span>
                        {selectedLetter === letter && countdown && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg">
                            <span className="text-2xl font-bold text-white">
                              {countdown}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Math Symbols */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2 px-2">Símbolos Matemáticos:</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {mathSymbols.map(({ letter, color, displayName }) => (
                      <button
                        key={letter}
                        onClick={() => startCountdown(letter)}
                        disabled={!!countdown || !isRightHandDetected}
                        className={`relative flex items-center justify-center p-4 rounded-lg shadow-sm transition-all duration-300 ${
                          selectedLetter === letter
                            ? `${color.replace("hover:", "")} text-white scale-105 shadow-md`
                            : `${color} text-white hover:shadow-md transform hover:scale-102`
                        } ${countdown || !isRightHandDetected ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className="text-center">
                          <span className="text-lg font-bold block">
                            {displayName}
                          </span>
                          <span className="text-xs opacity-75">
                            {letter}
                          </span>
                        </div>
                        {selectedLetter === letter && countdown && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg">
                            <span className="text-2xl font-bold text-white">
                              {countdown}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Special Functions */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2 px-2">Funciones Especiales:</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {specialFunctions.map(({ letter, color, displayName }) => (
                      <button
                        key={letter}
                        onClick={() => startCountdown(letter)}
                        disabled={!!countdown || !isRightHandDetected}
                        className={`relative flex items-center justify-center p-4 rounded-lg shadow-sm transition-all duration-300 ${
                          selectedLetter === letter
                            ? `${color.replace("hover:", "")} text-white scale-105 shadow-md`
                            : `${color} text-white hover:shadow-md transform hover:scale-102`
                        } ${countdown || !isRightHandDetected ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className="text-center">
                          <span className="text-lg font-bold block">
                            {displayName}
                          </span>
                          <span className="text-xs opacity-75">
                            {letter.toUpperCase()}
                          </span>
                        </div>
                        {selectedLetter === letter && countdown && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg">
                            <span className="text-2xl font-bold text-white">
                              {countdown}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {countdown && (
              <button
                onClick={cancelCountdown}
                className="w-full py-3 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all duration-300 mb-4"
              >
                Cancelar Entrenamiento
              </button>
            )}
            
            {/* Progress indicator */}
            <div className="text-center text-sm text-gray-600">
              <p>Entrena cada letra del alfabeto, números y símbolos para crear un modelo completo</p>
              <p className="text-xs mt-1">27 letras + 10 números + 6 símbolos + 3 funciones especiales disponibles para entrenar</p>
            </div>
          </div>
          
          {apiResponse && (
            <div
              className={`mt-4 w-full p-4 rounded-lg transform transition-all duration-300 ease-out animate-fadeInUp ${
                apiResponse.type === "success"
                  ? "bg-green-50 border-2 border-green-300 text-green-700 animate-pulse-once"
                  : apiResponse.type === "error"
                    ? "bg-red-50 border border-red-200 text-red-700"
                    : "bg-blue-50 border border-blue-200 text-blue-700"
              }`}
            >
              <style>{`
                @keyframes fadeInUp {
                  from {
                    opacity: 0;
                    transform: translateY(10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                .animate-fadeInUp {
                  animation: fadeInUp 0.3s ease-out forwards;
                }
                @keyframes pulse-once {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.02); }
                }
                .animate-pulse-once {
                  animation: pulse-once 1s ease-in-out;
                }
              `}</style>
              <div className="flex items-center">
                {apiResponse.type === "success" ? (
                  <div className="relative w-5 h-5 mr-2">
                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                    <svg
                      className="relative w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : apiResponse.type === "error" ? (
                  <svg
                    className="w-5 h-5 mr-2 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 mr-2 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9 12h1V9H9v3zm0 4h1v-2H9v2z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM2 10a8 8 0 1116 0A8 8 0 012 10z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span>{apiResponse.message}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TrainingPage;
