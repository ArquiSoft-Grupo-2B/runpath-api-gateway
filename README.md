# RunPath API Gateway

API Gateway para la aplicación **RunPath**, un sistema de rutas optimizadas que
integra servicios de autenticación, cálculo de distancias y generación de rutas.
Este gateway actúa como punto único de entrada para todos los microservicios de
la aplicación.

## 🚀 Servicios Integrados

- **Authentication Service** (Puerto 8000) - Gestión de usuarios y autenticación
- **Distance Service** (Puerto 5002) - Cálculo de distancias usando OSRM
- **Routes Service** (Puerto 3000) - Generación y optimización de rutas

## 📁 Estructura del Proyecto

```
runpath-api-gateway/
├── docker-compose.yml          # Configuración de contenedores
├── api-gateway/
│   ├── server.js              # Punto de entrada del gateway
│   ├── package.json           # Dependencias (Express Gateway)
│   ├── Dockerfile             # Imagen del contenedor
│   └── config/
│       ├── gateway.config.yml # Configuración principal del gateway
│       ├── system.config.yml  # Configuración del sistema
│       └── models/            # Modelos de datos
```

## ⚙️ Configuración Principal

El archivo `api-gateway/config/gateway.config.yml` define:

### API Endpoints

- `/api/auth/*` → Authentication Service
- `/api/distance/*` → Distance Service
- `/api/routes/*` → Routes Service

### Service Endpoints

Los servicios se configuran usando variables de entorno:

```yaml
authService:
  url: "http://${AUTH_HOST:-localhost}:${AUTH_PORT:-8000}"
distanceService:
  url: "http://${DISTANCE_HOST:-localhost}:${DISTANCE_PORT:-5002}"
routesService:
  url: "http://${ROUTES_HOST:-localhost}:${ROUTES_PORT:-3000}"
```

### Pipelines

Cada ruta tiene su pipeline con políticas de proxy que:

- Redirigen requests a los servicios correspondientes
- Configuran CORS y change origin
- Eliminan el prefijo `/api/*` del path (stripPath)

## 🔧 Ejecución

### Ejecución Local

1. **Instalar dependencias:**

   ```bash
   cd api-gateway
   npm install
   ```

2. **Ejecutar el gateway:**

   ```bash
   npm start
   ```

3. **Acceder a las rutas:**
   - Gateway: `http://localhost:8888`
   - Admin panel: `http://localhost:9876`

### Ejecución con Docker

1. **Asegurar que existe la red compartida:**

   ```bash
   docker network create routes_shared_network
   ```

2. **Ejecutar con Docker Compose:**

   ```bash
   docker-compose up --build -d
   ```

3. **Verificar contenedor:**
   ```bash
   docker ps | grep api-gateway
   ```

### Variables de Entorno (Docker)

El docker-compose.yml configura las conexiones a servicios usando
`host.docker.internal`:

```yaml
environment:
  - AUTH_HOST=host.docker.internal
  - AUTH_PORT=8000
  - DISTANCE_HOST=host.docker.internal
  - DISTANCE_PORT=5002
  - ROUTES_HOST=host.docker.internal
  - ROUTES_PORT=3000
```

## 📡 Uso de las APIs

Una vez ejecutado, las rutas estarán disponibles en:

- **Auth API:** `http://localhost:8888/api/auth/`
- **Distance API:** `http://localhost:8888/api/distance/`
- **Routes API:** `http://localhost:8888/api/routes/`

## 🐛 Troubleshooting

Si obtienes **Bad Gateway** al usar Docker:

- Verifica que los servicios estén corriendo en los puertos configurados
- Asegúrate de usar `host.docker.internal` en lugar de `localhost` para
  servicios externos al contenedor
- Confirma que la red `routes_shared_network` existe
