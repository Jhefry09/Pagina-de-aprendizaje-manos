import { useState, useRef, useEffect } from 'react';
import HandSkeleton from '../../components/HandSkeleton';
import { useVocalContext } from '../../hooks/useVocalContext';
import { type NormalizedLandmark, type Results, type MediaPipeHandsInstance } from '../../types';

// Modal component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-0 flex items-center justify-center z-50 p-4 transition-all duration-300 ease-out"
      style={isOpen ? { backgroundColor: 'rgba(0, 0, 0, 0.5)' } : {}}>
      <div className={`bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-500 ease-out ${
        isOpen 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 -translate-y-10 scale-95'
      }`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-gray-600">{children}</div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 active:scale-95 hover:shadow-md"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrainingPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { updateVocalModel } = useVocalContext();
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[]>([]);
  const [selectedVocal, setSelectedVocal] = useState('');
  const [apiResponse, setApiResponse] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    let hands: MediaPipeHandsInstance | null = null;
    type CameraType = {
      start: () => Promise<void>;
      // Note: The actual Camera implementation might not have a stop method
      // We'll handle cleanup differently
    } | null;
    let camera: CameraType = null;
    let isMounted = true;

    const initializeMediaPipe = async () => {
      try {
        // Wait for the MediaPipe hands library to be available
        if (!window.Hands || !window.Camera) {
          console.log('Waiting for MediaPipe libraries to load...');
          return;
        }

        // Initialize MediaPipe Hands
        hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: Results) => {
          if (!isMounted) return;
          
          if (results.multiHandLandmarks?.length > 0) {
            setLandmarks(results.multiHandLandmarks[0]);
          } else {
            setLandmarks([]);
          }
        });

        // Initialize camera
        if (videoRef.current) {
          // Definir el tipo correcto para la cámara
          interface CameraType {
            start(): Promise<void>;
            stop(): void;
          }
          
          // Crear la cámara con el tipo correcto
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && hands) {
                try {
                  await hands.send({ image: videoRef.current });
                } catch (error) {
                  console.error('Error sending frame to MediaPipe:', error);
                }
              }
            },
            width: 320,
            height: 240,
          }) as unknown as CameraType;
          
          await camera.start();
          console.log('Camera started successfully');
        }
      } catch (error) {
        console.error('Error initializing MediaPipe:', error);
      }
    };

    // Initial check if libraries are already loaded
    if (window.Hands && window.Camera) {
      initializeMediaPipe();
    } else {
      // Fallback: Try to load the scripts if they're not available
      const loadScript = (src: string) => {
        return new Promise((resolve, reject) => {
          // Check if script is already loaded
          if (document.querySelector(`script[src="${src}"]`)) {
            return resolve(true);
          }
          
          const script = document.createElement('script');
          script.src = src;
          script.crossOrigin = 'anonymous';
          script.onload = () => resolve(true);
          script.onerror = (err) => {
            console.error(`Failed to load script: ${src}`, err);
            reject(err);
          };
          document.head.appendChild(script);
        });
      };

      // Create an async IIFE to handle the script loading
      (async () => {
        try {
          // Load scripts in order to ensure dependencies are available
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
          initializeMediaPipe();
        } catch (error) {
          console.error('Failed to load MediaPipe scripts:', error);
        }
      })();
    }

    // Store the current video ref in a variable to avoid potential null reference in cleanup
    const videoElement = videoRef.current;
    
    // Cleanup function
    return () => {
      isMounted = false;
      // Stop all tracks on the video stream if it exists
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (hands) {
        hands.close();
      }
    };
  }, []);

    const handleSaveModel = async () => {
    if (!selectedVocal) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Por favor, selecciona una vocal.'
      });
      return;
    }
    if (landmarks.length === 0) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'No se detectó ninguna mano para capturar el modelo.'
      });
      return;
    }

        updateVocalModel(selectedVocal, landmarks);
    setModal({
      isOpen: true,
      title: 'Éxito',
      message: `Modelo para la vocal '${selectedVocal.toUpperCase()}' ha sido actualizado correctamente.`
    });

    // Capturar y enviar la foto al backend
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setApiResponse({
              type: 'error',
              message: 'No se pudo capturar la imagen. Por favor, inténtalo de nuevo.'
            });
            return;
          }

          const formData = new FormData();
          formData.append('nombre', selectedVocal.toLowerCase());
          formData.append('foto', blob, 'foto.jpg');

          try {
            const response = await fetch('/vocales/procesar', {
              method: 'POST',
              body: formData,
            });

            const data = await response.json();
            
            if (!response.ok) {
              setApiResponse({
                type: 'error',
                message: data.message || 'Error al procesar la imagen. Por favor, inténtalo de nuevo.'
              });
              return;
            }

            setApiResponse({
              type: 'success',
              message: `Modelo para la vocal '${selectedVocal.toUpperCase()}' guardado exitosamente.`
            });
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            setApiResponse({
              type: 'error',
              message: `Error de conexión: ${errorMessage}. Por favor, verifica tu conexión e inténtalo de nuevo.`
            });
          }
        }, 'image/jpeg', 0.7);
      }
    }
  };

  return (
    <section className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-700 font-montserrat mb-6">
        Entrenamiento de Modelos de Gestos
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Cámara en Vivo</h2>
          <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" autoPlay playsInline />
                        <div className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]">
              <HandSkeleton landmarks={landmarks} />
            </div>
            <canvas ref={canvasRef} width="320" height="240" className="hidden"></canvas>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Panel de Control</h2>
          <div className="w-full">
            <label htmlFor="vocal-select" className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona la vocal para entrenar:
            </label>
            <select
              id="vocal-select"
              value={selectedVocal}
              onChange={(e) => setSelectedVocal(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">--Selecciona--</option>
              <option value="a">A</option>
              <option value="e">E</option>
              <option value="i">I</option>
              <option value="o">O</option>
              <option value="u">U</option>
            </select>
          </div>
          <button
            onClick={handleSaveModel}
            className="mt-6 w-full py-3 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all duration-300"
          >
            Guardar Modelo de Gesto
          </button>
          {apiResponse && (
            <div className={`mt-4 w-full p-4 rounded-lg transform transition-all duration-300 ease-out animate-fadeInUp ${
              apiResponse.type === 'success' 
                ? 'bg-green-50 border-2 border-green-300 text-green-700 animate-pulse-once' 
                : apiResponse.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
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
                {apiResponse.type === 'success' ? (
                  <div className="relative w-5 h-5 mr-2">
                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                    <svg className="relative w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <p className="text-sm font-medium">{apiResponse.message}</p>
              </div>
              <button
                onClick={() => setApiResponse(null)}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700 focus:outline-none transition-colors duration-200"
                aria-label="Cerrar"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
      
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        title={modal.title}
      >
        <p className="text-gray-700">{modal.message}</p>
      </Modal>
    </section>
  );
};

export default TrainingPage;