import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon, UserIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { FaceSmileIcon as FaceSmileSolid } from '@heroicons/react/24/solid';

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
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Mostrar mensaje de carga
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
        if (isMounted) {
          setError('Error al cargar los modelos de reconocimiento facial. Por favor, recarga la página.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
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

      // Dibujar detecciones con un estilo más suave
      if (detections.length > 0) {
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        // Dibujar caja de detección con estilo mejorado
        resizedDetections.forEach(({ detection, landmarks }) => {
          const { x, y, width, height } = detection.box;
          
          // Dibujar caja suavizada
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
          
          // Dibujar puntos de referencia faciales
          ctx.fillStyle = '#3b82f6';
          landmarks.positions.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
          });
        });
      }

      // Actualizar estado de detección de rostro con un pequeño retraso para evitar parpadeo
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

  // Efecto de carga
  if (isLoading && !modelsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-full h-full rounded-full border-4 border-blue-100"
            ></motion.div>
            <FaceSmileSolid className="w-10 h-10 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Preparando el reconocimiento facial</h1>
          <p className="text-gray-600 mb-6">Estamos cargando los modelos necesarios. Por favor, espera un momento...</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <motion.div 
              className="bg-blue-600 h-2.5 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            ></motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AnimatePresence>
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8"
        >
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.h1 
              className="text-3xl font-bold text-gray-900 sm:text-4xl mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Iniciar Sesión
            </motion.h1>
            <motion.p 
              className="text-lg text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Coloca tu rostro frente a la cámara para identificarte
            </motion.p>
          </motion.div>

          <motion.div 
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 25 }}
          >
            <div className="p-6 sm:p-8">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg"
                >
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Vista de la cámara */}
                <div className="flex-1">
                  <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-inner border-2 border-gray-200">
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
                          className="w-full h-full object-cover"
                          style={{
                            transform: 'scaleX(-1)' // Espejo para que coincida con el movimiento real
                          }}
                        />
                        <canvas
                          ref={canvasRef}
                          className="absolute top-0 left-0 w-full h-full pointer-events-none"
                          style={{
                            transform: 'scaleX(-1)',
                          }}
                        />
                        
                        {/* Indicador de detección */}
                        <motion.div 
                          className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium flex items-center ${
                            faceDetected 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
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

                  <AnimatePresence mode="wait">
                    {!imgSrc ? (
                      <motion.button
                        key="capture-button"
                        onClick={capture}
                        disabled={!faceDetected || isLoading}
                        className={`mt-6 w-full flex items-center justify-center px-6 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-medium text-white ${
                          faceDetected && !isLoading
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'
                            : 'bg-gray-300 cursor-not-allowed'
                        } transition-all duration-300 transform hover:scale-[1.02]`}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: 0.3 }}
                      >
                        <CameraIcon className="h-5 w-5 mr-2" />
                        {isLoading ? 'Procesando...' : 'Tomar Foto'}
                      </motion.button>
                    ) : (
                      <motion.div 
                        key="action-buttons"
                        className="mt-6 grid grid-cols-2 gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: 0.2 }}
                      >
                        <button
                          onClick={retakePhoto}
                          className="px-4 py-3.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all flex items-center justify-center"
                        >
                          <ArrowPathIcon className="h-5 w-5 mr-2" />
                          Volver a tomar
                        </button>
                        <button
                          onClick={handleLogin}
                          disabled={isLoading}
                          className={`px-4 py-3.5 border border-transparent rounded-xl text-white font-medium flex items-center justify-center ${
                            isLoading
                              ? 'bg-blue-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'
                          } transition-all`}
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
                </div>

                {/* Instrucciones */}
                <motion.div 
                  className="flex-1 flex flex-col justify-center"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                      Instrucciones para el reconocimiento facial
                    </h3>
                    <ul className="space-y-3 text-gray-700">
                      {[
                        'Asegúrate de estar en un lugar bien iluminado',
                        'Mira directamente a la cámara',
                        'Mantén una expresión neutral',
                        'Evita usar gorras o lentes oscuros',
                        'Asegúrate de que tu rostro esté completamente visible'
                      ].map((instruction, index) => (
                        <motion.li 
                          key={index}
                          className="flex items-start group"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + (index * 0.1) }}
                        >
                          <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5 mr-2 group-hover:bg-blue-200 transition-colors">
                            {index + 1}
                          </span>
                          <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
                            {instruction}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <motion.div 
                    className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Tu privacidad es importante. No almacenamos imágenes de tu rostro, solo las usamos para identificarte de forma segura.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="mt-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <button 
                      onClick={() => navigate('/')}
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-1" />
                      Volver al inicio
                    </button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.main>
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;