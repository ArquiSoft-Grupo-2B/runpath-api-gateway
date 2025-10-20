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

## � Plugin de Autenticación Firebase

El API Gateway incluye un plugin personalizado de autenticación con Firebase que
valida tokens JWT en las rutas protegidas.

### Configuración del Plugin

#### 1. Credenciales de Firebase

Crea un archivo `firebase-credentials.json` en el directorio raíz del proyecto
con las credenciales de tu proyecto Firebase:

```json
{
  "type": "service_account",
  "project_id": "tu-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@tu-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40tu-project-id.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

#### 2. Variables de Entorno

Actualiza tu archivo `.env` para incluir la ruta a las credenciales:

```env
GOOGLE_APPLICATION_CREDENTIALS=./firebase-credentials.json
```

Para Docker, asegúrate de montar el archivo de credenciales:

```yaml
volumes:
  - ./firebase-credentials.json:/app/firebase-credentials.json
environment:
  - GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-credentials.json
```

#### 3. Rutas Protegidas

El plugin se aplica a rutas específicas definidas en `gateway.config.yml`:

- **Ruta por defecto** (`/ip`): Requiere autenticación Firebase
- **Ruta de autenticación** (`/api/auth/*`): Requiere autenticación Firebase
- **Ruta de distancias** (`/api/distance/*`): Sin autenticación
- **Ruta de rutas** (`/api/routes/*`): Sin autenticación

### Uso del Token de Autenticación

Para acceder a rutas protegidas, incluye el token JWT de Firebase en el header:

```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_JWT_TOKEN" \
     http://localhost:8888/api/auth/profile
```

### Estructura del Plugin

```
api-gateway/plugins/firebase-auth/
├── index.js       # Lógica principal del plugin
├── package.json   # Dependencias (firebase-admin)
└── schema.json    # Esquema de configuración
```

El plugin:

1. Verifica que el header `Authorization` contenga `Bearer <token>`
2. Valida el token usando Firebase Admin SDK
3. Decodifica el token y añade la información del usuario a `req.user`
4. Permite el acceso si el token es válido, o retorna 401 si es inválido

## �🔧 Ejecución

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
  - GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-credentials.json
```

**Importante:** Para el correcto funcionamiento del plugin de Firebase,
asegúrate de:

1. Crear el archivo `firebase-credentials.json` con las credenciales de tu
   proyecto
2. Montar el archivo en el contenedor Docker
3. Configurar la variable `GOOGLE_APPLICATION_CREDENTIALS` con la ruta correcta

## 📡 Uso de las APIs

Una vez ejecutado, las rutas estarán disponibles en:

- **Auth API:** `http://localhost:8888/api/auth/`
- **Distance API:** `http://localhost:8888/api/distance/`
- **Routes API:** `http://localhost:8888/api/routes/`

## 🐛 Troubleshooting

### Problemas de Conectividad

Si obtienes **Bad Gateway** al usar Docker:

- Verifica que los servicios estén corriendo en los puertos configurados
- Asegúrate de usar `host.docker.internal` en lugar de `localhost` para
  servicios externos al contenedor
- Confirma que la red `routes_shared_network` existe

### Problemas de Autenticación Firebase

**Error: "The file at {...} does not exist, or it is not a file"**

- Firebase está tratando de interpretar las credenciales JSON como una ruta de
  archivo
- Solución: Crea un archivo `firebase-credentials.json` separado y configura
  `GOOGLE_APPLICATION_CREDENTIALS` con la ruta al archivo

**Error: "Unauthorized: Missing or invalid token"**

- Verifica que estés incluyendo el header `Authorization: Bearer <token>`
- Asegúrate de que el token JWT sea válido y no haya expirado
- Confirma que el proyecto Firebase esté correctamente configurado

**Error: "Invalid or expired token"**

- El token JWT puede haber expirado
- Verifica que el token sea de Firebase Auth y no de otro servicio
- Confirma que el `project_id` en las credenciales coincida con tu proyecto
  Firebase
