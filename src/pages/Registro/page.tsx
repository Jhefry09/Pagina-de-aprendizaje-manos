import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import mujerImage from '../../assets/mujer.png';

const RegistroPage: React.FC = () => {
  const webcamRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nombres, setNombres] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();

  // Inicializar cámarafetch
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false
        });
        
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setErrorMessage('Error al acceder a la cámara. Por favor, verifica los permisos.');
      }
    };

    startCamera();

    return () => {
      if (webcamRef.current?.srcObject) {
        const stream = webcamRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Función para capturar foto del video
  const capturePhoto = (): string | null => {
    if (!webcamRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return null;

    // Obtener dimensiones originales del video
    const originalWidth = webcamRef.current.videoWidth;
    const originalHeight = webcamRef.current.videoHeight;

    // Reducir resolución a la mitad
    const reducedWidth = Math.floor(originalWidth / 2);
    const reducedHeight = Math.floor(originalHeight / 2);

    // Configurar el canvas con el tamaño reducido
    canvas.width = reducedWidth;
    canvas.height = reducedHeight;

    // Dibujar el frame actual del video en el canvas con tamaño reducido
    context.drawImage(webcamRef.current, 0, 0, originalWidth, originalHeight, 0, 0, reducedWidth, reducedHeight);
    
    // Convertir a data URL con calidad reducida (JPEG con 70% de calidad)
    return canvas.toDataURL('image/jpeg', 0.7);
  };

  // Función para enviar datos al backend
  const enviarAlBackend = async (nombre: string, fotoDataUrl: string) => {
    try {
      // Convertir data URL a blob
      const response = await fetch(fotoDataUrl);
      const blob = await response.blob();

      // Crear FormData
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('foto', blob, 'registro.png');

      // Enviar al backend
      const resp = await fetch('/usuarios/registrar', {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) {
        throw new Error(`Error del servidor: ${resp.status}`);
      }

      const data = await resp.json();
      return data;
    } catch (error) {
      console.error('Error al enviar al backend:', error);
      throw error;
    }
  };

  // Manejar el proceso completo de registro con cuenta regresiva
  const handleRegistrar = async () => {
    if (!nombres.trim()) {
      setErrorMessage('Por favor, ingresa tu nombre completo.');
      return;
    }
    
    setIsRegistering(true);
    setShowCountdown(true);
    setRegistrationStatus('idle');
    setErrorMessage('');
    
    // Iniciar cuenta regresiva de 5 segundos
    for (let i = 5; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setCountdown(0);
    setShowCountdown(false);
    
    try {
      // Capturar la foto
      const fotoDataUrl = capturePhoto();
      if (!fotoDataUrl) {
        throw new Error('No se pudo capturar la imagen');
      }
      
      setCapturedImage(fotoDataUrl);
      
      // Enviar al backend
      const resultado = await enviarAlBackend(nombres, fotoDataUrl);
      
      console.log('Registro exitoso:', resultado);
      setRegistrationStatus('success');
      
      // Mostrar resultado y redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Error en el registro:', error);
      setRegistrationStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido durante el registro');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleVolver = () => {
    navigate('/login');
  };

  // Función para volver a tomar foto (nueva funcionalidad)
  const retakePhoto = async () => {
    setCapturedImage(null);
    setRegistrationStatus('idle');
    setErrorMessage('');
    
    // Detener el stream actual si existe
    if (webcamRef.current?.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      webcamRef.current.srcObject = null;
    }
    
    // Reiniciar la cámara con un nuevo stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        // Asegurar que el video se reproduzca
        webcamRef.current.play().catch(console.error);
      }
    } catch (error) {
      console.error('Error al reiniciar la cámara:', error);
      setErrorMessage('Error al reiniciar la cámara. Por favor, recarga la página.');
    }
  };

  return (
    <div className="min-h-screen w-screen main-animated-bg flex">
      {/* Canvas oculto para capturar fotos */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Panel de Branding - Izquierda */}
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
              Únete a
            </motion.h1>
            <motion.h2 
              className="text-amber-400 text-7xl font-bold mb-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              SeeTalk
            </motion.h2>
            <motion.p 
              className="text-gray-300 text-xl font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              Comunicación Inteligente
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

      {/* Panel de Interacción - Derecha */}
      <motion.div 
        className="flex-[0.58] flex items-center justify-center p-8"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="bg-slate-800/70 backdrop-blur-sm rounded-3xl p-10 w-full max-w-md border border-slate-700/50 shadow-2xl">
          <motion.h3 
            className="text-white text-xl font-medium text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Registrando Usuario
          </motion.h3>

          {/* Mostrar mensaje de error si existe */}
          {errorMessage && (
            <motion.div 
              className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </motion.div>
          )}

          {/* Módulo de Cámara */}
          <motion.div 
            className="relative mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="w-full h-[24rem] bg-black rounded-2xl overflow-hidden border-2 border-slate-600 relative" style={{ aspectRatio: '1/1' }}>
              {!capturedImage ? (
                <video
                  ref={webcamRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <img
                  src={capturedImage}
                  alt="Foto capturada"
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Overlay de cuenta regresiva */}
              {showCountdown && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <motion.div 
                    className="text-white text-8xl font-bold"
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {countdown}
                  </motion.div>
                </div>
              )}

              {/* Overlay de estado */}
              {registrationStatus === 'success' && (
                <div className="absolute inset-0 bg-green-500 bg-opacity-75 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-4">✅</div>
                    <div className="text-xl font-semibold">¡Registro Exitoso!</div>
                    <div className="text-sm">Redirigiendo al login...</div>
                  </div>
                </div>
              )}

              {registrationStatus === 'error' && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-4">❌</div>
                    <div className="text-xl font-semibold">Error en el Registro</div>
                    <div className="text-sm">Inténtalo nuevamente</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Campo de Nombres */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <input
              type="text"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              placeholder="NOMBRES Y APELLIDOS"
              disabled={isRegistering}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all disabled:opacity-50"
            />
          </motion.div>

          {/* Botones de Control */}
          <motion.div 
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            {capturedImage && registrationStatus !== 'success' ? (
              // Botones cuando hay imagen capturada
              <>
                <button
                  onClick={retakePhoto}
                  disabled={isRegistering}
                  className="py-3 px-4 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Volver a tomar
                </button>
                
                <button
                  onClick={handleRegistrar}
                  disabled={isRegistering}
                  className={`py-3 px-4 font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
                    isRegistering
                      ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg'
                  }`}
                >
                  {isRegistering ? 'Registrando...' : 'Confirmar Registro'}
                </button>
              </>
            ) : (
              // Botones normales cuando no hay imagen
              <>
                <button
                  onClick={handleVolver}
                  disabled={isRegistering}
                  className="py-3 px-4 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Volver
                </button>
                
                <button
                  onClick={handleRegistrar}
                  disabled={!nombres.trim() || isRegistering}
                  className={`py-3 px-4 font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
                    !nombres.trim() || isRegistering
                      ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg'
                  }`}
                >
                  {isRegistering ? (showCountdown ? `${countdown}` : 'Registrando...') : 'Registrar'}
                </button>
              </>
            )}
          </motion.div>

          {/* Instrucciones adicionales */}
          {!isRegistering && (
            <motion.div 
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              <p className="text-gray-400 text-sm">
                Al hacer clic en "Registrar", comenzará una cuenta regresiva de 5 segundos antes de tomar la foto automáticamente.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RegistroPage;