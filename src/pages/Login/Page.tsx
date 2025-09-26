import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { FaceSmileIcon as FaceSmileSolid } from '@heroicons/react/24/solid';
import mujerImage from '../../assets/mujer.png';

const LoginPage: React.FC = () => {
  // Usamos un tipo personalizado para el ref del video
  type WebcamWithVideo = {
    video: HTMLVideoElement | null;
    getScreenshot: () => string | null;
  };
  
  const webcamRef = useRef<WebcamWithVideo>({ 
    video: null, 
    getScreenshot: () => {
      const video = webcamRef.current?.video;
      if (!video) return null;
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      // Voltear horizontalmente para que coincida con la vista previa
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      return canvas.toDataURL('image/jpeg');
    }
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const navigate = useNavigate();

  // Cargar modelos de face-api.js
  useEffect(() => {
    let isMounted = true;
    let stream: MediaStream | null = null;
    
    const loadModels = async () => {
      if (!isMounted) return;
      
      try {
        // Cargar modelos en segundo plano sin bloquear la interfaz
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        
        if (isMounted) {
          setModelsLoaded(true);
        }
      } catch (err) {
        console.error('Error al cargar modelos:', err);
        // Los modelos fallarán silenciosamente, la interfaz seguirá funcionando
        if (isMounted) {
          setModelsLoaded(false);
        }
      }
    };

    // Iniciar la cámara
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });
        
        if (webcamRef.current && isMounted) {
          const video = webcamRef.current.video;
          if (video) {
            video.srcObject = mediaStream;
            stream = mediaStream;
          }
        }
      } catch (err) {
        console.error('Error al acceder a la cámara:', err);
        if (isMounted) {
          setError('No se pudo acceder a la cámara. Asegúrate de haber otorgado los permisos necesarios.');
        }
      }
    };

    loadModels();
    startCamera();
    
    // Limpiar al desmontar
    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Detectar rostros en tiempo real
  const detectFaces = useCallback(async () => {
    if (!modelsLoaded || !webcamRef.current || !canvasRef.current) return;

    const video = webcamRef.current.video;
    if (!video) return;

    try {
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvasRef.current, displaySize);

      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5
        })
      ).withFaceLandmarks();

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Limpiar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dibujar detecciones con estilo premium (amarillo neón)
      if (detections.length > 0) {
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        // Dibujar caja de detección con estilo mejorado
        resizedDetections.forEach(({ detection, landmarks }) => {
          const { x, y, width, height } = detection.box;
          
          // Dibujar caja suavizada en amarillo neón
          ctx.strokeStyle = '#eab308'; // yellow-500
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);
          
          // Dibujar puntos de referencia faciales en amarillo
          ctx.fillStyle = '#eab308';
          landmarks.positions.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
          });
        });
      }

      // Actualizar estado de detección de rostro
      const faceCurrentlyDetected = detections.length > 0;
      if (faceCurrentlyDetected !== faceDetected) {
        setTimeout(() => setFaceDetected(faceCurrentlyDetected), 100);
      }
    } catch (err) {
      console.error('Error en la detección facial:', err);
    }
  }, [modelsLoaded, faceDetected]);

  // Actualizar detección de rostros
  useEffect(() => {
    if (!modelsLoaded) return;

    const interval = setInterval(detectFaces, 100);
    return () => clearInterval(interval);
  }, [modelsLoaded, detectFaces]);

  // Capturar imagen
  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  // Enviar imagen al servidor para autenticación
  const handleLogin = async () => {
    if (!imgSrc) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Convertir la imagen a blob
      const response = await fetch(imgSrc);
      const blob = await response.blob();
      
      // Crear FormData para enviar la imagen
      const formData = new FormData();
      formData.append('foto', blob, 'login-face.jpg');

      // Enviar al backend (simulado)
      // En un entorno real, reemplazar con tu endpoint de autenticación
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error en la autenticación');
      
      const data = await res.json();
      
      // Guardar datos de autenticación (simulado)
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirigir al dashboard
      navigate('/dashboard');
      
    } catch (err) {
      console.error('Error en el login:', err);
      setError('No se pudo autenticar. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Volver a tomar foto
  const retakePhoto = () => {
    setImgSrc(null);
    setError(null);
  };

  // Cargar modelos en segundo plano sin mostrar pantalla de carga

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex overflow-hidden">
      {/* Panel de Branding - Izquierda (40-45%) */}
      <motion.div 
        className="flex-[0.42] flex flex-col justify-center items-center p-12 relative"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Contenedor centrado completo */}
        <div className="flex flex-col items-center justify-center h-full">
          {/* Texto de Bienvenida */}
          <div className="text-center mb-12">
            <motion.h1 
              className="text-white text-3xl font-light mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Bienvenido a
            </motion.h1>
            <motion.h2 
              className="text-amber-400 text-7xl font-bold mb-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              SignLearn AI
            </motion.h2>
            <motion.p 
              className="text-gray-300 text-xl font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              tu espacio exclusivo
            </motion.p>
          </div>

          {/* Ilustración de Marca */}
          <motion.div
            className="relative flex justify-center items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <motion.img 
              src={mujerImage}
              alt="Lenguaje de Señas"
              className="w-80 h-auto object-contain"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Panel de Interacción - Derecha (55-60%) */}
      <motion.div 
        className="flex-[0.58] flex items-center justify-center p-8"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="bg-slate-800/70 backdrop-blur-sm rounded-3xl p-10 w-full max-w-md border border-slate-700/50 shadow-2xl">
          {/* Título del Proceso */}
          <motion.h3 
            className="text-white text-xl font-medium text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Iniciando Reconocimiento Facial
          </motion.h3>

          {/* Errores */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-xl"
            >
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-red-300">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Módulo de Cámara */}
          <motion.div 
            className="relative mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="aspect-square bg-black rounded-2xl overflow-hidden border-2 border-slate-600 relative">
              {!imgSrc ? (
                <>
                  <video
                    ref={(node) => {
                      if (node && webcamRef.current) {
                        webcamRef.current.video = node;
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover filter grayscale"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  
                  {/* Malla de Detección Premium */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                      {/* Grid de detección */}
                      <div className="absolute inset-8 border-2 border-yellow-400 rounded-lg">
                        <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-0">
                          {Array.from({ length: 64 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="border border-yellow-400/30"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ 
                                delay: i * 0.02,
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 1
                              }}
                            />
                          ))}
                        </div>
                        
                        {/* Esquinas de enfoque */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-yellow-400"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-yellow-400"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-yellow-400"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-yellow-400"></div>
                      </div>
                    </motion.div>

                  {/* Indicador de detección */}
                  <motion.div 
                    className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium flex items-center ${
                      faceDetected 
                        ? 'bg-green-900/70 text-green-300 border border-green-500/50' 
                        : 'bg-yellow-900/70 text-yellow-300 border border-yellow-500/50'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {faceDetected ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                        Rostro detectado
                      </>
                    ) : (
                      <>
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1.5" />
                        Acerca tu rostro
                      </>
                    )}
                  </motion.div>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full h-full relative"
                >
                  <img
                    src={imgSrc}
                    alt="Captura de rostro"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 p-3 rounded-full shadow-lg">
                      <FaceSmileSolid className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Botones de Acción */}
          <AnimatePresence mode="wait">
            {!imgSrc ? (
              <motion.button
                key="capture-button"
                onClick={capture}
                disabled={!faceDetected || isLoading}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  faceDetected && !isLoading
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 1 }}
                whileTap={{ scale: 0.98 }}
              >
                <CameraIcon className="inline h-5 w-5 mr-2" />
                {isLoading ? 'Procesando...' : 'Tomar Foto'}
              </motion.button>
            ) : (
              <motion.div 
                key="action-buttons"
                className="grid grid-cols-2 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.2 }}
              >
                <button
                  onClick={retakePhoto}
                  className="py-3 px-4 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Volver a tomar
                </button>
                
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className={`py-3 px-4 font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center ${
                    isLoading
                      ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-2" />
                      Iniciar Sesión
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navegación Secundaria */}
          <motion.div 
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <p className="text-gray-400 text-sm">
              ¿No tiene una cuenta?{' '}
              <button
                onClick={() => navigate('/registro')}
                className="text-amber-400 hover:text-amber-300 font-medium underline transition-colors"
              >
                AQUÍ CREA UNA
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
