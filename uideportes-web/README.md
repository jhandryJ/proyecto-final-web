# 🎨 UIDEportes Web - Frontend

Cliente web moderno para la plataforma de gestión deportiva **UIDEportes**, desarrollado con React 19 y Material-UI con el tema institucional de la UIDE.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación-y-configuración)
- [Ejecución](#-ejecución)
- [Estructura](#-estructura-del-proyecto)
- [Componentes](#-componentes-principales)
- [Tema UIDE](#-tema-uide)

---

## ✨ Características

- ✅ **Interfaz Moderna**: Diseño responsive con Material-UI
- ✅ **Tema UIDE**: Colores institucionales (Azul y Dorado)
- ✅ **Glassmorphism**: Efectos de vidrio esmerilado
- ✅ **Dashboards Dinámicos**: Admin y Usuario
- ✅ **Gestión de Torneos**: Visualización de brackets y grupos
- ✅ **Transmisiones en Vivo**: Chat en tiempo real
- ✅ **Tablas de Posiciones**: Actualizadas en tiempo real
- ✅ **Gestión de Equipos**: Creación e invitaciones
- ✅ **Sistema de Pagos**: Carga y validación de comprobantes
- ✅ **Autenticación Segura**: JWT con refresh tokens
- ✅ **Rutas Protegidas**: Basadas en roles

---

## 🚀 Tecnologías

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Lenguaje**: TypeScript
- **UI Library**: [Material-UI (MUI)](https://mui.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Formularios**: [React Hook Form](https://react-hook-form.com/)
- **Iconos**: [Lucide React](https://lucide.dev/)
- **WebSockets**: [Socket.io Client](https://socket.io/)
- **Validación**: [Zod](https://zod.dev/)

---

## 📋 Prerrequisitos

- **Node.js** v18 o superior
- **npm** o **yarn**
- Backend de UIDEportes corriendo en `http://localhost:3000`

---

## 🛠️ Instalación y Configuración

### 1. Navegar al Directorio

```bash
cd uideportes-web
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno (Opcional)

Crea un archivo `.env` si necesitas configurar la URL del backend:

```env
VITE_API_URL=http://localhost:3000
```

---

## ▶️ Ejecución

### Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

### Build de Producción

```bash
npm run build
```

### Preview de Producción

```bash
npm run preview
```

---

## 📂 Estructura del Proyecto

```
uideportes-web/
├── src/
│   ├── components/            # Componentes reutilizables
│   │   ├── admin/            # Componentes de admin
│   │   │   ├── CreateTournamentModal.tsx
│   │   │   ├── PaymentValidation.tsx
│   │   │   ├── StreamingSection.tsx
│   │   │   └── UpdateMatchModal.tsx
│   │   ├── auth/             # Componentes de autenticación
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── common/           # Componentes comunes
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   └── tournaments/      # Componentes de torneos
│   │       ├── BracketView.tsx
│   │       ├── GroupsView.tsx
│   │       ├── StandingsTable.tsx
│   │       └── MatchCard.tsx
│   ├── pages/                # Páginas principales
│   │   ├── Dashboard.tsx     # Dashboard admin
│   │   ├── UserDashboard.tsx # Dashboard usuario
│   │   ├── Login.tsx         # Página de login
│   │   ├── Register.tsx      # Página de registro
│   │   ├── TournamentBracketPage.tsx
│   │   └── Profile.tsx       # Perfil de usuario
│   ├── context/              # Estado global
│   │   └── AuthContext.tsx   # Contexto de autenticación
│   ├── services/             # Servicios API
│   │   ├── api.ts            # Cliente Axios configurado
│   │   ├── auth.service.ts   # Servicios de auth
│   │   ├── teams.service.ts  # Servicios de equipos
│   │   ├── tournaments.service.ts
│   │   ├── payments.service.ts
│   │   └── faculties.service.ts
│   ├── theme/                # Tema UIDE
│   │   └── theme.ts          # Configuración de MUI
│   ├── types/                # Tipos TypeScript
│   │   └── index.ts
│   ├── App.tsx               # Componente principal
│   ├── main.tsx              # Punto de entrada
│   └── index.css             # Estilos globales
├── public/                   # Recursos estáticos
│   ├── logo-uide.png
│   └── favicon.ico
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md                 # Este archivo
```

---

## 🧩 Componentes Principales

### Páginas

#### Dashboard (Admin)
```typescript
// Dashboard.tsx
- Gestión de campeonatos y torneos
- Validación de pagos
- Programación de partidos
- Gestión de transmisiones
- Estadísticas generales
```

#### UserDashboard
```typescript
// UserDashboard.tsx
- Mis equipos
- Próximos partidos
- Torneos disponibles
- Transmisiones en vivo
- Mis pagos
```

### Componentes de Admin

#### CreateTournamentModal
- Crear campeonatos
- Crear torneos
- Configurar disciplina, categoría, género
- Seleccionar formato (Grupos/Eliminatorias)

#### PaymentValidation
- Listar pagos pendientes
- Validar/rechazar comprobantes
- Ver historial de pagos
- Total de pagos aprobados

#### StreamingSection
- Crear transmisiones
- Gestionar streams activos
- Chat en tiempo real
- Sistema de likes

#### UpdateMatchModal
- Actualizar resultados
- Programar fecha y hora
- Asignar cancha
- Cambiar estado del partido

### Componentes de Torneos

#### BracketView
- Visualización de llaves eliminatorias
- Árbol de partidos
- Ganadores destacados
- Animaciones de transición

#### GroupsView
- Visualización de grupos
- Partidos por grupo
- Clasificación de equipos

#### StandingsTable
- Tabla de posiciones
- Puntos, PJ, PG, PE, PP
- Diferencia de goles
- Ordenamiento automático

---

## 🎨 Tema UIDE

### Colores Institucionales

```typescript
// theme.ts
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',      // UIDE Blue
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#ffd700',      // UIDE Gold
      light: '#ffeb3b',
      dark: '#fbc02d',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});
```

### Glassmorphism

```css
/* Efectos de vidrio esmerilado */
.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}
```

---

## 🔐 Autenticación

### AuthContext

```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### Rutas Protegidas

```typescript
// App.tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

---

## 📡 Servicios API

### Configuración de Axios

```typescript
// api.ts
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Servicios Disponibles

```typescript
// auth.service.ts
export const authService = {
  login,
  register,
  logout,
  forgotPassword,
  resetPassword,
};

// teams.service.ts
export const teamsService = {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  joinTeam,
};

// tournaments.service.ts
export const tournamentsService = {
  getTournaments,
  createTournament,
  generateDraw,
  enrollTeam,
};
```

---

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo

# Producción
npm run build            # Compila para producción
npm run preview          # Preview de build

# Calidad de Código
npm run lint             # Ejecuta ESLint
npm run type-check       # Verifica tipos TypeScript

# Testing
npm test                 # Ejecuta tests
```

---

## 🌐 Integración con Backend

El frontend se conecta con la API de UIDEportes:

- **Backend URL**: `http://localhost:3000`
- **API Base**: `http://localhost:3000/api`
- **WebSocket**: `http://localhost:3000` (Socket.io)

### Configuración

Asegúrate de que el backend esté corriendo antes de iniciar el frontend:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd uideportes-web
npm run dev
```

---

## 🎯 Funcionalidades por Rol

### ADMIN
- ✅ Dashboard completo
- ✅ Gestión de torneos
- ✅ Validación de pagos
- ✅ Programación de partidos
- ✅ Gestión de transmisiones

### CAPITAN
- ✅ Crear equipos
- ✅ Gestionar miembros
- ✅ Inscribir en torneos
- ✅ Cargar comprobantes

### ESTUDIANTE
- ✅ Ver torneos
- ✅ Unirse a equipos
- ✅ Ver partidos
- ✅ Ver transmisiones

---

## 🚀 Optimizaciones

### Code Splitting

```typescript
// Lazy loading de componentes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
```

### Memoización

```typescript
// Optimización de renders
const MemoizedComponent = React.memo(Component);
```

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

**¡Gracias por usar UIDEportes Web! 🎨**
