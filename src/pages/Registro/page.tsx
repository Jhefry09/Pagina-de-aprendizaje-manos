import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import hombreGif from '../../assets/Hombre.gif';

const RegistroPage: React.FC = () => {
    const webcamRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [nombres, setNombres] = useState<string>('');
    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number>(0);
    const [showCountdown, setShowCountdown] = useState<boolean>(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error' | 'duplicate'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [duplicateUserInfo, setDuplicateUserInfo] = useState<{usuario: string, distancia: number} | null>(null);
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

    // 🔴 FUNCIÓN MEJORADA para manejar rostros duplicados
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

            // 🔴 MANEJO ESPECÍFICO DE CÓDIGOS DE ESTADO
            if (resp.status === 201 || resp.status === 200) {
                // ✅ Registro exitoso
                const data = await resp.json();
                console.log('✅ Registro exitoso:', data);
                return { success: true, data };

            } else if (resp.status === 409) {
                // 🚫 Rostro ya registrado (409 Conflict)
                const data = await resp.json();
                console.log('🚫 Rostro ya registrado:', data);

                // Parsear los detalles del error del rostroJson
                let detallesError;
                try {
                    detallesError = JSON.parse(data.rostroJson);
                } catch (e) {
                    console.error('Error al parsear rostroJson:', e);
                    detallesError = {
                        error: 'Rostro ya registrado',
                        usuario_existente: 'Usuario desconocido',
                        distancia: 0
                    };
                }

                return {
                    success: false,
                    error: 'ROSTRO_DUPLICADO',
                    usuarioExistente: detallesError.usuario_existente || 'Usuario desconocido',
                    distancia: detallesError.distancia || 0,
                    mensaje: data.nombre || 'Rostro ya registrado en el sistema'
                };

            } else if (resp.status === 400) {
                // ❌ Error de validación (400 Bad Request)
                const data = await resp.json();
                console.log('❌ Error de validación:', data);

                let detallesError;
                try {
                    detallesError = JSON.parse(data.rostroJson);
                } catch (e) {
                    detallesError = { error: 'Error de validación' };
                }

                const mensaje = detallesError.detalle || detallesError.error || 'Error al procesar la imagen';

                return {
                    success: false,
                    error: 'VALIDATION_ERROR',
                    mensaje
                };

            } else {
                // ❌ Otros errores del servidor
                let data;
                try {
                    data = await resp.json();
                } catch (e) {
                    data = {};
                }

                console.log('❌ Error del servidor:', data);
                const mensaje = data.mensaje || `Error del servidor (${resp.status})`;

                return {
                    success: false,
                    error: 'SERVER_ERROR',
                    status: resp.status,
                    mensaje
                };
            }

        } catch (error) {
            console.error('💥 Error de red o conexión:', error);
            return {
                success: false,
                error: 'NETWORK_ERROR',
                mensaje: error instanceof Error ? error.message : 'Error de conexión'
            };
        }
    };

    // 🔴 FUNCIÓN MEJORADA para manejar el registro
    const handleRegistrar = async () => {
        if (!nombres.trim()) {
            setErrorMessage('Por favor, ingresa tu nombre completo.');
            return;
        }

        setIsRegistering(true);
        setShowCountdown(true);
        setRegistrationStatus('idle');
        setErrorMessage('');
        setDuplicateUserInfo(null);

        // Iniciar cuenta regresiva de 5 segundos
        for (let i = 3; i > 0; i--) {
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

            if (resultado.success) {
                // ✅ Registro exitoso
                console.log('✅ Registro completado:', resultado.data);
                setRegistrationStatus('success');

                // Mostrar resultado y redirigir después de 2 segundos
                setTimeout(() => {
                    navigate('/login');
                }, 2000);

            } else if (resultado.error === 'ROSTRO_DUPLICADO') {
                // 🚫 Rostro ya registrado
                console.log('🚫 Rostro duplicado detectado:', resultado);
                setRegistrationStatus('duplicate');
                setDuplicateUserInfo({
                    usuario: resultado.usuarioExistente || 'Usuario desconocido',
                    distancia: resultado.distancia || 0
                });
                setErrorMessage(
                    `Este rostro ya está registrado como: "${resultado.usuarioExistente}"\n` +
                    `Similitud detectada: ${(resultado.distancia || 0).toFixed(4)}\n\n` +
                    `Si esta es tu cuenta, ve al login. Si no, usa una foto diferente.`
                );

            } else {
                // ❌ Otros errores
                console.error('❌ Error en registro:', resultado);
                setRegistrationStatus('error');
                setErrorMessage(resultado.mensaje || 'Error desconocido durante el registro');
            }

        } catch (error) {
            console.error('💥 Error crítico en el registro:', error);
            setRegistrationStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Error desconocido durante el registro');
        } finally {
            setIsRegistering(false);
        }
    };

    const handleVolver = () => {
        navigate('/login');
    };

    // 🔴 NUEVA FUNCIÓN para ir al login cuando se detecta rostro duplicado
    const handleIrAlLogin = () => {
        navigate('/login');
    };

    // Función para volver a tomar foto (nueva funcionalidad)
    const retakePhoto = async () => {
        setCapturedImage(null);
        setRegistrationStatus('idle');
        setErrorMessage('');
        setDuplicateUserInfo(null);

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
        <div className="w-full flex">
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
                            src={hombreGif}
                            alt="Lenguaje de Señas"
                            className="w-80 h-auto object-contain"
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
                <div className="bg-slate-800/70 backdrop-blur-sm rounded-3xl p-10 w-full max-w-lg border border-slate-700/50 shadow-2xl">
                    <motion.h3
                        className="text-white text-xl font-medium text-center mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        Registrando Usuario
                    </motion.h3>

                    {/* 🔴 MENSAJE DE ERROR MEJORADO */}
                    {errorMessage && (
                        <motion.div
                            className={`mb-4 p-4 rounded-lg border ${
                                registrationStatus === 'duplicate'
                                    ? 'bg-amber-500/20 border-amber-500/50'
                                    : 'bg-red-500/20 border-red-500/50'
                            }`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="text-xl">
                                    {registrationStatus === 'duplicate' ? '⚠️' : '❌'}
                                </div>
                                <div>
                                    <p className={`text-sm font-medium mb-2 ${
                                        registrationStatus === 'duplicate' ? 'text-amber-200' : 'text-red-300'
                                    }`}>
                                        {registrationStatus === 'duplicate' ? 'Rostro Ya Registrado' : 'Error en el Registro'}
                                    </p>
                                    <p className={`text-xs leading-relaxed whitespace-pre-line ${
                                        registrationStatus === 'duplicate' ? 'text-amber-300' : 'text-red-300'
                                    }`}>
                                        {errorMessage}
                                    </p>

                                    {/* 🔴 BOTÓN ADICIONAL PARA IR AL LOGIN */}
                                    {registrationStatus === 'duplicate' && duplicateUserInfo && (
                                        <button
                                            onClick={handleIrAlLogin}
                                            className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-all duration-200"
                                        >
                                            Ir al Login →
                                        </button>
                                    )}
                                </div>
                            </div>
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

                            {/* 🔴 NUEVO OVERLAY para rostro duplicado */}
                            {registrationStatus === 'duplicate' && (
                                <div className="absolute inset-0 bg-amber-500 bg-opacity-75 flex items-center justify-center">
                                    <div className="text-white text-center p-4">
                                        <div className="text-4xl mb-4">⚠️</div>
                                        <div className="text-xl font-semibold mb-2">Rostro Ya Registrado</div>
                                        {duplicateUserInfo && (
                                            <>
                                                <div className="text-sm mb-1">Usuario: {duplicateUserInfo.usuario}</div>
                                                <div className="text-xs">Similitud: {duplicateUserInfo.distancia.toFixed(4)}</div>
                                            </>
                                        )}
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

                    {/* 🔴 BOTONES DE CONTROL MEJORADOS */}
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

                                {registrationStatus === 'duplicate' ? (
                                    // Botón especial para cuando hay rostro duplicado
                                    <button
                                        onClick={handleIrAlLogin}
                                        className="py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
                                    >
                                        Ir al Login
                                    </button>
                                ) : (
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
                                )}
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