# Hook useVoice - ElevenLabs Integration

## 🎯 Visión General

Este hook proporciona integración completa con la API de ElevenLabs para síntesis de voz de alta calidad en español, optimizada para aplicaciones educativas de aprendizaje de lengua de señas.

## 🚀 Configuración Inicial

### 1. Crear cuenta en ElevenLabs

1. Ve a [ElevenLabs.io](https://elevenlabs.io)
2. Crea una cuenta gratuita (incluye 10,000 caracteres mensuales)
3. Ve a **Perfil > API Keys > Crear nueva key**

### 2. Elegir voz

**Opción A: Usar voz pre-entrenada**
- Ve a **VoiceLab** en ElevenLabs
- Busca voces en español: "Rachel", "Domi", "Bella", etc.
- Copia el **Voice ID**

**Opción B: Crear voz personalizada (recomendado)**
- Ve a **VoiceLab > Add Voice > Instant Voice Cloning**
- Sube muestras de audio en español (mínimo 3 muestras de 30 segundos)
- ElevenLabs creará una voz única para tu aplicación

### 3. Configurar variables de entorno

```bash
# .env
VITE_ELEVENLABS_API_KEY=sk_your_actual_api_key_here
VITE_ELEVENLABS_VOICE_ID=your_voice_id_here
```

## 💻 Uso Básico

```typescript
import { useVoice, VoiceMessages } from '../hooks/useVoice';

const MyComponent = () => {
  const voiceConfig = {
    elevenlabsApiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
    elevenlabsVoiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID,
  };

  const { speak, isLoading, isPlaying, stop } = useVoice(voiceConfig);

  const handleSpeak = () => {
    speak('¡Hola! Esta es una prueba de voz en español');
  };

  return (
    <div>
      <button onClick={handleSpeak} disabled={isLoading}>
        {isLoading ? 'Generando...' : 'Hablar'}
      </button>

      {isPlaying && <p>🔊 Reproduciendo audio...</p>}
    </div>
  );
};
```

## 🎵 Mensajes Predefinidos

El hook incluye mensajes educativos específicos para aprendizaje de señas:

```typescript
import { VoiceMessages } from '../hooks/useVoice';

// Ejemplos de uso
speak(VoiceMessages.CORRECT_SIGN); // "¡Excelente! Muy bien hecho"
speak(VoiceMessages.NEW_VOCAL_UNLOCKED); // "¡Genial! Has desbloqueado una nueva vocal"
speak(VoiceMessages.VOCAL_A); // "Vocal A"
```

## ⚙️ Opciones Avanzadas

```typescript
speak('Texto personalizado', {
  speed: 0.9,      // Velocidad (0.5 - 2.0)
  volume: 0.8,     // Volumen (0.0 - 1.0)
  onStart: () => console.log('Audio iniciado'),
  onEnd: () => console.log('Audio terminado'),
  onError: (error) => console.error('Error:', error)
});
```

## 🔧 Control de Reproducción

```typescript
const { speak, stop, pause, resume, isLoading, isPlaying } = useVoice(voiceConfig);

// Detener cualquier audio
stop();

// Pausar temporalmente
pause();

// Reanudar desde donde quedó
resume();

// Estados disponibles
console.log('Cargando:', isLoading);
console.log('Reproduciendo:', isPlaying);
```

## 📋 Ejemplos de Integración

### En práctica de vocales:

```typescript
// Feedback inmediato
useEffect(() => {
  if (detectedLetter === selectedLetter && highestScore >= 90) {
    speak(VoiceMessages.CORRECT_SIGN);
  }
}, [detectedLetter, selectedLetter, highestScore]);

// Desbloqueo de vocales
useEffect(() => {
  if (justUnlockedVowel) {
    speak(`¡Felicidades! Has desbloqueado la vocal ${justUnlockedVowel.toUpperCase()}`);
  }
}, [justUnlockedVowel]);
```

### En instrucciones iniciales:

```typescript
const handleStartLesson = () => {
  speak(VoiceMessages.CAMERA_READY, {
    onEnd: () => {
      setTimeout(() => {
        speak(VoiceMessages.SHOW_YOUR_HAND);
      }, 1500);
    }
  });
};
```

## ⚠️ Manejo de Errores

```typescript
speak('Texto', {
  onError: (error) => {
    console.error('Error de voz:', error);
    // Fallback: mostrar mensaje visual
    setErrorMessage('Error de audio: ' + error.message);
  }
});
```

## 🎨 Personalización de Mensajes

Puedes crear tus propios mensajes educativos:

```typescript
const customMessages = {
  PERFECT_DETECTION: '¡Detección perfecta! Tu precisión es excelente',
  KEEP_PRACTICING: 'Sigue practicando, cada intento te acerca más al éxito',
  HAND_TOO_CLOSE: 'Tu mano está demasiado cerca de la cámara, aléjala un poco',
  HAND_TOO_FAR: 'Tu mano está demasiado lejos, acércala a la cámara',
};

speak(customMessages.PERFECT_DETECTION);
```

## 🔒 Seguridad y Privacidad

- Las API keys se manejan de forma segura en variables de entorno
- No se almacenan credenciales en el código fuente
- Las peticiones son HTTPS por defecto

## 📊 Límites y Costos

**Plan Gratuito:**
- 10,000 caracteres mensuales
- Aproximadamente 2-3 minutos de audio continuo

**Plan Creator ($5/mes):**
- 30,000 caracteres mensuales
- ~10 minutos de audio

**Plan Pro ($22/mes):**
- 160,000 caracteres mensuales
- ~50 minutos de audio

## 🚨 Solución de Problemas

### Error común: "API key inválida"
```typescript
// Verifica que tu API key tenga el formato correcto
console.log('API Key:', import.meta.env.VITE_ELEVENLABS_API_KEY);
// Debe empezar con "sk_" y tener más de 20 caracteres
```

### Error común: "Voice ID inválido"
```typescript
// Verifica que el Voice ID existe en tu cuenta de ElevenLabs
// Puedes encontrarlo en VoiceLab > Tu voz > Voice ID
```

### Problemas de red:
```typescript
speak('texto', {
  onError: (error) => {
    if (error.message.includes('fetch')) {
      console.log('Problema de conexión, reintentando...');
      // Implementar retry logic
    }
  }
});
```

## 🎉 ¡Listo para usar!

Con esta configuración, tu aplicación de aprendizaje de lengua de señas tendrá feedback de voz de alta calidad en español, mejorando significativamente la experiencia educativa de los usuarios.
