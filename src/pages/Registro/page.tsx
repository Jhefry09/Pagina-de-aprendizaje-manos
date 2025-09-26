import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import mujerImage from '../../assets/mujer.png';

const RegistroPage: React.FC = () => {
  const webcamRef = useRef<HTMLVideoElement>(null);
  const [nombres, setNombres] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const navigate = useNavigate();

  // Inicializar cámara
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

  // Simular registro
  const handleRegistrar = async () => {
    if (!nombres.trim()) return;
    
    setIsRegistering(true);
    
    // Simulación de registro
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsRegistering(false);
    // Redirigir al login
    navigate('/login');
  };

  const handleVolver = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex">
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
              SignLearn AI
            </motion.h2>
            <motion.p 
              className="text-gray-300 text-xl font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              crea tu cuenta ahora
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

          {/* Módulo de Cámara */}
          <motion.div 
            className="relative mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="w-full h-[24rem] bg-black rounded-2xl overflow-hidden border-2 border-slate-600 relative" style={{ aspectRatio: '1/1' }}>
              <video
                ref={webcamRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              
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
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
            />
          </motion.div>

          {/* Botones de Control */}
          <motion.div 
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <button
              onClick={handleVolver}
              className="py-3 px-4 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
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
              {isRegistering ? 'Registrando...' : 'Registrar'}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegistroPage;