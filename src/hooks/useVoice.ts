import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook para Texto-a-Voz con Web Speech API del navegador
 *
 * Características:
 * - No requiere API keys
 * - Funciona offline
 * - Soporte nativo del navegador
 * - Control de velocidad, tono y volumen
 * - Selección de voces en español
 */

interface VoiceConfig {
  lang?: string; // Idioma (default: 'es-ES')
  voiceName?: string; // Nombre específico de voz (opcional)
}

interface SpeechOptions {
  speed?: number; // Velocidad (0.1 - 10, default: 1)
  pitch?: number; // Tono (0 - 2, default: 1)
  volume?: number; // Volumen (0 - 1, default: 1)
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export const useVoice = (config: VoiceConfig = {}) => {
  const { lang = 'es-ES', voiceName } = config;
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Inicializar Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;

      // Cargar voces disponibles
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        setAvailableVoices(voices);
      };

      loadVoices();
      
      // Algunas veces las voces se cargan de forma asíncrona
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  /**
   * Selecciona la mejor voz en español disponible
   */
  const selectSpanishVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!availableVoices.length) return null;

    // Si se especificó un nombre de voz, intentar encontrarla
    if (voiceName) {
      const namedVoice = availableVoices.find(v => v.name === voiceName);
      if (namedVoice) return namedVoice;
    }

    // Buscar voces en español (prioridad: es-ES, es-MX, es-US, cualquier es-*)
    const priorities = ['es-ES', 'es-MX', 'es-US'];
    
    for (const priority of priorities) {
      const voice = availableVoices.find(v => v.lang === priority);
      if (voice) return voice;
    }

    // Buscar cualquier voz que comience con 'es'
    const anySpanish = availableVoices.find(v => v.lang.startsWith('es'));
    if (anySpanish) return anySpanish;

    // Si no hay voces en español, usar la primera disponible
    return availableVoices[0] || null;
  }, [availableVoices, voiceName]);

  /**
   * Función principal para sintetizar voz con Web Speech API
   */
  const speak = useCallback(async (
    text: string,
    options: SpeechOptions = {}
  ) => {
    const { 
      speed = 1.0, 
      pitch = 1.0, 
      volume = 1.0, 
      onStart, 
      onEnd, 
      onError 
    } = options;

    // Validar que Web Speech API esté disponible
    if (!synthRef.current) {
      const error = new Error('Web Speech API no está disponible en este navegador');
      console.error(error.message);
      if (onError) onError(error);
      return;
    }

    try {
      // Cancelar cualquier síntesis en curso
      if (synthRef.current.speaking) {
        synthRef.current.cancel();
      }

      setIsLoading(true);

      // Crear nueva utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // Configurar propiedades
      utterance.lang = lang;
      utterance.rate = Math.max(0.1, Math.min(10, speed));
      utterance.pitch = Math.max(0, Math.min(2, pitch));
      utterance.volume = Math.max(0, Math.min(1, volume));

      // Seleccionar voz en español
      const selectedVoice = selectSpanishVoice();
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Configurar eventos
      utterance.onstart = () => {
        setIsLoading(false);
        setIsPlaying(true);
        if (onStart) onStart();
      };

      utterance.onend = () => {
        setIsPlaying(false);
        utteranceRef.current = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (event) => {
        console.error('Error en síntesis de voz:', event);
        setIsLoading(false);
        setIsPlaying(false);
        utteranceRef.current = null;
        
        const error = new Error(`Error de síntesis: ${event.error}`);
        if (onError) onError(error);
      };

      // Iniciar síntesis
      synthRef.current.speak(utterance);

    } catch (error) {
      console.error('Error al sintetizar voz:', error);
      setIsLoading(false);
      setIsPlaying(false);
      if (onError) onError(error as Error);
    }
  }, [lang, selectSpanishVoice]);

  /**
   * Detiene la reproducción actual
   */
  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    utteranceRef.current = null;
  }, []);

  /**
   * Pausa la reproducción
   */
  const pause = useCallback(() => {
    if (synthRef.current && synthRef.current.speaking && !synthRef.current.paused) {
      synthRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  /**
   * Resume la reproducción
   */
  const resume = useCallback(() => {
    if (synthRef.current && synthRef.current.paused) {
      synthRef.current.resume();
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
    availableVoices, // Lista de voces disponibles para selección manual
  };
};

// ====================================================================
// EJEMPLO DE USO
// ====================================================================

/*
import { useVoice, VoiceMessages } from './useVoice';

function MyComponent() {
  const { speak, stop, isPlaying, availableVoices } = useVoice({
    lang: 'es-ES',
    // voiceName: 'Google español' // Opcional: especificar voz
  });

  const handleSpeak = () => {
    speak(VoiceMessages.WELCOME, {
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
      onStart: () => console.log('Iniciando...'),
      onEnd: () => console.log('Finalizado'),
      onError: (err) => console.error(err)
    });
  };

  return (
    <div>
      <button onClick={handleSpeak}>
        {isPlaying ? 'Hablando...' : 'Hablar'}
      </button>
      <button onClick={stop}>Detener</button>
      
      <select onChange={(e) => {
        // Puedes permitir al usuario seleccionar una voz
        console.log('Voz seleccionada:', e.target.value);
      }}>
        {availableVoices
          .filter(v => v.lang.startsWith('es'))
          .map(v => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.lang})
            </option>
          ))
        }
      </select>
    </div>
  );
}
*/

// ====================================================================
// MENSAJES PREDEFINIDOS (Los mismos que tenías)
// ====================================================================

export const VoiceMessages = {
  // Login/Auth
  LOGIN_SUCCESS: '¡Bienvenido! Inicio de sesión exitoso',
  LOGIN_ERROR: 'Error al iniciar sesión, intenta de nuevo',
  LOGOUT: '¡Hasta luego! Vuelve pronto',
  WELCOME: '¡Bienvenido a SeeTalk! Tu asistente de lenguaje de señas',

  // Navegación y orientación
  NAVIGATION_HOME: 'Regresando al inicio',
  NAVIGATION_VOCALES: 'Módulo de vocales',
  NAVIGATION_NUMEROS: 'Módulo de números',
  NAVIGATION_ABECEDARIO: 'Módulo de abecedario',
  NAVIGATION_ESTADISTICAS: 'Ver estadísticas de progreso',
  NAVIGATION_CONFIGURACION: 'Configuración de usuario',

  // Detección de señas - General
  VOCAL_DETECTED: 'Vocal detectada correctamente',
  CORRECT_SIGN: '¡Excelente! Muy bien hecho',
  INCORRECT_SIGN: 'No es correcto, intenta de nuevo',
  TRY_AGAIN: 'Inténtalo una vez más',
  ALMOST_CORRECT: '¡Casi! Estás muy cerca',
  PERFECT_MATCH: '¡Detección perfecta! Excelente precisión',

  // Detección de señas - Específicos por vocal
  VOCAL_A_DETECTED: '¡Perfecto! Has hecho la vocal A correctamente',
  VOCAL_E_DETECTED: '¡Excelente! Vocal E detectada',
  VOCAL_I_DETECTED: '¡Muy bien! Has formado la vocal I',
  VOCAL_O_DETECTED: '¡Genial! Vocal O reconocida',
  VOCAL_U_DETECTED: '¡Perfecto! Has hecho la vocal U',

  // Progreso y logros
  LEVEL_COMPLETE: '¡Felicidades! Has completado este nivel',
  ACHIEVEMENT_UNLOCKED: '¡Has desbloqueado un nuevo logro!',
  NEW_VOCAL_UNLOCKED: '¡Genial! Has desbloqueado una nueva vocal',
  PERFECT_SCORE: '¡Perfecto! Puntuación máxima',
  STREAK_BONUS: '¡Racha increíble! Sigue así',
  PROGRESS_UPDATE: 'Tu progreso ha sido actualizado',

  // Motivación y refuerzo positivo
  KEEP_GOING: '¡Sigue practicando! Estás mejorando mucho',
  GREAT_EFFORT: '¡Esfuerzo excelente! Cada práctica cuenta',
  YOURE_IMPROVING: '¡Estás mejorando rápidamente! Excelente trabajo',
  DONT_GIVE_UP: '¡No te rindas! La práctica hace al maestro',
  AMAZING_WORK: '¡Trabajo increíble! Eres muy dedicado',

  // Cuenta regresiva y temporizadores
  COUNTDOWN_3: 'Tres',
  COUNTDOWN_2: 'Dos',
  COUNTDOWN_1: 'Uno',
  COUNTDOWN_GO: '¡Adelante!',
  TIME_UP: '¡Tiempo terminado!',
  ROUND_COMPLETE: '¡Ronda completada!',

  // Instrucciones específicas
  CAMERA_READY: 'Cámara lista, puedes comenzar',
  SHOW_YOUR_HAND: 'Muestra tu mano frente a la cámara',
  KEEP_POSITION: 'Mantén la posición, muy bien',
  RELAX_HAND: 'Relaja tu mano y forma la seña naturalmente',
  ADJUST_POSITION: 'Ajusta la posición de tu mano',
  CLEAR_VIEW: 'Asegúrate de que tu mano esté claramente visible',

  // Errores técnicos
  CAMERA_ERROR: 'Error con la cámara, verifica los permisos',
  NO_HAND_DETECTED: 'No se detecta tu mano, acércala a la cámara',
  HAND_TOO_CLOSE: 'Tu mano está muy cerca de la cámara',
  HAND_TOO_FAR: 'Tu mano está muy lejos de la cámara',
  POOR_LIGHTING: 'La iluminación no es suficiente',
  TRY_AGAIN_LATER: 'Error técnico, intenta de nuevo más tarde',

  // Operadores matemáticos
  OPERATOR_DETECTED: 'Operador detectado correctamente',
  EQUALS_DETECTED: 'Signo igual detectado',
  CLEAR_EXPRESSION: 'Expresión borrada',
  RESULT_IS: 'El resultado es',

  // Números específicos
  NUMBER_DETECTED: 'Número detectado correctamente',
  NUMBER_1: 'Número uno',
  NUMBER_2: 'Número dos',
  NUMBER_3: 'Número tres',
  NUMBER_4: 'Número cuatro',
  NUMBER_5: 'Número cinco',
  NUMBER_6: 'Número seis',
  NUMBER_7: 'Número siete',
  NUMBER_8: 'Número ocho',
  NUMBER_9: 'Número nueve',
  NUMBER_10: 'Número diez',

  // Abecedario
  LETTER_DETECTED: 'Letra detectada correctamente',
  ALPHABET_COMPLETE: '¡Felicidades! Has completado el abecedario',
  LETTER_PRACTICE: 'Practica esta letra con atención',

  // Práctica de palabras
  WORD_DETECTED: 'Palabra detectada correctamente',
  WORD_COMPLETE: '¡Palabra completada! Excelente trabajo',
  SYLLABLE_PRACTICE: 'Practica cada sílaba con cuidado',
  FLUENCY_IMPROVING: 'Tu fluidez está mejorando notablemente',

  // Estadísticas y progreso
  DAILY_GOAL_ACHIEVED: '¡Meta diaria cumplida! Excelente consistencia',
  WEEKLY_PROGRESS: 'Tu progreso semanal es impresionante',
  MONTHLY_MILESTONE: '¡Has alcanzado un hito mensual importante!',
  PERSONAL_RECORD: '¡Nuevo récord personal! Sigue así',

  // Configuración y ajustes
  SETTINGS_SAVED: 'Configuración guardada exitosamente',
  VOICE_SETTINGS_UPDATED: 'Ajustes de voz actualizados',
  CAMERA_SETTINGS_UPDATED: 'Configuración de cámara actualizada',
  PROFILE_UPDATED: 'Perfil de usuario actualizado',

  // Sesiones de entrenamiento
  TRAINING_START: '¡Comenzando sesión de entrenamiento!',
  TRAINING_COMPLETE: '¡Sesión de entrenamiento completada!',
  BREAK_TIME: 'Tiempo de descanso, relájate un momento',
  FOCUS_MODE: 'Modo concentración activado',
  RELAXATION_MODE: 'Modo relajación activado',

  // Retroalimentación específica
  HAND_POSITION_EXCELLENT: 'Posición de mano excelente',
  TIMING_PERFECT: '¡Sincronización perfecta!',
  GESTURE_FLUID: 'Gesto fluido y natural',
  EXPRESSION_CLEAR: 'Expresión clara y definida',

  // Desafíos y juegos
  CHALLENGE_START: '¡Nuevo desafío iniciado!',
  CHALLENGE_COMPLETE: '¡Desafío completado exitosamente!',
  BONUS_POINTS: '¡Puntos bonus por velocidad!',
  TIME_BONUS: '¡Bonus de tiempo conseguido!',

  // Vocales específicas
  VOCAL_A: 'Vocal A',
  VOCAL_E: 'Vocal E',
  VOCAL_I: 'Vocal I',
  VOCAL_O: 'Vocal O',
  VOCAL_U: 'Vocal U',

  // Mensajes de ánimo específicos
  VOCAL_A_MOTIVATION: '¡La vocal A es fundamental! Excelente trabajo',
  VOCAL_E_MOTIVATION: '¡La vocal E requiere precisión! Muy bien hecho',
  VOCAL_I_MOTIVATION: '¡La vocal I es elegante! Perfecta ejecución',
  VOCAL_O_MOTIVATION: '¡La vocal O es expresiva! Muy buena técnica',
  VOCAL_U_MOTIVATION: '¡La vocal U es única! Ejecución excelente',

  // Consejos técnicos
  CAMERA_TIP: 'Asegúrate de que la cámara tenga buena iluminación',
  HAND_TIP: 'Mantén tu mano relajada pero firme',
  DISTANCE_TIP: 'Mantén una distancia óptima de la cámara',
  ANGLE_TIP: 'Ajusta el ángulo para mejor visibilidad',

  // Celebraciones especiales
  MILESTONE_ACHIEVED: '¡Hito importante alcanzado! Celebración merecida',
  STREAK_MAINTAINED: '¡Racha mantenida! Consistencia admirable',
  SKILL_IMPROVED: '¡Habilidad mejorada significativamente!',
  MASTERY_ACHIEVED: '¡Dominio alcanzado! Eres un experto',

  // Mensajes de recuperación
  TAKE_BREAK: 'Tómate un descanso si lo necesitas',
  RESUME_WHEN_READY: 'Reanuda cuando estés listo',
  DONT_RUSH: 'No hay prisa, la calidad es más importante que la velocidad',
  PATIENCE_PAYS: 'La paciencia y la práctica constante dan resultados',

  // Mensajes de cierre
  SESSION_END: '¡Sesión finalizada! Excelente trabajo hoy',
  SEE_YOU_SOON: '¡Nos vemos pronto para más práctica!',
  KEEP_PRACTICING: '¡Sigue practicando diariamente!',
  YOU_ARE_AMAZING: '¡Eres increíble! Cada día mejoras más',

  // Estados de carga y procesamiento
  LOADING_MODELS: 'Cargando modelos de reconocimiento',
  PROCESSING_VIDEO: 'Procesando video en tiempo real',
  CALCULATING_SCORE: 'Calculando puntuación',
  SAVING_PROGRESS: 'Guardando progreso',

  // Mensajes de error con soluciones
  CONNECTION_ERROR: 'Error de conexión, verifica tu internet',
  MEMORY_ERROR: 'Error de memoria, cierra otras aplicaciones',
  HARDWARE_ERROR: 'Error de hardware, verifica tu cámara',
  SOFTWARE_ERROR: 'Error de software, reinicia la aplicación',

  // Mensajes de accesibilidad
  ACCESSIBILITY_MODE: 'Modo accesibilidad activado',
  HIGH_CONTRAST: 'Modo alto contraste activado',
  SCREEN_READER: 'Modo lector de pantalla activado',
  VOICE_GUIDANCE: 'Guía de voz activada',

  // Mensajes sociales y comunidad
  SHARE_PROGRESS: '¡Comparte tu progreso con la comunidad!',
  JOIN_COMMUNITY: 'Únete a nuestra comunidad de aprendizaje',
  HELP_OTHERS: 'Ayuda a otros estudiantes con tus conocimientos',

  // Mensajes de mantenimiento
  UPDATE_AVAILABLE: 'Actualización disponible, considera actualizar',
  BACKUP_SAVED: 'Progreso respaldado automáticamente',
  SYNC_COMPLETE: 'Sincronización completada',

  // Mensajes de personalización
  CUSTOM_VOICE_SET: 'Voz personalizada configurada',
  THEME_CHANGED: 'Tema visual cambiado',
  DIFFICULTY_ADJUSTED: 'Dificultad ajustada a tu nivel',

  // Mensajes de descubrimiento
  NEW_FEATURE: '¡Nueva función disponible! Explórala',
  TIP_DISCOVERED: 'Consejo descubierto: practica diariamente',
  ACHIEVEMENT_EARNED: '¡Logro obtenido! Sigue progresando',

  // Mensajes de contexto
  MORNING_SESSION: '¡Buenos días! Comenzando práctica matutina',
  AFTERNOON_SESSION: '¡Buenas tardes! Sesión de práctica activa',
  EVENING_SESSION: '¡Buenas noches! Última práctica del día',

  // Mensajes de refuerzo positivo específico
  SPEED_IMPROVED: '¡Tu velocidad ha mejorado notablemente!',
  ACCURACY_INCREASED: '¡Tu precisión es cada vez mejor!',
  CONFIDENCE_BOOST: '¡Muestra más confianza en tus señas!',
  FLUIDITY_ACHIEVED: '¡Has logrado una fluidez excelente!',

  // Mensajes de corrección técnica
  HAND_ORIENTATION: 'Ajusta la orientación de tu mano',
  FINGER_POSITION: 'Corrige la posición de tus dedos',
  WRIST_ANGLE: 'Ajusta el ángulo de tu muñeca',
  ELBOW_POSITION: 'Mantén tu codo en una posición cómoda',

  // Mensajes de práctica avanzada
  EXPRESSION_PRACTICE: 'Practica la expresión facial junto con las señas',
  RHYTHM_PRACTICE: 'Mantén un ritmo constante en tus movimientos',
  TRANSITION_PRACTICE: 'Practica las transiciones entre señas',
  COMBINATION_PRACTICE: 'Combina múltiples señas fluidamente',

  // Mensajes de logros específicos
  FIRST_VOCAL: '¡Tu primera vocal! Excelente comienzo',
  FIRST_NUMBER: '¡Primer número aprendido! Sigue así',
  FIRST_WORD: '¡Primera palabra completada! Progreso increíble',
  VOCAL_MASTERY: '¡Dominio completo de las vocales!',
  NUMBER_MASTERY: '¡Dominio completo de los números!',
  ALPHABET_MASTERY: '¡Dominio completo del abecedario!',

  // Mensajes de apoyo emocional
  BE_PATIENT: 'Sé paciente contigo mismo, el aprendizaje toma tiempo',
  CELEBRATE_PROGRESS: 'Celebra cada pequeño avance',
  YOU_CAN_DO_IT: '¡Tú puedes lograrlo! Cree en ti mismo',
  EVERY_EXPERT_WAS_ONCE_A_BEGINNER: 'Todos los expertos comenzaron como principiantes',

  // Mensajes de contexto situacional
  FOCUS_REMINDER: 'Mantén tu concentración en la práctica',
  POSTURE_REMINDER: 'Mantén una postura cómoda y relajada',
  BREATHING_REMINDER: 'Respira profundamente y relájate',
  ENVIRONMENT_REMINDER: 'Asegúrate de tener un entorno tranquilo',

  // Mensajes de cierre motivacional
  PRACTICE_MAKES_PERFECT: 'La práctica constante lleva a la perfección',
  CONSISTENCY_IS_KEY: 'La consistencia es la clave del éxito',
  EVERY_DAY_COUNTS: 'Cada día de práctica cuenta hacia tu meta',
  NEVER_STOP_LEARNING: 'Nunca dejes de aprender y mejorar',

  // Mensajes de reconocimiento de esfuerzo
  HARD_WORK_PAYS_OFF: '¡Tu esfuerzo duro está dando frutos!',
  DEDICATION_RECOGNIZED: '¡Tu dedicación es admirable!',
  PERSISTENCE_REWARDED: '¡La persistencia siempre es recompensada!',
  COMMITMENT_APPLAUDED: '¡Tu compromiso con el aprendizaje es inspirador!',

  // Mensajes específicos para diferentes niveles de dificultad
  BEGINNER_LEVEL: 'Nivel principiante: enfócate en la forma básica',
  INTERMEDIATE_LEVEL: 'Nivel intermedio: agrega expresión y fluidez',
  ADVANCED_LEVEL: 'Nivel avanzado: perfecciona velocidad y precisión',
  EXPERT_LEVEL: 'Nivel experto: domina todos los aspectos técnicos',

  // Mensajes de práctica específica por módulo
  VOCALES_FOCUS: 'Enfócate en la posición exacta de cada dedo para las vocales',
  NUMEROS_FOCUS: 'Los números requieren movimientos precisos de la mano',
  ABECEDARIO_FOCUS: 'Cada letra tiene su forma única, practica cada una',
  PALABRAS_FOCUS: 'Las palabras combinan múltiples señas fluidamente',

  // Mensajes de tips específicos
  VOCAL_A_TIP: 'Para la vocal A, mantén los dedos juntos y la palma hacia adelante',
  VOCAL_E_TIP: 'Para la vocal E, curva los dedos hacia la palma',
  VOCAL_I_TIP: 'Para la vocal I, forma un puño con el pulgar hacia afuera',
  VOCAL_O_TIP: 'Para la vocal O, forma un círculo con los dedos',
  VOCAL_U_TIP: 'Para la vocal U, toca el pulgar con el dedo índice',

  // Mensajes de celebración de hitos
  FIRST_WEEK: '¡Primera semana completada! Excelente consistencia',
  FIRST_MONTH: '¡Primer mes de práctica! Progreso increíble',
  FIRST_QUARTER: '¡Tres meses de dedicación! Resultados visibles',
  HALF_YEAR: '¡Seis meses de práctica constante! Eres increíble',

  // Mensajes de refuerzo técnico
  CAMERA_ANGLE_IDEAL: 'El ángulo de cámara es perfecto',
  LIGHTING_OPTIMAL: 'La iluminación es óptima para la detección',
  HAND_POSITION_IDEAL: 'Posición de mano ideal detectada',
  BACKGROUND_CLEAN: 'Fondo limpio y sin distracciones',

  // Mensajes de recuperación de errores
  TECHNICAL_ISSUE: 'Problema técnico detectado, ajustando parámetros',
  RECALIBRATING: 'Recalibrando reconocimiento de manos',
  RETRYING_DETECTION: 'Reintentando detección, mantén la posición',
  SYSTEM_OPTIMIZING: 'Optimizando sistema para mejor rendimiento',

  // Mensajes de interacción social
  SHARE_ACHIEVEMENT: '¡Comparte este logro con tus amigos!',
  INVITE_FRIENDS: 'Invita a tus amigos a unirse al aprendizaje',
  COMMUNITY_SUPPORT: 'La comunidad está aquí para apoyarte',

  // Mensajes finales de cierre
  SESSION_SUMMARY: 'Sesión completada exitosamente',
  PROGRESS_SAVED: 'Progreso guardado correctamente',
  SEE_YOU_NEXT_TIME: '¡Nos vemos en la próxima sesión!',
  KEEP_UP_THE_GREAT_WORK: '¡Sigue con el excelente trabajo!',

  // Mensajes de emergencia y soporte
  NEED_HELP: '¿Necesitas ayuda? Consulta la documentación',
  CONTACT_SUPPORT: 'Contacta al soporte técnico si persiste el problema',
  REPORT_ISSUE: 'Reporte este problema para mejorarlo',
  FEEDBACK_WELCOME: 'Tus comentarios ayudan a mejorar la aplicación',

  // Mensajes de mantenimiento y actualizaciones
  MAINTENANCE_MODE: 'Modo mantenimiento activado',
  UPDATE_IN_PROGRESS: 'Actualización en progreso',
  BACKUP_IN_PROGRESS: 'Respaldo automático en proceso',
  SYNC_IN_PROGRESS: 'Sincronización de datos en progreso',

  // Mensajes de logros especiales
  SPEED_DEMON: '¡Maestro de la velocidad! Récord de tiempo',
  ACCURACY_MASTER: '¡Maestro de la precisión! Puntuación perfecta',
  CONSISTENCY_CHAMPION: '¡Campeón de la consistencia! Racha increíble',
  PERFECTIONIST: '¡Perfeccionista nato! Excelencia absoluta',

  // Mensajes de contexto cultural
  SPANISH_CONTEXT: 'Practicando lengua de señas en contexto español',
  LATIN_AMERICAN_SIGNS: 'Usando variaciones latinoamericanas',
  NEUTRAL_SPANISH: 'Usando señas estándar neutrales',

  // Mensajes de práctica adaptativa
  DIFFICULTY_INCREASED: 'Dificultad aumentada para tu nivel',
  PERSONALIZED_PRACTICE: 'Ejercicios personalizados para ti',
  ADAPTIVE_LEARNING: 'Aprendizaje adaptativo activado',
  CUSTOM_CHALLENGES: 'Desafíos personalizados creados para ti',

  // Mensajes de cierre emocional
  PROUD_OF_YOU: '¡Estoy orgulloso de tu progreso!',
  YOU_ARE_AWESOME: '¡Eres increíble! Nunca dejes de creer en ti',
  BRIGHT_FUTURE: '¡Un futuro brillante te espera con dedicación!',
  UNLIMITED_POTENTIAL: '¡Tu potencial es ilimitado!',

  // Mensajes técnicos específicos
  MODEL_LOADED: 'Modelo de reconocimiento cargado',
  CALIBRATION_COMPLETE: 'Calibración completada',
  DETECTION_OPTIMIZED: 'Detección optimizada para tu cámara',
  PROCESSING_ENHANCED: 'Procesamiento mejorado activado',

  // Mensajes de interacción con la aplicación
  APP_STARTING: 'Aplicación iniciándose',
  LOADING_CONTENT: 'Cargando contenido educativo',
  INITIALIZING_CAMERA: 'Inicializando cámara',
  READY_TO_START: '¡Todo listo para comenzar!',

  // Mensajes de cierre de sesión
  GOODBYE: '¡Adiós! Que tengas un excelente día',
  COME_BACK_SOON: '¡Vuelve pronto para más práctica!',
  UNTIL_NEXT_TIME: '¡Hasta la próxima sesión!',

  // Mensajes de error con contexto específico
  VOCAL_NOT_RECOGNIZED: 'Esta vocal no fue reconocida, intenta de nuevo',
  NUMBER_NOT_DETECTED: 'Número no detectado, ajusta tu posición',
  LETTER_NOT_IDENTIFIED: 'Letra no identificada, verifica tu seña',
  WORD_NOT_COMPLETE: 'Palabra incompleta, completa todas las señas',

  // Mensajes de validación técnica
  CAMERA_PERMISSION_DENIED: 'Permiso de cámara denegado, habilítalo en configuración',
  CAMERA_NOT_ACCESSIBLE: 'Cámara no accesible, verifica conexiones',
  MICROPHONE_NEEDED: 'Se necesita micrófono para funciones avanzadas',
  STORAGE_PERMISSION: 'Permiso de almacenamiento requerido para guardar progreso',

  // Mensajes de contexto situacional avanzado
  LOW_BATTERY: 'Batería baja detectada, considera cargar el dispositivo',
  OVERHEATING: 'Dispositivo calentándose, toma un descanso',
  NETWORK_ISSUES: 'Problemas de red detectados, verifica conexión',
  SYSTEM_RESOURCES: 'Recursos del sistema limitados, cierra otras aplicaciones',

  // Mensajes de cierre triunfante
  MISSION_ACCOMPLISHED: '¡Misión cumplida! Objetivo alcanzado',
  GOAL_ACHIEVED: '¡Meta lograda! Celebración merecida',
  VICTORY_EARNED: '¡Victoria ganada! Eres un campeón',
  TRIUMPH_CELEBRATED: '¡Triunfo celebrado! Día memorable',

  // Mensajes finales motivacionales
  JOURNEY_CONTINUES: 'El viaje continúa, ¡sigue adelante!',
  NEXT_CHALLENGE_AWAITS: '¡El próximo desafío te espera!',
  ALWAYS_STRIVE_FOR_BETTER: '¡Siempre busca ser mejor que ayer!',
  YOUR_POTENTIAL_IS_LIMITLESS: '¡Tu potencial no tiene límites!',
} as const;
