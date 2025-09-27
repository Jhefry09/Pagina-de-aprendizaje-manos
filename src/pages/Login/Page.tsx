import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
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

                // Mostrar mensaje de bienvenida
                alert(`Bienvenido ${data.usuario} (rol: ${data.rol}) id:${data.id}`);

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

                // Redirigir a la página Home (ruta raíz)
                navigate('/');
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
        </div>
    );
};

export default LoginPage;