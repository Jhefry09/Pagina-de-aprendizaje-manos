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
  const [selectedVocal, setSelectedVocal] = useState("");
  const [apiResponse, setApiResponse] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
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
          maxNumHands: 1,
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
            if (
              results.multiHandLandmarks &&
              results.multiHandLandmarks.length > 0
            ) {
              const handLandmarks = results.multiHandLandmarks[0];
              window.drawConnectors(
                canvasCtx,
                handLandmarks,
                window.HAND_CONNECTIONS,
                { color: "#f2994a", lineWidth: 2 },
              );
              window.drawLandmarks(canvasCtx, handLandmarks, {
                color: "#215c5c",
                lineWidth: 1,
              });
              setLandmarks(handLandmarks);
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

  const startCountdown = (vocal: string) => {
    setSelectedVocal(vocal);
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownRef.current as NodeJS.Timeout);
          captureAndSaveModel(vocal);
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
    setSelectedVocal("");
  };

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const captureAndSaveModel = async (vocal: string) => {
    if (landmarks.length === 0) {
      setApiResponse({
        type: "error",
        message: "No se detectó ninguna mano para capturar el modelo.",
      });
      return;
    }

    const normalizedLandmarks = landmarks.map((lm, idx) => ({
      id: idx,
      x: lm.x,
      y: lm.y,
      z: lm.z,
    }));

    updateVocalModel(vocal, normalizedLandmarks);
    setSelectedVocal("");
    setCountdown(null);

    try {
      const response = await fetch("/vocales/procesar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: vocal.toLowerCase(), // 👈 AJUSTADO
          vectoresJson: {
            landmarks: normalizedLandmarks, // ✅ ya como JSON
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setApiResponse({
          type: "error",
          message:
            data.message ||
            "Error al procesar la vocal. Por favor, inténtalo de nuevo.",
        });
        return;
      }
      setApiResponse({
        type: "success",
        message:
          data.message ||
          `Modelo para la vocal '${vocal.toUpperCase()}' guardado exitosamente.`,
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

  return (
    <section className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-700 font-montserrat">
            Entrenamiento de Gestos
          </h1>
          <p className="text-gray-600">
            Crea un nuevo modelo de gesto para una vocal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webcam Preview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Vista Previa
          </h2>
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
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Panel de Control
          </h2>
          <div className="w-full">
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Selecciona una vocal:
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { letter: "a", color: "bg-red-400 hover:bg-red-500" },
                { letter: "e", color: "bg-yellow-400 hover:bg-yellow-500" },
                { letter: "i", color: "bg-blue-400 hover:bg-blue-500" },
                { letter: "o", color: "bg-green-400 hover:bg-green-500" },
                { letter: "u", color: "bg-purple-400 hover:bg-purple-500" },
              ].map(({ letter, color }) => (
                <button
                  key={letter}
                  onClick={() => startCountdown(letter)}
                  disabled={!!countdown}
                  className={`relative flex items-center justify-center p-6 rounded-xl shadow-md transition-all duration-300 ${
                    selectedVocal === letter
                      ? `${color.replace("hover:", "")} text-white scale-105`
                      : `${color} text-white hover:shadow-lg`
                  } ${countdown ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className="text-2xl font-bold">
                    {letter.toUpperCase()}
                  </span>
                  {selectedVocal === letter && countdown && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-xl">
                      <span className="text-4xl font-bold text-white">
                        {countdown}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {countdown && (
              <button
                onClick={cancelCountdown}
                className="w-full py-2 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all duration-300"
              >
                Cancelar
              </button>
            )}
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
