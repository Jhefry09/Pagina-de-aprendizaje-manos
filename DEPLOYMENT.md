# 🚀 Guía de Despliegue - SeeTalk

## 📋 Información General

Esta guía proporciona instrucciones detalladas para desplegar SeeTalk en diferentes entornos, desde desarrollo local hasta producción.

## 🏗️ Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                        │
├─────────────────────────────────────────────────────────────┤
│                     Frontend (React)                       │
│                    Nginx/Apache/CDN                        │
├─────────────────────────────────────────────────────────────┤
│                    Backend API (Spring)                    │
│                      Java Application                      │
├─────────────────────────────────────────────────────────────┤
│                      Base de Datos                         │
│                   PostgreSQL/MySQL                        │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Prerrequisitos

### Para Desarrollo Local
- **Node.js** 18+ 
- **npm** o **yarn**
- **Java** 17+ (para backend)
- **PostgreSQL** o **MySQL**
- **Git**

### Para Producción
- **Servidor Linux** (Ubuntu 20.04+ recomendado)
- **Docker** y **Docker Compose**
- **Nginx** (como proxy reverso)
- **SSL Certificate** (Let's Encrypt recomendado)
- **Dominio** configurado

## 🔧 Configuración de Entorno

### Variables de Entorno

#### Frontend (.env)
```bash
# Configuración de API
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws

# Configuración de MediaPipe
VITE_MEDIAPIPE_CDN=https://cdn.jsdelivr.net/npm/@mediapipe/hands

# Configuración de desarrollo
VITE_DEV_MODE=true
VITE_LOG_LEVEL=debug

# Configuración de producción
VITE_API_URL=https://api.seetalk.com
VITE_WS_URL=wss://api.seetalk.com/ws
VITE_DEV_MODE=false
VITE_LOG_LEVEL=error
```

#### Backend (application.properties)
```properties
# Base de datos
spring.datasource.url=jdbc:postgresql://localhost:5432/seetalk
spring.datasource.username=seetalk_user
spring.datasource.password=secure_password

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Servidor
server.port=8080
server.servlet.context-path=/api

# JWT
jwt.secret=your-super-secret-jwt-key-here
jwt.expiration=86400000

# WebSocket
websocket.allowed-origins=http://localhost:5173,https://seetalk.com

# Logging
logging.level.com.seetalk=INFO
logging.file.name=logs/seetalk.log
```

## 🐳 Despliegue con Docker

### Dockerfile para Frontend

```dockerfile
# Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Configuración de Nginx

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Configuración para SPA
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Configuración de assets
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Proxy para API
        location /api/ {
            proxy_pass http://backend:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Proxy para WebSocket
        location /ws/ {
            proxy_pass http://backend:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://localhost:8080/api
    networks:
      - seetalk-network

  backend:
    image: seetalk/backend:latest
    ports:
      - "8080:8080"
    depends_on:
      - database
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://database:5432/seetalk
      - SPRING_DATASOURCE_USERNAME=seetalk_user
      - SPRING_DATASOURCE_PASSWORD=secure_password
    volumes:
      - ./logs:/app/logs
    networks:
      - seetalk-network

  database:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=seetalk
      - POSTGRES_USER=seetalk_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - seetalk-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - seetalk-network

volumes:
  postgres_data:
  redis_data:

networks:
  seetalk-network:
    driver: bridge
```

## ☁️ Despliegue en la Nube

### AWS (Amazon Web Services)

#### Usando AWS Amplify (Frontend)

```bash
# Instalar AWS CLI
npm install -g @aws-amplify/cli

# Configurar Amplify
amplify configure

# Inicializar proyecto
amplify init

# Agregar hosting
amplify add hosting

# Desplegar
amplify publish
```

#### Usando EC2 (Backend)

```bash
# Conectar a instancia EC2
ssh -i your-key.pem ubuntu@your-ec2-instance.com

# Instalar Docker
sudo apt update
sudo apt install docker.io docker-compose

# Clonar repositorio
git clone https://github.com/your-repo/seetalk-backend.git
cd seetalk-backend

# Configurar variables de entorno
cp .env.example .env
nano .env

# Ejecutar con Docker Compose
sudo docker-compose up -d
```

### Vercel (Frontend)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Configurar proyecto
vercel

# Configurar variables de entorno en dashboard
# VITE_API_URL=https://your-backend-url.com

# Desplegar
vercel --prod
```

### Heroku (Backend)

```bash
# Instalar Heroku CLI
# Crear aplicación
heroku create seetalk-backend

# Configurar variables de entorno
heroku config:set SPRING_DATASOURCE_URL=your-database-url
heroku config:set JWT_SECRET=your-jwt-secret

# Agregar addon de base de datos
heroku addons:create heroku-postgresql:hobby-dev

# Desplegar
git push heroku main
```

## 🔒 Configuración de Seguridad

### SSL/TLS con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d seetalk.com -d www.seetalk.com

# Configurar renovación automática
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Configuración de Firewall

```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 8080/tcp  # Bloquear acceso directo al backend
```

### Headers de Seguridad

```nginx
# Agregar a nginx.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## 📊 Monitoreo y Logging

### Configuración de Logs

```yaml
# docker-compose.yml - Agregar logging
services:
  frontend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Monitoreo con Prometheus y Grafana

```yaml
# monitoring/docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  grafana_data:
```

## 🚀 Scripts de Despliegue

### Script de Despliegue Automatizado

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Iniciando despliegue de SeeTalk..."

# Variables
ENVIRONMENT=${1:-production}
BRANCH=${2:-main}

echo "📋 Configuración:"
echo "  Entorno: $ENVIRONMENT"
echo "  Rama: $BRANCH"

# Actualizar código
echo "📥 Actualizando código..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Frontend
echo "🎨 Construyendo frontend..."
npm ci
npm run build

# Backend
echo "⚙️ Construyendo backend..."
cd ../backend
./mvnw clean package -DskipTests

# Docker
echo "🐳 Construyendo imágenes Docker..."
docker-compose build

# Desplegar
echo "🚀 Desplegando servicios..."
docker-compose down
docker-compose up -d

# Verificar salud
echo "🏥 Verificando salud de servicios..."
sleep 30

# Frontend
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend: OK"
else
    echo "❌ Frontend: ERROR"
    exit 1
fi

# Backend
if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ Backend: OK"
else
    echo "❌ Backend: ERROR"
    exit 1
fi

echo "🎉 Despliegue completado exitosamente!"
```

### Script de Rollback

```bash
#!/bin/bash
# rollback.sh

set -e

echo "🔄 Iniciando rollback..."

# Obtener última versión estable
LAST_STABLE=$(git tag --sort=-version:refname | head -n 1)

echo "📋 Rollback a versión: $LAST_STABLE"

# Rollback del código
git checkout $LAST_STABLE

# Rollback de Docker
docker-compose down
docker-compose up -d

echo "✅ Rollback completado"
```

## 📈 Optimización de Performance

### Configuración de CDN

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mediapipe: ['@mediapipe/hands'],
          ui: ['framer-motion', 'lucide-react']
        }
      }
    }
  }
});
```

### Compresión y Caché

```nginx
# nginx.conf - Agregar compresión
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Caché de assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔍 Troubleshooting

### Problemas Comunes

#### Error de CORS
```javascript
// Verificar configuración en backend
@CrossOrigin(origins = {"http://localhost:5173", "https://seetalk.com"})
```

#### Error de WebSocket
```nginx
# Verificar configuración de proxy en nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

#### Error de MediaPipe
```javascript
// Verificar carga de scripts
const loadMediaPipe = async () => {
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
  } catch (error) {
    console.error('Error loading MediaPipe:', error);
  }
};
```

### Logs Útiles

```bash
# Ver logs de contenedores
docker-compose logs -f frontend
docker-compose logs -f backend

# Ver logs de nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Ver logs de aplicación
tail -f logs/seetalk.log
```

## 📋 Checklist de Despliegue

### Pre-despliegue
- [ ] Código revisado y aprobado
- [ ] Tests pasando
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] Certificados SSL válidos

### Durante el despliegue
- [ ] Backup de base de datos
- [ ] Notificar a usuarios (si es necesario)
- [ ] Ejecutar script de despliegue
- [ ] Verificar salud de servicios

### Post-despliegue
- [ ] Verificar funcionalidad crítica
- [ ] Monitorear logs por errores
- [ ] Verificar métricas de performance
- [ ] Notificar completación exitosa

---

Esta guía de despliegue proporciona todas las herramientas y configuraciones necesarias para desplegar SeeTalk de manera segura y eficiente en cualquier entorno.
