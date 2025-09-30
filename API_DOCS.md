# 🔌 Documentación de API - SeeTalk

## 📋 Información General

La API de SeeTalk está construida con **Spring Boot** y proporciona endpoints RESTful para la gestión de usuarios, autenticación, y almacenamiento de modelos de gestos. También incluye comunicación en tiempo real mediante **WebSockets**.

### Base URL
```
http://localhost:8080
```

### Formato de Respuesta
Todas las respuestas de la API siguen el formato JSON estándar:

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🔐 Autenticación

### POST /auth/login
Iniciar sesión de usuario.

**Request Body:**
```json
{
  "usuario": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "id": 1,
    "usuario": "johndoe",
    "name": "John Doe",
    "rol": "estudiante",
    "token": "jwt-token-here"
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Credenciales inválidas",
  "error": "INVALID_CREDENTIALS"
}
```

### POST /auth/register
Registrar nuevo usuario.

**Request Body:**
```json
{
  "usuario": "string",
  "name": "string",
  "password": "string",
  "email": "string",
  "rol": "estudiante" // opcional, por defecto "estudiante"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": 2,
    "usuario": "newuser",
    "name": "New User",
    "rol": "estudiante"
  }
}
```

### POST /auth/logout
Cerrar sesión de usuario.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

## 👥 Gestión de Usuarios

### GET /usuarios
Obtener lista de todos los usuarios (solo administradores).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 0)
- `size` (opcional): Tamaño de página (default: 10)
- `rol` (opcional): Filtrar por rol

**Response (200):**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "usuario": "johndoe",
        "name": "John Doe",
        "email": "john@example.com",
        "rol": "estudiante",
        "fechaCreacion": "2024-01-01T12:00:00Z",
        "ultimoAcceso": "2024-01-15T10:30:00Z"
      }
    ],
    "totalElements": 50,
    "totalPages": 5,
    "currentPage": 0
  }
}
```

### GET /usuarios/{id}
Obtener información de un usuario específico.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "usuario": "johndoe",
    "name": "John Doe",
    "email": "john@example.com",
    "rol": "estudiante",
    "fechaCreacion": "2024-01-01T12:00:00Z",
    "ultimoAcceso": "2024-01-15T10:30:00Z",
    "estadisticas": {
      "modulosCompletados": 3,
      "tiempoTotalPractica": 1200,
      "precision": 85.5
    }
  }
}
```

### PUT /usuarios/{id}
Actualizar información de usuario.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "rol": "string" // solo administradores pueden cambiar rol
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "data": {
    "id": 1,
    "usuario": "johndoe",
    "name": "John Doe Updated",
    "email": "john.updated@example.com",
    "rol": "instructor"
  }
}
```

### DELETE /usuarios/{id}
Eliminar usuario (solo administradores).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente"
}
```

## 🤖 Modelos de Gestos

### POST /models/save
Guardar un nuevo modelo de gesto.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "tipo": "vocal", // vocal, letra, numero, operacion
  "valor": "A",
  "landmarks": [
    {
      "x": 0.5,
      "y": 0.3,
      "z": 0.1,
      "visibility": 0.9
    }
    // ... 21 landmarks total
  ],
  "usuarioId": 1,
  "precision": 95.5
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Modelo guardado exitosamente",
  "data": {
    "id": 123,
    "tipo": "vocal",
    "valor": "A",
    "usuarioId": 1,
    "fechaCreacion": "2024-01-15T14:30:00Z",
    "precision": 95.5
  }
}
```

### GET /models/{tipo}
Obtener modelos por tipo.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Path Parameters:**
- `tipo`: vocal, letra, numero, operacion

**Query Parameters:**
- `valor` (opcional): Filtrar por valor específico (A, B, 1, 2, etc.)
- `usuarioId` (opcional): Filtrar por usuario

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "tipo": "vocal",
      "valor": "A",
      "landmarks": [...],
      "usuarioId": 1,
      "fechaCreacion": "2024-01-15T14:30:00Z",
      "precision": 95.5
    }
  ]
}
```

### GET /models/compare
Comparar gesto capturado con modelos existentes.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "landmarks": [
    {
      "x": 0.5,
      "y": 0.3,
      "z": 0.1,
      "visibility": 0.9
    }
    // ... 21 landmarks
  ],
  "tipo": "vocal"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "mejorCoincidencia": {
      "valor": "A",
      "precision": 87.5,
      "modeloId": 123
    },
    "todasLasCoincidencias": [
      {
        "valor": "A",
        "precision": 87.5,
        "modeloId": 123
      },
      {
        "valor": "E",
        "precision": 65.2,
        "modeloId": 124
      }
    ]
  }
}
```

## 📊 Estadísticas y Progreso

### GET /estadisticas/usuario/{id}
Obtener estadísticas de un usuario.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "usuarioId": 1,
    "modulosCompletados": 3,
    "tiempoTotalPractica": 1200, // en segundos
    "precisionPromedio": 85.5,
    "gestosAprendidos": 25,
    "racha": 7, // días consecutivos
    "estadisticasPorModulo": {
      "vocales": {
        "completado": true,
        "precision": 90.0,
        "tiempoPractica": 300,
        "intentos": 45
      },
      "abecedario": {
        "completado": false,
        "precision": 78.5,
        "tiempoPractica": 600,
        "intentos": 120
      }
    }
  }
}
```

### POST /estadisticas/sesion
Registrar una sesión de práctica.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "usuarioId": 1,
  "modulo": "vocales",
  "duracion": 300, // segundos
  "gestosRealizados": 15,
  "gestosCorrectos": 12,
  "precision": 80.0,
  "fecha": "2024-01-15T14:30:00Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Sesión registrada exitosamente",
  "data": {
    "id": 456,
    "precision": 80.0,
    "nuevaRacha": 8
  }
}
```

## 🔄 WebSocket Endpoints

### Conexión WebSocket
```
ws://localhost:8080/ws
```

### Canales Disponibles

#### /topic/recognition/{usuarioId}
Recibir resultados de reconocimiento en tiempo real.

**Mensaje de Ejemplo:**
```json
{
  "tipo": "recognition_result",
  "data": {
    "gesto": "A",
    "precision": 87.5,
    "timestamp": "2024-01-15T14:30:00Z"
  }
}
```

#### /app/landmarks
Enviar landmarks de gestos para procesamiento.

**Mensaje de Envío:**
```json
{
  "usuarioId": 1,
  "landmarks": [...],
  "timestamp": "2024-01-15T14:30:00Z"
}
```

#### /topic/training/{usuarioId}
Recibir actualizaciones durante el entrenamiento.

**Mensaje de Ejemplo:**
```json
{
  "tipo": "training_progress",
  "data": {
    "paso": 3,
    "totalPasos": 5,
    "mensaje": "Mantén la posición por 3 segundos más"
  }
}
```

## ❌ Códigos de Error

### Códigos HTTP Estándar
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

### Códigos de Error Personalizados

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Descripción del error",
  "details": {
    "field": "campo específico con error",
    "value": "valor que causó el error"
  }
}
```

#### Códigos de Error Comunes
- `INVALID_CREDENTIALS` - Credenciales de login inválidas
- `USER_NOT_FOUND` - Usuario no encontrado
- `USER_ALREADY_EXISTS` - Usuario ya existe
- `INSUFFICIENT_PERMISSIONS` - Permisos insuficientes
- `INVALID_TOKEN` - Token JWT inválido o expirado
- `INVALID_LANDMARKS` - Landmarks de gesto inválidos
- `MODEL_NOT_FOUND` - Modelo de gesto no encontrado
- `TRAINING_IN_PROGRESS` - Ya hay un entrenamiento en progreso

## 🔧 Configuración del Cliente

### Configuración de Axios (Recomendada)

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Configuración de WebSocket

```typescript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const connectWebSocket = () => {
  const client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    connectHeaders: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`
    },
    debug: (str) => console.log(str),
    onConnect: () => {
      console.log('WebSocket conectado');
      
      // Suscribirse a canal de reconocimiento
      client.subscribe('/topic/recognition/1', (message) => {
        const data = JSON.parse(message.body);
        console.log('Resultado de reconocimiento:', data);
      });
    },
    onStompError: (frame) => {
      console.error('Error WebSocket:', frame);
    }
  });

  client.activate();
  return client;
};
```

## 📝 Ejemplos de Uso

### Flujo Completo de Autenticación

```typescript
// 1. Login
const loginResponse = await apiClient.post('/auth/login', {
  usuario: 'johndoe',
  password: 'password123'
});

// 2. Guardar token
localStorage.setItem('authToken', loginResponse.data.data.token);

// 3. Usar API autenticada
const userStats = await apiClient.get('/estadisticas/usuario/1');
```

### Flujo de Entrenamiento de Gestos

```typescript
// 1. Capturar landmarks con MediaPipe
const landmarks = captureHandLandmarks();

// 2. Enviar para comparación
const comparisonResult = await apiClient.post('/models/compare', {
  landmarks: landmarks,
  tipo: 'vocal'
});

// 3. Si es correcto, guardar como modelo
if (comparisonResult.data.data.mejorCoincidencia.precision > 90) {
  await apiClient.post('/models/save', {
    tipo: 'vocal',
    valor: 'A',
    landmarks: landmarks,
    usuarioId: 1,
    precision: comparisonResult.data.data.mejorCoincidencia.precision
  });
}
```

---

Esta documentación de API proporciona toda la información necesaria para integrar el frontend con el backend de SeeTalk, incluyendo autenticación, gestión de usuarios, modelos de gestos y comunicación en tiempo real.
