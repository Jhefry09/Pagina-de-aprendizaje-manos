import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon, UserIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { FaceSmileIcon as FaceSmileSolid } from '@heroicons/react/24/solid';

const LoginPage: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
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
    
    const loadModels = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      
      try {
        // Cargar los modelos necesarios
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        
        if (isMounted) {
          setModelsLoaded(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error cargando modelos:', err);
        if (isMounted) {
          setError('Error al cargar los modelos de reconocimiento facial');
          setIsLoading(false);
        }
      }
    };
    
    loadModels();
    
    // Limpieza
    return () => {
      isMounted = false;
    };
  }, []);

  // Detectar rostros en tiempo real
  const detectFaces = useCallback(async () => {
    const video = webcamRef.current?.video;
    if (!video || !canvasRef.current) return;
    
    // Asegurarse de que el video esté listo
    if (video.readyState !== 4) return;
    
    const canvas = canvasRef.current;
    const displaySize = { 
      width: 480,  // Resolución reducida para mejor rendimiento
      height: 360
    };
    
    // Establecer dimensiones del canvas
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    
    faceapi.matchDimensions(canvas, displaySize);
    
    try {
      // Detectar rostros con opciones optimizadas para mayor estabilidad
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,  // Tamaño balanceado entre rendimiento y precisión
        scoreThreshold: 0.45  // Umbral más bajo para mayor estabilidad
      });
      
      // Aplicar suavizado para reducir parpadeo
      const detections = await faceapi
        .detectAllFaces(video, options)
        .withFaceLandmarks();
      
      // Dibujar detecciones en el canvas
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Limpiar el canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar recuadro de guía
      const guideSize = Math.min(canvas.width, canvas.height) * 0.7;
      const guideX = (canvas.width - guideSize) / 2;
      const guideY = (canvas.height - guideSize) / 2;
      
      context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      context.lineWidth = 2;
      context.setLineDash([5, 5]);
      context.strokeRect(guideX, guideY, guideSize, guideSize);
      context.setLineDash([]);
      
      if (detections.length > 0) {
        // Aplicar transformación de espejo a todo el canvas
        context.save();
        context.scale(-1, 1);  // Invertir horizontalmente
        context.translate(-canvas.width, 0);
        
        // Suavizar las detecciones
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        // Dibujar con opacidad para suavizar transiciones
        context.globalAlpha = 0.8;
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        context.globalAlpha = 1.0;
        
        context.restore();
      }
      
      // Usar un umbral de tiempo para evitar cambios bruscos en la detección
      setFaceDetected(prev => {
        const now = Date.now();
        const faceFound = detections.length > 0;
        
        // Si hay rostro detectado, actualizar inmediatamente
        if (faceFound) return true;
        
        // Si no hay rostro, esperar un poco antes de actualizar para evitar parpadeos
        const timeSinceLastDetection = now - (lastDetectionRef.current || 0);
        if (timeSinceLastDetection < 300) { // 300ms de retraso
          return prev;
        }
        return false;
      });
      
      if (detections.length > 0) {
        lastDetectionRef.current = Date.now();
      }
    } catch (err) {
      console.error('Error detectando rostros:', err);
    }
  }, []);
  
  // Referencia para el tiempo de la última detección
  const lastDetectionRef = useRef<number>(0);
  
  // Actualizar las detecciones con requestAnimationFrame para mejor sincronización
  useEffect(() => {
    if (!modelsLoaded) return;
    
    let animationFrameId: number;
    let lastTime = 0;
    const fpsInterval = 1000 / 15; // Objetivo de 15 FPS para la detección
    
    const detectLoop = (time: number) => {
      if (!lastTime) lastTime = time;
      const elapsed = time - lastTime;
      
      // Controlar la frecuencia de detección
      if (elapsed > fpsInterval) {
        lastTime = time - (elapsed % fpsInterval);
        detectFaces();
      }
      
      animationFrameId = requestAnimationFrame(detectLoop);
    };
    
    // Iniciar el bucle de detección
    animationFrameId = requestAnimationFrame(detectLoop);
    
    // Limpieza
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [modelsLoaded, detectFaces]);

  // Capturar imagen
  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImgSrc(imageSrc);
      }
    } catch (err) {
      console.error('Error capturando imagen:', err);
      setError('Error al capturar la imagen');
    }
  }, []);

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

  // Volver a tomar la foto
  const retake = useCallback(() => {
    setImgSrc(null);
  }, []);

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
                    {/* Video de la cámara */}
                    <div className="relative w-full h-full overflow-hidden rounded-2xl">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                          facingMode: 'user',
                          width: { ideal: 640 },
                          height: { ideal: 480 },
                          frameRate: { ideal: 15, max: 30 },
                          resizeMode: 'crop-and-scale'
                        }}
                        className="absolute inset-0 w-full h-full object-cover"
                        mirrored={true} // Invertir la vista previa
                        style={{
                          transform: 'scaleX(-1)' // Invertir horizontalmente para que coincida con el espejo
                        }}
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      />
                    </div>

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