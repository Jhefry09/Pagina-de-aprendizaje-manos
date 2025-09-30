# 🤟 SeeTalk - Plataforma de Aprendizaje de Lengua de Señas

**SeeTalk** es una aplicación web interactiva desarrollada con React y TypeScript que utiliza inteligencia artificial y visión por computadora para enseñar lengua de señas de manera innovadora y accesible.

## 🌟 Características Principales

- **Reconocimiento de Gestos en Tiempo Real**: Utiliza MediaPipe para detectar y analizar movimientos de manos
- **Módulos de Aprendizaje Interactivos**: Vocales, abecedario, números, palabras y operaciones matemáticas
- **Sistema de Autenticación**: Gestión de usuarios con diferentes roles (estudiante, instructor, administrador)
- **Entrenamiento Personalizado**: Captura y almacenamiento de modelos de gestos personalizados
- **Estadísticas de Progreso**: Seguimiento detallado del avance del usuario
- **Interfaz Responsiva**: Diseño moderno con Tailwind CSS y animaciones con Framer Motion

## 🚀 Tecnologías Utilizadas

### Frontend
- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático para JavaScript
- **Vite** - Herramienta de construcción y desarrollo
- **Tailwind CSS** - Framework de CSS utilitario
- **Framer Motion** - Biblioteca de animaciones
- **React Router DOM** - Enrutamiento del lado del cliente

### Inteligencia Artificial y Visión por Computadora
- **MediaPipe** - Framework de Google para análisis de gestos
- **Face-API.js** - Detección y análisis facial
- **React Webcam** - Captura de video desde la cámara

### Otras Dependencias
- **Lucide React** - Iconos modernos
- **FontAwesome** - Iconos adicionales
- **Recharts** - Gráficos y visualizaciones
- **Heroicons** - Iconos de interfaz

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── HandSkeleton.tsx # Visualización de esqueleto de mano
│   ├── Navbar.tsx       # Barra de navegación
│   └── Sidebar.tsx      # Barra lateral
├── contexts/            # Contextos de React
│   ├── AuthContext.tsx  # Contexto de autenticación
│   ├── TransitionContext.tsx # Contexto de transiciones
│   └── TransitionProvider.tsx # Proveedor de transiciones
├── hooks/               # Hooks personalizados
│   ├── useAuth.ts       # Hook de autenticación
│   ├── useAuthLogic.ts  # Lógica de autenticación
│   ├── useTransition.ts # Hook de transiciones
│   └── useVocalContext.ts # Contexto de vocales
├── pages/               # Páginas de la aplicación
│   ├── Home/            # Página principal
│   ├── Login/           # Página de inicio de sesión
│   ├── Registro/        # Página de registro
│   ├── Training/        # Página de entrenamiento
│   ├── vocales/         # Módulo de vocales
│   ├── abecedario/      # Módulo de abecedario
│   ├── numeros/         # Módulo de números
│   ├── gestion-usuarios/ # Gestión de usuarios
│   └── estadisticas-entrenamiento/ # Estadísticas
├── assets/              # Recursos estáticos
│   ├── abecedario/      # Imágenes del abecedario
│   ├── numeros/         # Imágenes de números
│   └── img/             # Otras imágenes
├── types.ts             # Definiciones de tipos TypeScript
├── App.tsx              # Componente principal
└── main.tsx             # Punto de entrada
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- **Node.js** (versión 18 o superior)
- **npm** o **yarn**
- Cámara web funcional
- Navegador moderno con soporte para WebRTC

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd Pagina-de-aprendizaje-manos
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env en la raíz del proyecto
VITE_API_URL=http://localhost:8080
```

4. **Iniciar el servidor de desarrollo**
```bash
npm run dev
# o
yarn dev
```

5. **Abrir en el navegador**
```
http://localhost:5173
```

## 🎯 Módulos de Aprendizaje

### 1. **Vocales**
- Reconocimiento de las 5 vocales en lengua de señas
- Práctica interactiva con retroalimentación en tiempo real
- Estadísticas de progreso por vocal

### 2. **Abecedario**
- Aprendizaje completo del alfabeto en lengua de señas
- Ejercicios de práctica letra por letra
- Sistema de evaluación automática

### 3. **Números**
- Números del 0 al 9 y números compuestos
- Práctica de operaciones matemáticas básicas
- Reconocimiento de gestos numéricos

### 4. **Formar Palabras**
- Combinación de letras para formar palabras
- Diccionario de palabras comunes en lengua de señas
- Ejercicios de deletreo

### 5. **Operaciones Matemáticas**
- Suma, resta, multiplicación y división
- Símbolos matemáticos en lengua de señas
- Resolución de problemas matemáticos

## 🔐 Sistema de Autenticación

### Roles de Usuario
- **Estudiante**: Acceso a módulos de aprendizaje y estadísticas personales
- **Instructor**: Gestión de estudiantes y creación de contenido
- **Administrador**: Gestión completa del sistema y usuarios

### Funcionalidades
- Registro e inicio de sesión
- Gestión de perfiles de usuario
- Recuperación de contraseñas
- Persistencia de sesión con localStorage

## 🤖 Integración con MediaPipe

### Configuración de MediaPipe
```typescript
// Configuración básica de MediaPipe Hands
const hands = new window.Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
```

### Procesamiento de Landmarks
- Detección de 21 puntos clave por mano
- Normalización de coordenadas
- Análisis de gestos en tiempo real
- Comparación con modelos entrenados

## 📊 API y Backend

### Endpoints Principales
```
GET    /usuarios           # Obtener lista de usuarios
POST   /usuarios           # Crear nuevo usuario
PUT    /usuarios/:id       # Actualizar usuario
DELETE /usuarios/:id       # Eliminar usuario
POST   /auth/login         # Iniciar sesión
POST   /auth/register      # Registrar usuario
POST   /models/save        # Guardar modelo de gesto
GET    /models/:type       # Obtener modelos por tipo
```

### Comunicación WebSocket
- Conexión en tiempo real para entrenamiento
- Envío de landmarks de gestos
- Recepción de resultados de reconocimiento

## 🎨 Diseño y UX

### Principios de Diseño
- **Accesibilidad**: Diseño inclusivo para personas con discapacidad auditiva
- **Simplicidad**: Interfaz intuitiva y fácil de usar
- **Retroalimentación Visual**: Indicadores claros de progreso y resultados
- **Responsividad**: Adaptación a diferentes tamaños de pantalla

### Paleta de Colores
- Azul: Módulos de vocales
- Verde: Abecedario
- Amarillo: Números
- Púrpura: Operaciones matemáticas
- Índigo: Formar palabras

## 🧪 Testing y Desarrollo

### Scripts Disponibles
```bash
npm run dev      # Servidor de desarrollo
npm run build    # Construcción para producción
npm run lint     # Análisis de código con ESLint
npm run preview  # Vista previa de la construcción
```

### Configuración de TypeScript
- Tipado estricto habilitado
- Interfaces para MediaPipe y APIs
- Tipos personalizados para componentes

## 🚀 Despliegue

### Construcción para Producción
```bash
npm run build
```

### Archivos Generados
- `dist/` - Archivos optimizados para producción
- Compresión automática de assets
- Optimización de código JavaScript/TypeScript

## 🤝 Contribución

### Guías de Contribución
1. Fork del repositorio
2. Crear rama para nueva funcionalidad
3. Implementar cambios con tests
4. Crear Pull Request con descripción detallada

### Estándares de Código
- Usar TypeScript para tipado estricto
- Seguir convenciones de ESLint
- Documentar componentes y funciones
- Mantener consistencia en el estilo

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte y Contacto

Para reportar bugs, solicitar funcionalidades o obtener soporte:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo
- Revisar la documentación técnica

---

**SeeTalk** - Haciendo la lengua de señas accesible para todos 🤟
