import { useCallback, useRef, useState } from 'react';

/**
 * Hook para Texto-a-Voz con ElevenLabs API
 *
 * Características:
 * - Excelente calidad de voz en español
 * - Requiere API key de ElevenLabs
 * - Modelo multilingüe optimizado
 * - Control preciso de velocidad y volumen
 */

interface VoiceConfig {
  elevenlabsApiKey: string;
  elevenlabsVoiceId: string;
}

interface SpeechOptions {
  speed?: number; // Velocidad (0.5 - 2)
  volume?: number; // Volumen (0 - 1)
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export const useVoice = (config: VoiceConfig) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  /**
   * Función principal para sintetizar voz con ElevenLabs
   */
  const speak = useCallback(async (
    text: string,
    options: SpeechOptions = {}
  ) => {
    const { speed = 1.0, volume = 1.0, onStart, onEnd, onError } = options;

    // Validar configuración
    if (!config.elevenlabsApiKey || !config.elevenlabsVoiceId) {
      const error = new Error('ElevenLabs API key y Voice ID son requeridos');
      console.error(error.message);
      if (onError) onError(error);
      return;
    }

    try {
      setIsLoading(true);
      if (onStart) onStart();

      // Hacer petición a ElevenLabs API
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabsVoiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': config.elevenlabsApiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              speed: speed,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error en ElevenLabs API: ${response.status} ${response.statusText}`);
      }

      // Crear blob de audio y reproducir
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        if (onEnd) onEnd();
      };

      await audio.play();
      setIsLoading(false);
    } catch (error) {
      console.error('Error en ElevenLabs:', error);
      setIsLoading(false);
      setIsPlaying(false);
      if (onError) onError(error as Error);
    }
  }, [config]);

  /**
   * Detiene la reproducción actual
   */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  /**
   * Pausa la reproducción
   */
  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  /**
   * Resume la reproducción
   */
  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isLoading,
    isPlaying,
  };
};

// ====================================================================
// MENSAJES PREDEFINIDOS
// ====================================================================

export const VoiceMessages = {
  // Login/Auth
  LOGIN_SUCCESS: '¡Bienvenido! Inicio de sesión exitoso',
  LOGIN_ERROR: 'Error al iniciar sesión, intenta de nuevo',
  LOGOUT: '¡Hasta luego! Vuelve pronto',
  WELCOME: '¡Bienvenido a SeeTalk! Tu asistente de lenguaje de señas',
  
  // Detección de señas
  VOCAL_DETECTED: 'Vocal detectada correctamente',
  CORRECT_SIGN: '¡Excelente! Muy bien hecho',
  INCORRECT_SIGN: 'No es correcto, intenta de nuevo',
  TRY_AGAIN: 'Inténtalo una vez más',
  
  // Progreso
  LEVEL_COMPLETE: '¡Felicidades! Has completado este nivel',
  ACHIEVEMENT_UNLOCKED: '¡Has desbloqueado un nuevo logro!',
  NEW_VOCAL_UNLOCKED: '¡Genial! Has desbloqueado una nueva vocal',
  PERFECT_SCORE: '¡Perfecto! Puntuación máxima',
  
  // Cuenta regresiva
  COUNTDOWN_3: 'Tres',
  COUNTDOWN_2: 'Dos',
  COUNTDOWN_1: 'Uno',
  COUNTDOWN_GO: '¡Adelante!',
  
  // Instrucciones
  CAMERA_READY: 'Cámara lista, puedes comenzar',
  SHOW_YOUR_HAND: 'Muestra tu mano frente a la cámara',
  KEEP_POSITION: 'Mantén la posición, muy bien',
  
  // Errores
  CAMERA_ERROR: 'Error con la cámara, verifica los permisos',
  NO_HAND_DETECTED: 'No se detecta tu mano, acércala a la cámara',
  
  // Vocales específicas
  VOCAL_A: 'Vocal A',
  VOCAL_E: 'Vocal E',
  VOCAL_I: 'Vocal I',
  VOCAL_O: 'Vocal O',
  VOCAL_U: 'Vocal U',
} as const;
