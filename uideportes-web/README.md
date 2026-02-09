# UIDEportes - Web Client

Este es el cliente web (Frontend) para la plataforma de gestión deportiva **UIDEportes**, desarrollado con tecnologías modernas para garantizar rendimiento y una excelente experiencia de usuario.

## 🚀 Tecnologías

*   **React 19:** Biblioteca principal de UI.
*   **Vite:** Build tool y servidor de desarrollo ultrarrápido.
*   **Material UI (MUI):** Sistema de diseño para componentes visuales robustos y accesibles.
*   **TypeScript:** Tipado estático para un desarrollo más seguro.
*   **React Router v7:** Gestión de rutas y navegación.
*   **Axios:** Cliente HTTP para comunicación con el Backend.
*   **Recharts:** Visualización de datos (tablas de posiciones, estadísticas).
*   **React Hook Form:** Manejo eficiente de formularios.
*   **Lucide React:** Iconografía moderna.

## 📋 Prerrequisitos

*   **Node.js** (Versión LTS recomendada, v18+)
*   **npm** (Gestor de paquetes)

## 🛠️ Instalación y Configuración

1.  **Navegar al directorio:**
    ```bash
    cd uideportes-web
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

## 🏃‍♂️ Ejecución en Desarrollo

Para iniciar el servidor de desarrollo local:

```bash
npm run dev
```

La aplicación estará disponible generalmente en `http://localhost:5173`.

## 📦 Scripts Disponibles

*   `npm run dev`: Inicia el servidor de desarrollo.
*   `npm run build`: Compila la aplicación para producción.
*   `npm run lint`: Ejecuta el linter para verificar la calidad del código.
*   `npm run preview`: Vista previa local de la build de producción.

## 📂 Estructura del Proyecto

*   `src/components`: Componentes reutilizables (Botones, Modales, Tarjetas).
*   `src/pages`: Vistas principales (Dashboard, Login, Perfil).
*   `src/context`: Manejo del estado global (AuthContext).
*   `src/services`: Funciones para peticiones API (Axios).
*   `src/theme`: Configuración de temas y estilos de Material UI.

## 🔗 Integración

Este frontend se conecta con la API de UIDEportes (Backend) corriendo típicamente en `http://localhost:3000`. Asegúrate de que el backend esté en ejecución para la funcionalidad completa (login, carga de datos).
