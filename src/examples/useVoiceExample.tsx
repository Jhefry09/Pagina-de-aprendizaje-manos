/**
 * EJEMPLO DE USO DEL HOOK useVoice CON ELEVENLABS
 *
 * Este archivo muestra cómo integrar el hook de voz en tus componentes
 */

import { useState } from "react";
import { useVoice, VoiceMessages } from "../hooks/useVoice";

const VocalPracticePage = () => {
  // Estados necesarios para el ejemplo
  const [showConfetti, setShowConfetti] = useState(false);

  // Configuración requerida para ElevenLabs
  const voiceConfig = {
    elevenlabsApiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || 'tu-api-key-aqui',
    elevenlabsVoiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'tu-voice-id-aqui',
  };

  const { speak, isLoading, isPlaying, stop } = useVoice(voiceConfig);

  // Ejemplo 1: Feedback inmediato al detectar vocal correctamente
  const handleCorrectDetection = () => {
    speak(VoiceMessages.CORRECT_SIGN, {
      speed: 0.9, // Un poco más lento para claridad
      onStart: () => console.log('Iniciando feedback positivo'),
      onEnd: () => console.log('Feedback completado')
    });
  };

  // Ejemplo 2: Anuncio de nueva vocal desbloqueada
  const handleVocalUnlocked = (vocal: string) => {
    const vocalMessage = VoiceMessages[`VOCAL_${vocal.toUpperCase()}` as keyof typeof VoiceMessages];
    speak(`¡Felicidades! Has desbloqueado la ${vocalMessage}`, {
      speed: 0.8, // Más lento para mensajes importantes
      onStart: () => {
        // Puedes mostrar animación de celebración
        setShowConfetti(true);
      },
      onEnd: () => {
        setShowConfetti(false);
      }
    });
  };

  // Ejemplo 3: Instrucciones al iniciar
  const handleStartPractice = () => {
    speak(VoiceMessages.CAMERA_READY, {
      onEnd: () => {
        // Después de la bienvenida, dar instrucciones específicas
        setTimeout(() => {
          speak(VoiceMessages.SHOW_YOUR_HAND);
        }, 1000);
      }
    });
  };

  return (
    <div className="relative min-h-screen bg-gray-50 p-8">
      {/* Indicadores de estado de voz */}
      {isLoading && (
        <div className="fixed top-4 right-4 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg z-50 shadow-lg">
          Generando audio...
        </div>
      )}

      {isPlaying && (
        <div className="fixed top-4 right-8 bg-green-100 text-green-800 px-3 py-2 rounded-lg z-50 shadow-lg">
          🔊 Reproduciendo...
        </div>
      )}

      {/* Animación de confetti cuando se desbloquea vocal */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute top-1/4 left-1/4 text-4xl animate-bounce">🎉</div>
          <div className="absolute top-1/3 right-1/4 text-3xl animate-bounce delay-100">⭐</div>
          <div className="absolute bottom-1/3 left-1/3 text-5xl animate-bounce delay-200">🌟</div>
          <div className="absolute bottom-1/4 right-1/3 text-3xl animate-bounce delay-300">🎊</div>
        </div>
      )}

      {/* Botón de emergencia para detener audio */}
      <button
        onClick={stop}
        className="fixed bottom-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg z-50 transition-colors duration-200"
        title="Detener audio"
      >
        ⏸️
      </button>

      {/* Panel principal de ejemplo */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Ejemplo de Integración useVoice
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tarjeta de ejemplo 1 */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              🎯 Feedback Correcto
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Se activa cuando detectas correctamente una vocal
            </p>
            <button
              onClick={handleCorrectDetection}
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Generando...' : 'Probar Feedback'}
            </button>
          </div>

          {/* Tarjeta de ejemplo 2 */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              🏆 Desbloqueo de Vocal
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Se activa cuando desbloqueas una nueva vocal
            </p>
            <button
              onClick={() => handleVocalUnlocked('A')}
              disabled={isLoading}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Generando...' : 'Probar Desbloqueo'}
            </button>
          </div>

          {/* Tarjeta de ejemplo 3 */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              🚀 Inicio de Práctica
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Instrucciones secuenciales al comenzar
            </p>
            <button
              onClick={handleStartPractice}
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Generando...' : 'Iniciar Práctica'}
            </button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 p-6 bg-gray-800 text-white rounded-xl">
          <h3 className="text-lg font-semibold mb-3">📋 Estado Actual</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Cargando:</strong> {isLoading ? 'Sí' : 'No'}
            </div>
            <div>
              <strong>Reproduciendo:</strong> {isPlaying ? 'Sí' : 'No'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocalPracticePage;
