# 📋 Documentación Técnica - SeeTalk

## 🏗️ Arquitectura del Sistema

### Patrón de Arquitectura
SeeTalk sigue una arquitectura **Component-Based** con **Context API** para el manejo de estado global y **Custom Hooks** para la lógica reutilizable.

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
├─────────────────────────────────────────────────────────────┤
│  Components  │  Pages  │  Contexts  │  Hooks  │  Utils      │
├─────────────────────────────────────────────────────────────┤
│                    MediaPipe Integration                    │
├─────────────────────────────────────────────────────────────┤
│                      WebSocket/HTTP                         │
├─────────────────────────────────────────────────────────────┤
│                    Backend API (Spring)                     │
└─────────────────────────────────────────────────────────────┘
```

## 🤖 Integración con MediaPipe

### Configuración y Inicialización

```typescript
// Configuración de MediaPipe Hands
const initializeMediaPipe = async () => {
  const hands = new window.Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  hands.onResults(onResults);
  return hands;
};
```

### Procesamiento de Landmarks

```typescript
interface NormalizedLandmark {
  x: number;  // Coordenada X normalizada (0-1)
  y: number;  // Coordenada Y normalizada (0-1)
  z: number;  // Profundidad relativa
  visibility?: number; // Visibilidad del punto (0-1)
}

// Procesamiento de resultados de MediaPipe
const onResults = (results: Results) => {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    const handedness = results.multiHandedness[0].label;
    
    // Procesar solo mano derecha para consistencia
    if (handedness === 'Right') {
      setLandmarks(landmarks);
      setIsRightHandDetected(true);
    }
  } else {
    setIsRightHandDetected(false);
  }
};
```

### Puntos Clave de la Mano (21 Landmarks)

```
    8   12  16  20
    |   |   |   |
    7   11  15  19
    |   |   |   |
    6   10  14  18
     \ |   |   /
      \|   |  /
       5   9 13 17
        \ | | /
         \| |/
          4 3
           |
           2
           |
           1
           |
           0 (WRIST)
```

## 🔄 Gestión de Estado

### Context API Structure

```typescript
// AuthContext - Manejo de autenticación
interface AuthContextType {
  user: UserData | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
  isAuthenticated: boolean;
}

// TransitionContext - Manejo de transiciones
interface TransitionContextType {
  isTransitioning: boolean;
  startTransition: () => void;
  endTransition: () => void;
}
```

### Custom Hooks

```typescript
// useAuth - Hook de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// useAuthLogic - Lógica de autenticación
export const useAuthLogic = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Implementación de login, logout, register
  // ...
};
```

## 🎨 Sistema de Componentes

### Componentes Base

#### Navbar Component
```typescript
interface NavbarProps {
  activeLink: string;
}

const Navbar: React.FC<NavbarProps> = ({ activeLink }) => {
  // Navegación principal con indicadores de estado
  // Responsive design con Tailwind CSS
  // Integración con sistema de autenticación
};
```

#### HandSkeleton Component
```typescript
interface HandSkeletonProps {
  landmarks: NormalizedLandmark[];
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const HandSkeleton: React.FC<HandSkeletonProps> = ({ landmarks, canvasRef }) => {
  // Visualización de esqueleto de mano en tiempo real
  // Dibuja conexiones entre landmarks
  // Indicadores visuales de detección
};
```

### Páginas Principales

#### Training Page
- **Propósito**: Entrenamiento y captura de gestos
- **Funcionalidades**:
  - Captura de video en tiempo real
  - Detección de gestos con MediaPipe
  - Almacenamiento de modelos de gestos
  - Retroalimentación visual

#### Home Page
- **Propósito**: Dashboard principal y navegación
- **Funcionalidades**:
  - Saludo personalizado basado en hora
  - Módulos de aprendizaje disponibles
  - Navegación a diferentes secciones
  - Estado de autenticación

## 🔌 Integración con Backend

### API Endpoints

```typescript
// Configuración base de API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Servicios de API
class ApiService {
  // Autenticación
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  }

  // Gestión de usuarios
  static async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/usuarios`);
    return response.json();
  }

  // Modelos de gestos
  static async saveModel(modelData: ModelData): Promise<SaveResponse> {
    const response = await fetch(`${API_BASE_URL}/models/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modelData)
    });
    return response.json();
  }
}
```

### WebSocket Integration

```typescript
// Configuración de WebSocket para tiempo real
class WebSocketService {
  private stompClient: StompClient | null = null;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new window.SockJS(`${API_BASE_URL}/ws`);
      this.stompClient = window.Stomp.over(socket);
      
      this.stompClient.connect({}, () => {
        console.log('WebSocket connected');
        resolve();
      }, (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });
    });
  }

  sendLandmarks(landmarks: NormalizedLandmark[]): void {
    if (this.stompClient?.connected) {
      this.stompClient.send('/app/landmarks', {}, JSON.stringify(landmarks));
    }
  }

  subscribe(destination: string, callback: (message: any) => void): void {
    if (this.stompClient?.connected) {
      this.stompClient.subscribe(destination, callback);
    }
  }
}
```

## 🎯 Algoritmos de Reconocimiento

### Comparación de Gestos

```typescript
// Algoritmo de comparación de landmarks
const compareGestures = (
  capturedLandmarks: NormalizedLandmark[],
  modelLandmarks: NormalizedLandmark[]
): number => {
  if (capturedLandmarks.length !== modelLandmarks.length) {
    return 0;
  }

  let totalDistance = 0;
  for (let i = 0; i < capturedLandmarks.length; i++) {
    const captured = capturedLandmarks[i];
    const model = modelLandmarks[i];
    
    // Distancia euclidiana 3D
    const distance = Math.sqrt(
      Math.pow(captured.x - model.x, 2) +
      Math.pow(captured.y - model.y, 2) +
      Math.pow(captured.z - model.z, 2)
    );
    
    totalDistance += distance;
  }

  // Normalizar y convertir a porcentaje de similitud
  const averageDistance = totalDistance / capturedLandmarks.length;
  const similarity = Math.max(0, 1 - averageDistance);
  return similarity * 100;
};
```

### Normalización de Coordenadas

```typescript
// Normalización de landmarks para consistencia
const normalizeLandmarks = (landmarks: NormalizedLandmark[]): NormalizedLandmark[] => {
  if (landmarks.length === 0) return [];

  // Encontrar el punto de referencia (muñeca - índice 0)
  const wrist = landmarks[0];
  
  return landmarks.map(landmark => ({
    x: landmark.x - wrist.x,
    y: landmark.y - wrist.y,
    z: landmark.z - wrist.z,
    visibility: landmark.visibility
  }));
};
```

## 🔧 Configuración de Desarrollo

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## 🚀 Optimizaciones de Rendimiento

### Lazy Loading de Componentes

```typescript
// Carga diferida de páginas
const HomePage = lazy(() => import('./pages/Home/Page'));
const TrainingPage = lazy(() => import('./pages/Training/Page'));
const VocalesPage = lazy(() => import('./pages/vocales/page'));

// Wrapper con Suspense
const LazyComponent = ({ Component }: { Component: React.ComponentType }) => (
  <Suspense fallback={<LoadingSpinner />}>
    <Component />
  </Suspense>
);
```

### Memoización de Componentes

```typescript
// Memoización para evitar re-renders innecesarios
const MemoizedHandSkeleton = memo(HandSkeleton);
const MemoizedNavbar = memo(Navbar);

// useMemo para cálculos costosos
const processedLandmarks = useMemo(() => {
  return normalizeLandmarks(landmarks);
}, [landmarks]);
```

### Debouncing para MediaPipe

```typescript
// Debouncing para reducir procesamiento
const debouncedProcessLandmarks = useCallback(
  debounce((landmarks: NormalizedLandmark[]) => {
    processLandmarks(landmarks);
  }, 100),
  []
);
```

## 🔒 Seguridad

### Validación de Datos

```typescript
// Validación de entrada de usuario
const validateUserInput = (input: string): boolean => {
  // Sanitización básica
  const sanitized = input.trim().replace(/[<>]/g, '');
  return sanitized.length > 0 && sanitized.length <= 100;
};

// Validación de landmarks
const validateLandmarks = (landmarks: any[]): landmarks is NormalizedLandmark[] => {
  return landmarks.every(landmark => 
    typeof landmark.x === 'number' &&
    typeof landmark.y === 'number' &&
    typeof landmark.z === 'number' &&
    landmark.x >= 0 && landmark.x <= 1 &&
    landmark.y >= 0 && landmark.y <= 1
  );
};
```

### Manejo de Errores

```typescript
// Error Boundary para capturar errores de React
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## 📊 Monitoreo y Analytics

### Métricas de Rendimiento

```typescript
// Medición de tiempo de respuesta de MediaPipe
const measurePerformance = (callback: () => void) => {
  const start = performance.now();
  callback();
  const end = performance.now();
  console.log(`Tiempo de procesamiento: ${end - start}ms`);
};

// Tracking de eventos de usuario
const trackUserEvent = (event: string, data?: any) => {
  // Implementar analytics (Google Analytics, etc.)
  console.log(`Evento: ${event}`, data);
};
```

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Ejemplo de test para utilidades
describe('Gesture Recognition Utils', () => {
  test('should normalize landmarks correctly', () => {
    const landmarks = [
      { x: 0.5, y: 0.5, z: 0 },
      { x: 0.6, y: 0.6, z: 0.1 }
    ];
    
    const normalized = normalizeLandmarks(landmarks);
    expect(normalized[0]).toEqual({ x: 0, y: 0, z: 0 });
  });

  test('should compare gestures accurately', () => {
    const gesture1 = [{ x: 0, y: 0, z: 0 }];
    const gesture2 = [{ x: 0, y: 0, z: 0 }];
    
    const similarity = compareGestures(gesture1, gesture2);
    expect(similarity).toBe(100);
  });
});
```

### Integration Tests

```typescript
// Test de integración con MediaPipe
describe('MediaPipe Integration', () => {
  test('should initialize MediaPipe correctly', async () => {
    const hands = await initializeMediaPipe();
    expect(hands).toBeDefined();
    expect(typeof hands.onResults).toBe('function');
  });
});
```

---

Esta documentación técnica proporciona una visión detallada de la implementación interna de SeeTalk, incluyendo patrones de arquitectura, integración con MediaPipe, y mejores prácticas de desarrollo.
