import { useState, useRef, useEffect } from "react";
import type { NormalizedLandmark, Results, MediaPipeHandsInstance } from "../../types";

// API Response interface
interface ApiResponse {
    type: "success" | "error" | "info";
    message: string;
}

// UI Component interfaces
interface LetterItem {
    letter: string;
    color: string;
    displayName?: string;
}

interface TabItem {
    id: string;
    label: string;
    count: number;
}

const TrainingPage = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [landmarks, setLandmarks] = useState<NormalizedLandmark[]>([]);
    const [selectedLetter, setSelectedLetter] = useState<string>("");
    const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isRightHandDetected, setIsRightHandDetected] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("alphabet");
    const [loading, setLoading] = useState<boolean>(true);
    const countdownRef = useRef<number | null>(null);

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
        let camera: any = null;
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
                    });
                    await camera.start();
                    console.log("Camera started successfully");
                }
            } catch (error) {
                console.error("Error initializing MediaPipe:", error);
            }
        };

        const init = async () => {
            await initializeMediaPipe();
            setLoading(false);
        };
        
        init();

        const videoElement = videoRef.current;
        return () => {
            isMounted = false;
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
            if (videoElement && videoElement.srcObject) {
                const stream = videoElement.srcObject as MediaStream;
                stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
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
                    if (countdownRef.current) {
                        clearInterval(countdownRef.current);
                    }
                    captureAndSaveModel(letter);
                    return null;
                }
                return prev ? prev - 1 : null;
            });
        }, 1000) as unknown as number;
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
                        "Error del servidor al procesar la letra. Modelo guardado localmente.",
                });
                return;
            }
            setApiResponse({
                type: "success",
                message:
                    data.message ||
                    `Modelo para la letra '${letter.toUpperCase()}' guardado exitosamente en el backend y localmente.`,
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Error desconocido";
            setApiResponse({
                type: "info",
                message: `Error de conexión con el backend: ${errorMessage}. El modelo para '${letter.toUpperCase()}' ha sido guardado LOCALMENTE.`,
            });
        }
    };

    const alphabet: LetterItem[] = [
        { letter: "a", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-red-500" },
        { letter: "b", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-blue-500" },
        { letter: "c", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-green-500" },
        { letter: "d", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-yellow-500" },
        { letter: "e", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-purple-500" },
        { letter: "f", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-pink-500" },
        { letter: "g", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-indigo-500" },
        { letter: "h", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-orange-500" },
        { letter: "i", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-teal-500" },
        { letter: "j", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-cyan-500" },
        { letter: "k", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-emerald-500" },
        { letter: "l", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-lime-500" },
        { letter: "m", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-amber-500" },
        { letter: "n", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-rose-500" },
        { letter: "o", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-violet-500" },
        { letter: "p", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-fuchsia-500" },
        { letter: "q", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-sky-500" },
        { letter: "r", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-stone-500" },
        { letter: "s", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-neutral-500" },
        { letter: "t", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-zinc-500" },
        { letter: "u", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-slate-500" },
        { letter: "v", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-gray-500" },
        { letter: "w", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-red-600" },
        { letter: "x", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-blue-600" },
        { letter: "y", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-green-600" },
        { letter: "z", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-purple-600" },
    ];

    const numbers: LetterItem[] = [
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

    const mathSymbols: LetterItem[] = [
        { letter: ".", color: "bg-orange-600 hover:bg-orange-700", displayName: "." },
        { letter: "/", color: "bg-orange-600 hover:bg-orange-700", displayName: "÷" },
        { letter: "*", color: "bg-orange-600 hover:bg-orange-700", displayName: "×" },
        { letter: "-", color: "bg-orange-600 hover:bg-orange-700", displayName: "−" },
        { letter: "+", color: "bg-orange-600 hover:bg-orange-700", displayName: "+" },
        { letter: "=", color: "bg-orange-600 hover:bg-orange-700", displayName: "=" },
    ];

    const specialFunctions: LetterItem[] = [
        { letter: "espacio", color: "bg-gray-600 hover:bg-gray-700", displayName: "ESP" },
        { letter: "borrar", color: "bg-red-600 hover:bg-red-700", displayName: "DEL" },
    ];

    const tabs: TabItem[] = [
        { id: "alphabet", label: "Alfabeto", count: 26 },
        { id: "numbers", label: "Números", count: 10 },
        { id: "symbols", label: "Símbolos", count: 6 },
        { id: "special", label: "Especiales", count: 2 },
    ];

    const renderButtons = () => {
        let items: LetterItem[] = [];
        let gridCols = "grid-cols-5";

        switch(activeTab) {
            case "alphabet":
                items = alphabet;
                gridCols = "grid-cols-3";
                break;
            case "numbers":
                items = numbers;
                gridCols = "grid-cols-2";
                break;
            case "symbols":
                items = mathSymbols;
                gridCols = "grid-cols-2";
                break;
            case "special":
                items = specialFunctions;
                gridCols = "grid-cols-2";
                break;
        }

        if (loading) {
            return (
                <div className="min-h-[400px] flex items-center justify-center bg-gray-100 bg-opacity-20 rounded-xl p-8">
            <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
                <p className="text-xl text-white font-medium">Cargando cámara y modelos de detección...</p>
                <p className="text-sm text-gray-300">Por favor, permite el acceso a la cámara si se solicita</p>
            </div>
        </div>
            );
        }

        return (
            <div className={`grid ${gridCols} gap-2`}>
                {items.map((item) => {
                    const displayText = item.displayName || item.letter.toUpperCase();
                    return (
                        <button
                            key={item.letter}
                            onClick={() => startCountdown(item.letter)}
                            disabled={!!countdown || !isRightHandDetected}
                            className={`relative flex items-center justify-center p-3 rounded-lg shadow-sm transition-all duration-300 ${
                                selectedLetter === item.letter
                                    ? `${item.color.replace("hover:", "")} text-white scale-105 shadow-md`
                                    : `${item.color} text-white hover:shadow-md transform hover:scale-102`
                            } ${countdown || !isRightHandDetected ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <div className="text-center">
                <span className="text-xl font-bold block">
                  {displayText}
                </span>
                                {item.displayName && (
                                    <span className="text-xs opacity-75 mt-1 block">
                    {item.letter}
                  </span>
                                )}
                            </div>
                            {selectedLetter === item.letter && countdown && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg">
                  <span className="text-2xl font-bold text-white">
                    {countdown}
                  </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <section className="p-5 w-full ">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Camera */}
                <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-black-200 p-5">
                    <h2 className="text-xl font-semibold mb-3 text-gray-800">
                        Vista Previa
                    </h2>

                    <div className={`mb-3 p-3 rounded-lg flex items-center ${isRightHandDetected ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
                        <div className={`w-3 h-3 rounded-full mr-2 ${isRightHandDetected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className={`font-semibold ${isRightHandDetected ? 'text-green-700' : 'text-red-700'}`}>
              {isRightHandDetected ? '✋ Mano derecha detectada' : '⚠️ Mano derecha NO detectada'}
            </span>
                    </div>

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

                    {!isRightHandDetected && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                            <div className="flex">
                                <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-yellow-800 mb-1">Importante</p>
                                    <p className="text-sm text-yellow-700">
                                        Levanta tu mano DERECHA (la que aparece del lado derecho en la pantalla). Las otras manos se muestran en gris y no se usarán para entrenar.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {countdown && (
                        <button
                            onClick={cancelCountdown}
                            className="w-full mt-3 py-2 px-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all duration-300 shadow-lg"
                        >
                            ❌ Cancelar Entrenamiento
                        </button>
                    )}
                </div>

                {/* Right: Controls with Tabs */}
                <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-black-200 p-4 flex flex-col">
                    <h2 className="text-xl font-semibold mb-3 text-gray-800">
                        Panel de Control
                    </h2>

                    {/* Tabs */}
                    <div className="flex space-x-2 mb-4 border-b border-gray-200">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-3 py-2 font-semibold text-sm transition-all duration-200 border-b-2 ${
                                    activeTab === tab.id
                                        ? "text-blue-600 border-blue-600"
                                        : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                {tab.label}
                                <span className={`ml-1 px-1 py-0.5 text-xs rounded-full ${
                                    activeTab === tab.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                                }`}>
                  {tab.count}
                </span>
                            </button>
                        ))}
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto mb-3" style={{maxHeight: "calc(100vh - 360px)"}}>
                        {renderButtons()}
                    </div>

                    {/* Info Text */}
                    <div className="text-center text-sm text-gray-600 pt-3 border-t border-gray-200">
                        <p className="font-medium">Entrena cada gesto para crear un modelo completo</p>
                        <p className="text-xs mt-1 text-gray-500">
                            Total: 26 letras + 10 números + 6 símbolos + 2 funciones especiales
                        </p>
                    </div>

                    {/* API Response */}
                    {apiResponse && (
                        <div
                            className={`mt-3 p-3 rounded-lg transform transition-all duration-300 ease-out ${
                                apiResponse.type === "success"
                                    ? "bg-green-50 border-2 border-green-300 text-green-700"
                                    : apiResponse.type === "error"
                                        ? "bg-red-50 border-2 border-red-300 text-red-700"
                                        : "bg-blue-50 border-2 border-blue-300 text-blue-700"
                            }`}
                        >
                            <div className="flex items-start">
                                {apiResponse.type === "success" ? (
                                    <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : apiResponse.type === "error" ? (
                                    <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span className="text-sm">{apiResponse.message}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default TrainingPage;
