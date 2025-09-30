import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { FaceSmileIcon as FaceSmileSolid } from '@heroicons/react/24/solid';
import hombreGif from '../../assets/Hombre.gif';

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

            // Reducir calidad al 50% (0.5)
            return canvas.toDataURL('image/jpeg', 0.5);
        }
    });
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [cameraReady, setCameraReady] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number>(0);
    const [isCapturing, setIsCapturing] = useState<boolean>(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
    const [userData, setUserData] = useState<any>(null);
    const navigate = useNavigate();

    // Inicializar cámara
    useEffect(() => {
        let isMounted = true;
        let stream: MediaStream | null = null;

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
                        video.onloadedmetadata = () => {
                            setCameraReady(true);
                        };
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

        startCamera();

        // Limpiar al desmontar
        return () => {
            isMounted = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Capturar imagen con delay de 3 segundos
    const capture = useCallback(() => {
        if (!webcamRef.current || isCapturing || !cameraReady) return;

        setIsCapturing(true);
        setCountdown(3);

        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    // Tomar la foto
                    const imageSrc = webcamRef.current?.getScreenshot();
                    if (imageSrc) {
                        setImgSrc(imageSrc);
                    }
                    setIsCapturing(false);
                    setCountdown(0);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [webcamRef, isCapturing, cameraReady]);


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
            formData.append('foto', blob, 'captura.png');

            // Enviar al backend Spring
            const res = await fetch('/usuarios/login', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Error en la autenticación');

            const data = await res.json();

            if (data.encontrado) {
                // Crear objeto completo del usuario
                const userData = {
                    usuario: data.usuario,
                    name: data.usuario, // Para compatibilidad con el contexto auth
                    id: data.id,
                    rol: data.rol
                };

                // Guardar datos de autenticación
                localStorage.setItem('user', JSON.stringify(userData));

                // Disparar evento personalizado para notificar cambios en localStorage
                window.dispatchEvent(new CustomEvent('userDataUpdated'));

                // Segunda petición: Obtener progreso de letras
                try {
                    const progresoRes = await fetch(`/api/progreso/letras/${data.id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (progresoRes.ok) {
                        const progresoData = await progresoRes.json();
                        console.log('Progreso de letras:', progresoData);

                        // Crear objeto completo con información del usuario y progreso
                        const userProgressData = {
                            usuario: {
                                id: data.id,
                                nombre: data.usuario,
                                rol: data.rol
                            },
                            progreso: progresoData,
                            letrasCompletadas: progresoData.filter((letra: any) => letra.completado === true),
                            totalLetras: progresoData.length,
                            porcentajeCompletado: progresoData.length > 0
                                ? ((progresoData.filter((letra: any) => letra.completado === true).length / progresoData.length) * 100).toFixed(1)
                                : '0.0',
                            fechaUltimaActualizacion: new Date().toISOString()
                        };

                        // Guardar progreso completo asociado al usuario
                        localStorage.setItem('userProgress', JSON.stringify(userProgressData));

                        // También mantener por separado para retrocompatibilidad
                        localStorage.setItem('progresoLetras', JSON.stringify(progresoData));

                        console.log(`Usuario ${data.usuario} tiene ${userProgressData.letrasCompletadas.length} letras completadas de ${userProgressData.totalLetras} (${userProgressData.porcentajeCompletado}%)`);
                    } else {
                        console.warn('No se pudo obtener el progreso de letras');

                        // Crear objeto con datos básicos del usuario sin progreso
                        const userProgressData = {
                            usuario: {
                                id: data.id,
                                nombre: data.usuario,
                                rol: data.rol
                            },
                            progreso: [],
                            letrasCompletadas: [],
                            totalLetras: 0,
                            porcentajeCompletado: '0.0',
                            fechaUltimaActualizacion: new Date().toISOString()
                        };

                        localStorage.setItem('userProgress', JSON.stringify(userProgressData));
                    }
                } catch (progresoError) {
                    console.error('Error al obtener progreso de letras:', progresoError);

                    // Crear objeto con datos básicos del usuario en caso de error
                    const userProgressData = {
                        usuario: {
                            id: data.id,
                            nombre: data.usuario,
                            rol: data.rol
                        },
                        progreso: [],
                        letrasCompletadas: [],
                        totalLetras: 0,
                        porcentajeCompletado: '0.0',
                        fechaUltimaActualizacion: new Date().toISOString(),
                        error: 'No se pudo cargar el progreso'
                    };

                    localStorage.setItem('userProgress', JSON.stringify(userProgressData));
                }

                // Guardar datos del usuario para el modal
                setUserData({
                    usuario: data.usuario,
                    id: data.id,
                    rol: data.rol,
                    progreso: JSON.parse(localStorage.getItem('userProgress') || '{}')
                });

                // Mostrar modal de bienvenida
                setShowWelcomeModal(true);
            } else {
                setError(`Error: ${JSON.stringify(data)}`);
            }

        } catch (err) {
            console.error('Error en el login:', err);
            setError('No se pudo autenticar. Por favor, intente nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    // Función para continuar después del modal de bienvenida
    const handleContinueToApp = () => {
        setShowWelcomeModal(false);
        navigate('/home');
    };

    // Volver a tomar foto
    const retakePhoto = useCallback(async () => {
        setImgSrc(null);
        setError(null);
        setCameraReady(false);

        // Detener el stream actual si existe
        const video = webcamRef.current?.video;
        if (video && video.srcObject) {
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }

        // Reiniciar la cámara con un nuevo stream
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false
            });

            if (webcamRef.current?.video) {
                const videoElement = webcamRef.current.video;
                videoElement.srcObject = mediaStream;
                videoElement.style.display = 'block';

                videoElement.onloadedmetadata = () => {
                    setCameraReady(true);
                };

                // Asegurar que el video se reproduzca
                videoElement.play().catch(console.error);
            }
        } catch (err) {
            console.error('Error al reiniciar la cámara:', err);
            setError('No se pudo reiniciar la cámara. Intente recargar la página.');
        }
    }, []);

    return (
        <div className="w-full flex">
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
                            src={hombreGif}
                            alt="Lenguaje de Señas"
                            className="w-80 h-auto object-contain"
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
                <div className="bg-slate-800/70 backdrop-blur-sm rounded-3xl p-10 w-full max-w-lg border border-slate-700/50 shadow-2xl">
                    {/* Título del Proceso */}
                    <motion.h3
                        className="text-white text-xl font-medium text-center mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        Iniciar Sesión con Foto
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
                        <div className="w-full h-96 bg-black rounded-2xl overflow-hidden border-2 border-slate-600 relative" style={{ aspectRatio: '1/1' }}>
                            {!imgSrc ? (
                                <>
                                    <video
                                        ref={(node) => {
                                            if (node && webcamRef.current) {
                                                webcamRef.current.video = node;
                                                // Asegurar que el video esté visible cuando se monta
                                                node.style.display = 'block';
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                        style={{ transform: 'scaleX(-1)' }}
                                        onCanPlay={() => {
                                            // Callback adicional para asegurar que la cámara esté lista
                                            setCameraReady(true);
                                        }}
                                    />

                                    {/* Contador de captura */}
                                    {countdown > 0 && (
                                        <motion.div
                                            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <motion.div
                                                className="text-6xl font-bold text-white"
                                                key={countdown}
                                                initial={{ scale: 1.2, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {countdown}
                                            </motion.div>
                                        </motion.div>
                                    )}

                                    {/* Indicador de cámara */}
                                    <motion.div
                                        className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium flex items-center ${
                                            cameraReady
                                                ? 'bg-green-900/70 text-green-300 border border-green-500/50'
                                                : 'bg-yellow-900/70 text-yellow-300 border border-yellow-500/50'
                                        }`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        {cameraReady ? (
                                            <>
                                                <CameraIcon className="h-4 w-4 mr-1.5" />
                                                Cámara lista
                                            </>
                                        ) : (
                                            <>
                                                <ExclamationTriangleIcon className="h-4 w-4 mr-1.5" />
                                                Iniciando cámara...
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
                                disabled={!cameraReady || isLoading || isCapturing}
                                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                                    cameraReady && !isLoading && !isCapturing
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
                                {isCapturing ? `Tomando foto en ${countdown}...` : (isLoading ? 'Procesando...' : 'Tomar Foto')}
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

            {/* Modal de Bienvenida */}
            <AnimatePresence>
                {showWelcomeModal && userData && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-slate-700 shadow-2xl relative"
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50 }}
                            transition={{ type: "spring", duration: 0.5 }}
                        >
                            {/* Botón de cerrar */}
                            <button
                                onClick={handleContinueToApp}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Avatar */}
                            <motion.div
                                className="flex justify-center mb-6"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                            >
                                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </motion.div>

                            {/* Mensaje de bienvenida */}
                            <motion.h2
                                className="text-white text-2xl font-bold text-center mb-2 flex items-center justify-center gap-2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                ¡Bienvenido de vuelta! 
                                <span className="text-3xl">👋</span>
                            </motion.h2>

                            {/* Nombre del usuario */}
                            <motion.p
                                className="text-amber-400 text-xl font-semibold text-center mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                {userData.usuario}
                            </motion.p>

                            {/* Información del usuario */}
                            <motion.div
                                className="space-y-3 mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                {/* Rol */}
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex items-center">
                                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-400 text-xs">Rol</p>
                                        <p className="text-white font-semibold">{userData.rol}</p>
                                    </div>
                                </div>

                                {/* ID de Usuario */}
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex items-center">
                                    <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-400 text-xs">ID de Usuario</p>
                                        <p className="text-white font-semibold">#{userData.id}</p>
                                    </div>
                                </div>

                                {/* Progreso */}
                                {userData.progreso?.porcentajeCompletado && (
                                    <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-600/30">
                                        <div className="flex items-center mb-2">
                                            <div className="w-10 h-10 bg-green-600/30 rounded-lg flex items-center justify-center mr-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-300 text-xs">Tu Progreso</p>
                                                <p className="text-white font-semibold">
                                                    {userData.progreso.letrasCompletadas?.length || 0} de {userData.progreso.totalLetras || 27} letras
                                                </p>
                                            </div>
                                            <div className="text-green-400 text-2xl font-bold">
                                                {userData.progreso.porcentajeCompletado}%
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-2.5">
                                            <motion.div
                                                className="bg-gradient-to-r from-green-500 to-emerald-400 h-2.5 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${userData.progreso.porcentajeCompletado}%` }}
                                                transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Mensaje de éxito */}
                            <motion.div
                                className="bg-amber-900/20 border border-amber-600/30 rounded-xl p-4 mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <p className="text-amber-200 text-sm text-center flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Autenticación exitosa. Estás listo para continuar aprendiendo lenguaje de señas con <span className="font-semibold text-amber-400">SeeTalk</span>.
                                </p>
                            </motion.div>

                            {/* Botón de continuar */}
                            <motion.button
                                onClick={handleContinueToApp}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Continuar a SeeTalk
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoginPage;