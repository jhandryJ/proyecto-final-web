# 🚀 UIDEportes API - Backend

API REST de alto rendimiento para la plataforma de gestión de campeonatos deportivos de la Universidad Internacional del Ecuador (UIDE).

---

## 📋 Tabla de Contenidos

- [Características](#-características-principales)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación-y-configuración)
- [Ejecución](#-ejecución)
- [Documentación API](#-documentación-api-swagger)
- [Seguridad](#-seguridad-row-level-security-rls)
- [Estructura](#-estructura-del-proyecto)
- [Scripts](#-scripts-disponibles)

---

## ✨ Características Principales

- ✅ **Row-Level Security (RLS)**: Seguridad a nivel de fila en todas las consultas
- ✅ **Autenticación JWT**: Sistema seguro con tokens y refresh tokens
- ✅ **API REST Completa**: CRUD para equipos, torneos, partidos, pagos
- ✅ **WebSockets**: Chat en tiempo real con Socket.io
- ✅ **Documentación Swagger**: OpenAPI generado automáticamente
- ✅ **Validación Robusta**: Schemas con Zod
- ✅ **ORM Moderno**: Prisma con TypeScript
- ✅ **Alto Rendimiento**: Fastify v5
- ✅ **Servidor MCP**: Integración con Claude Desktop

---

## 🚀 Tecnologías

- **Runtime**: Node.js 22+ (ES Modules)
- **Framework**: [Fastify v5](https://fastify.dev/)
- **Lenguaje**: TypeScript
- **ORM**: [Prisma v6](https://www.prisma.io/)
- **Base de Datos**: MySQL 8
- **Validación**: [Zod](https://zod.dev/)
- **Autenticación**: [@fastify/jwt](https://github.com/fastify/fastify-jwt)
- **WebSockets**: [Socket.io](https://socket.io/)
- **Email**: [Nodemailer](https://nodemailer.com/)
- **MCP**: [@modelcontextprotocol/sdk](https://modelcontextprotocol.io/)

---

## 📋 Requisitos Previos

- Node.js v22 o superior
- MySQL 8.0
- npm o yarn

---

## 🛠️ Instalación y Configuración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Base de Datos
DATABASE_URL="mysql://root:password@localhost:3306/UIDEportes_2"

# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET="tu-secreto-super-seguro-aqui-cambiar-en-produccion"

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password

# MCP (Opcional - para Claude Desktop)
MCP_USER_ID=4
MCP_USER_ROLE=ESTUDIANTE
```

### 3. Configurar Base de Datos

```bash
# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Seed de datos iniciales
npm run prisma:seed
```

### 4. Compilar TypeScript

```bash
npm run build
```

---

## ▶️ Ejecución

### Modo Desarrollo

```bash
npm run dev
```

El servidor iniciará en: `http://localhost:3000`

### Modo Producción

```bash
npm run build
npm start
```

---

## 📚 Documentación API (Swagger)

La documentación interactiva se genera automáticamente con Swagger/OpenAPI:

- **URL**: [http://localhost:3000/docs](http://localhost:3000/docs)

### Autenticación en Swagger

1. Usa `POST /api/auth/login` para obtener un `accessToken`
2. Click en **Authorize** en la parte superior
3. Pega el token (sin prefijo `Bearer`)
4. ¡Listo! Ahora puedes probar endpoints protegidos

---

## 🔒 Seguridad: Row-Level Security (RLS)

### ¿Qué es RLS?

Row-Level Security es una estrategia que filtra los datos **antes** de que lleguen al usuario, asegurando que cada usuario solo vea los datos que le pertenecen.

### Implementación: Defensa en Profundidad

El proyecto implementa **5 capas de seguridad**:

1. **Autenticación JWT**: Verifica la identidad del usuario
2. **Middleware de Autorización**: Valida roles y permisos
3. **Filtros RLS**: Aplica filtros dinámicos según el usuario
4. **Validación en Controladores**: Doble verificación de acceso
5. **Sanitización de Entrada**: Previene inyecciones SQL

### Ejemplo de RLS

```typescript
// Usuario ESTUDIANTE solo ve sus equipos
const teams = await prisma.equipo.findMany({
  where: {
    OR: [
      { capitanId: userId },
      { miembros: { some: { usuarioId: userId } } }
    ]
  }
});

// Usuario ADMIN ve todos los equipos
const teams = await prisma.equipo.findMany(); // Sin filtros
```

---

## 📂 Estructura del Proyecto

```
backend/
├── src/
│   ├── modules/                # Módulos funcionales
│   │   ├── auth/              # Autenticación y registro
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.schemas.ts
│   │   │   └── auth.middleware.ts
│   │   ├── teams/             # Gestión de equipos (con RLS)
│   │   ├── tournaments/       # Gestión de torneos
│   │   ├── matches/           # Gestión de partidos
│   │   ├── payments/          # Gestión de pagos (con RLS)
│   │   ├── users/             # Gestión de usuarios
│   │   ├── streaming/         # Transmisiones en vivo
│   │   ├── notifications/     # Notificaciones
│   │   ├── standings/         # Tablas de posiciones
│   │   └── enrollments/       # Inscripciones
│   ├── services/              # Servicios compartidos
│   │   ├── email.service.js   # Envío de emails
│   │   └── notification.service.js
│   ├── utils/                 # Utilidades
│   │   ├── rls-helpers.ts     # Helpers de RLS
│   │   └── middleware.ts      # Middleware general
│   ├── mcp/                   # Servidor MCP
│   │   └── mcp-server.ts
│   ├── app.ts                 # Configuración de Fastify
│   └── server.ts              # Punto de entrada
├── prisma/
│   ├── schema.prisma          # Modelo de datos
│   ├── migrations/            # Migraciones
│   └── seed.ts                # Datos iniciales
├── dist/                      # Código compilado
├── .env                       # Variables de entorno (no subir)
├── .env.example               # Ejemplo de variables
├── package.json
├── tsconfig.json
└── README.md                  # Este archivo
```

---

## 🔐 Roles y Permisos

### ESTUDIANTE
- ✅ Ver equipos donde es miembro o capitán
- ✅ Ver torneos públicos
- ✅ Unirse a equipos
- ❌ No puede ver equipos de otros

### CAPITAN
- ✅ Crear y gestionar su equipo
- ✅ Inscribir equipo en torneos
- ✅ Cargar comprobantes de pago
- ✅ Ver partidos de su equipo
- ❌ No puede ver otros equipos

### ADMIN
- ✅ Ver todos los equipos
- ✅ Gestionar torneos y partidos
- ✅ Validar pagos
- ✅ Gestionar transmisiones
- ✅ Acceso completo al sistema

---

## 🧑‍💻 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor en modo desarrollo (tsx watch)

# Producción
npm run build            # Compila TypeScript a JavaScript
npm start                # Inicia servidor compilado

# Base de Datos
npm run prisma:generate  # Genera cliente de Prisma
npm run prisma:migrate   # Ejecuta migraciones
npm run prisma:studio    # Abre Prisma Studio (GUI)
npm run prisma:seed      # Ejecuta seed de datos

# Utilidades
npm run lint             # Ejecuta linter
npm test                 # Ejecuta tests
```

---

## 🌐 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/promote-captain` - Promover a capitán
- `POST /api/auth/forgot-password` - Solicitar reset de contraseña
- `POST /api/auth/reset-password` - Resetear contraseña

### Equipos
- `GET /api/equipos` - Listar equipos (con RLS)
- `POST /api/equipos` - Crear equipo
- `GET /api/equipos/:id` - Obtener equipo
- `PUT /api/equipos/:id` - Actualizar equipo
- `DELETE /api/equipos/:id` - Eliminar equipo
- `POST /api/equipos/:id/join` - Unirse a equipo

### Torneos
- `GET /api/campeonatos` - Listar campeonatos
- `POST /api/campeonatos` - Crear campeonato (Admin)
- `POST /api/torneos` - Crear torneo (Admin)
- `POST /api/torneos/:id/sorteo` - Generar sorteo (Admin)
- `POST /api/torneos/:id/inscripciones` - Inscribir equipo

### Partidos
- `GET /api/torneos/:torneoId/partidos` - Listar partidos
- `PATCH /api/partidos/:id/resultado` - Actualizar resultado (Admin)
- `GET /api/next-match` - Próximo partido del usuario

### Pagos
- `GET /api/pagos` - Listar pagos (con RLS)
- `POST /api/pagos` - Crear solicitud de pago
- `GET /api/pagos/pendientes` - Pagos pendientes (Admin)
- `PATCH /api/pagos/:id/validar` - Validar/rechazar pago (Admin)

### Streaming
- `GET /api/streaming` - Listar streams activos
- `POST /api/streaming` - Crear stream
- `GET /api/streaming/chat/:sala` - Historial de chat
- `PATCH /api/streaming/:id/like` - Dar like

---

## 🤖 Servidor MCP (Model Context Protocol)

### ¿Qué es MCP?

MCP (Model Context Protocol) permite a Claude Desktop interactuar de forma segura con tu base de datos a través de herramientas predefinidas, respetando siempre las reglas de Row-Level Security.

### Herramientas Disponibles

El servidor MCP incluye 4 herramientas seguras:

1. **`query_my_teams`**: Consulta los equipos del usuario (con RLS)
2. **`query_tournaments`**: Lista torneos disponibles
3. **`query_matches`**: Consulta partidos de un torneo
4. **`query_team_stats`**: Estadísticas de equipos (con validación RLS)

---

### 📋 Configuración Completa del MCP

#### 1. Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# Configuración MCP
MCP_USER_ID=4                # ID del usuario que usará Claude
MCP_USER_ROLE=ESTUDIANTE     # Rol: ESTUDIANTE, CAPITAN, o ADMIN
DATABASE_URL="mysql://root:password@localhost:3306/UIDEportes_2"
```

**Importante**: Estas variables son **fijas** y no pueden ser modificadas por Claude, garantizando que no pueda bypassear RLS.

#### 2. Compilar el Proyecto

El servidor MCP necesita el código compilado:

```bash
npm run build
```

Esto generará el archivo `dist/mcp/mcp-server.js`

#### 3. Configurar Claude Desktop

Edita el archivo de configuración de Claude Desktop:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

Agrega la siguiente configuración:

```json
{
  "mcpServers": {
    "uideportes": {
      "command": "node",
      "args": [
        "C:\\Users\\Usuario\\Desktop\\UIDEportes-backend\\backend\\dist\\mcp\\mcp-server.js"
      ],
      "env": {
        "DATABASE_URL": "mysql://root:password@localhost:3306/UIDEportes_2",
        "MCP_USER_ID": "4",
        "MCP_USER_ROLE": "ESTUDIANTE"
      }
    }
  }
}
```

**Nota**: Ajusta la ruta absoluta según tu sistema operativo y ubicación del proyecto.

#### 4. Reiniciar Claude Desktop

Cierra completamente Claude Desktop y vuelve a abrirlo para que cargue la configuración.

#### 5. Verificar Conexión

En Claude Desktop, pregunta:
```
¿Cuáles son mis equipos?
```

Claude debería usar la herramienta `query_my_teams` y mostrar solo los equipos del usuario configurado.

---

### 🧪 Probar el MCP con Inspector

Para probar el servidor MCP sin Claude Desktop:

#### 1. Configurar Variables de Entorno (PowerShell)

```powershell
$env:DATABASE_URL="mysql://root:password@localhost:3306/UIDEportes_2"
$env:MCP_USER_ID="4"
$env:MCP_USER_ROLE="ESTUDIANTE"
```

#### 2. Iniciar MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/mcp/mcp-server.js
```

#### 3. Abrir Inspector

Abre tu navegador en: `http://localhost:5173`

#### 4. Probar Herramientas

En el inspector, ejecuta las herramientas disponibles:

- `query_my_teams` - Ver equipos del usuario
- `query_tournaments` - Ver torneos disponibles
- `query_matches` - Ver partidos (requiere torneoId)
- `query_team_stats` - Ver estadísticas (requiere equipoId)

---

### 🔒 Seguridad del MCP

El servidor MCP implementa las mismas reglas de RLS que la API:

```typescript
// Ejemplo: Usuario ESTUDIANTE solo ve sus equipos
const teams = await prisma.equipo.findMany({
  where: {
    OR: [
      { capitanId: userId },
      { miembros: { some: { usuarioId: userId } } }
    ]
  }
});
```

**Garantías de Seguridad**:
- ✅ Claude no puede modificar `MCP_USER_ID` o `MCP_USER_ROLE`
- ✅ Todas las consultas respetan RLS
- ✅ No hay acceso directo a la base de datos
- ✅ Solo herramientas predefinidas disponibles

---

### 📝 Ejemplos de Uso con Claude

#### Consultar Equipos
```
Usuario: ¿Cuáles son mis equipos?
Claude: [Usa query_my_teams]
Resultado: Lista de equipos donde el usuario es capitán o miembro
```

#### Ver Torneos
```
Usuario: ¿Qué torneos hay disponibles?
Claude: [Usa query_tournaments]
Resultado: Lista de todos los torneos activos
```

#### Estadísticas de Equipo
```
Usuario: ¿Cuáles son las estadísticas de mi equipo "Tigres FC"?
Claude: [Usa query_team_stats con equipoId]
Resultado: PJ, PG, PE, PP, GF, GC, DG, Puntos
```

---

### 🛠️ Troubleshooting MCP

#### Error: "Cannot find module"
```bash
# Solución: Recompilar el proyecto
npm run build
```

#### Error: "Database connection failed"
```bash
# Solución: Verificar DATABASE_URL en .env
# Asegurarse de que MySQL esté corriendo
```

#### Claude no ve las herramientas
```bash
# Solución:
# 1. Verificar claude_desktop_config.json
# 2. Reiniciar Claude Desktop completamente
# 3. Verificar que la ruta sea absoluta y correcta
```

#### Herramientas no respetan RLS
```bash
# Solución: Verificar MCP_USER_ID y MCP_USER_ROLE en config
# Estas variables deben coincidir con un usuario real en la BD
```

---

## 🧪 Testing

### Probar RLS

```bash
# 1. Registrar usuario
POST http://localhost:3000/api/auth/register
{
  "cedula": "1234567890",
  "nombres": "Juan",
  "apellidos": "Pérez",
  "email": "juan@uide.edu.ec",
  "password": "password123",
  "rol": "ESTUDIANTE"
}

# 2. Login
POST http://localhost:3000/api/auth/login
{
  "email": "juan@uide.edu.ec",
  "password": "password123"
}

# 3. Consultar equipos (con token)
GET http://localhost:3000/api/equipos
Authorization: Bearer <tu-token>
```

---

## 🚨 Seguridad y Mejores Prácticas

### Variables de Entorno
- ✅ **NUNCA** subas el archivo `.env` al repositorio
- ✅ Usa `.env.example` como plantilla
- ✅ Cambia `JWT_SECRET` en producción
- ✅ Usa servicios de secrets management

### Tokens JWT
- ✅ Los tokens expiran automáticamente
- ✅ Usa HTTPS en producción
- ✅ No almacenes tokens en localStorage

### Base de Datos
- ✅ Usa conexiones SSL en producción
- ✅ Limita permisos del usuario de BD
- ✅ Haz backups regulares

---

## 📞 Soporte

Para reportar problemas o sugerencias:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo

---

## 📄 Licencia

Este proyecto es parte del trabajo académico de la Universidad Internacional del Ecuador (UIDE).

---

## 👨‍💻 Autor

**Jhandry Jaramillo** - UIDE 2026

---

**¡Gracias por usar UIDEportes API! 🚀**
