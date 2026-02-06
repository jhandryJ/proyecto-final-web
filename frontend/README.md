# UIDEportes Web - Frontend

Plataforma de gestión deportiva para la Universidad Internacional del Ecuador (UIDE). Este proyecto es el frontend de la aplicación web, desarrollado con tecnologías modernas para ofrecer una experiencia de usuario rápida y fluida.

## 🚀 Tecnologías

El proyecto está construido sobre el siguiente stack tecnológico:

-   **React 19**: Biblioteca UI para construir interfaces interactivas.
-   **Vite**: Build tool de próxima generación, rápido y ligero.
-   **TypeScript**: Superset de JavaScript con tipado estático para mayor robustez.
-   **Material UI (MUI v6)**: Biblioteca de componentes de diseño robusta y accesible.
-   **React Router v7**: Manejo de rutas y navegación.
-   **React Hook Form**: Gestión eficiente de formularios.
-   **Lucide React**: Iconografía moderna y consistente.

## 📋 Características Implementadas

Hasta el momento, la aplicación cuenta con las siguientes funcionalidades:

### 🔐 Autenticación
-   Formulario de **Login** con diseño visual impactante.
-   Formulario de **Registro**.

### 📊 Dashboard Administrativo
-   **Gestión de Torneos**: Crear, editar y eliminar torneos (formatos de grupos y eliminación directa).
-   **Gestión de Equipos**: Registro y administración de equipos por deporte.
-   **Generación de Fixtures**: Algoritmos para sorteo automático de partidos (Grupos y Llaves).
-   **Resultados**: Ingreso y edición de resultados de partidos.
-   **Tabla de Posiciones**: Cálculo automático de puntos, goles diferencia, etc.
-   **Streaming**: Sección para gestionar enlaces de transmisiones en vivo.

## 🛠️ Instalación y Ejecución

Sigue estos pasos para levantar el proyecto en tu entorno local:

1.  **Clonar el repositorio** (si aplica) o navegar a la carpeta del proyecto.
2.  **Instalar dependencias**:
    ```bash
    npm install
    ```
3.  **Ejecutar servidor de desarrollo**:
    ```bash
    npm run dev
    ```
4.  Abrir en el navegador: `http://localhost:5173` (o el puerto que indique la consola).

## 📂 Estructura del Proyecto

```
src/
├── assets/         # Imágenes y recursos estáticos
├── components/     # Componentes reutilizables (Modales, Cards, Tables)
├── pages/          # Vistas principales (Dashboard, Login, Splash)
├── routes/         # Configuración de rutas (AppRouter)
├── theme/          # Configuración de tema personalizado (MUI)
└── types/          # Definiciones de tipos TypeScript globales
```

## 📝 Estado Actual
Actualmente, la aplicación funciona con **datos simulados (mock data)** en memoria. La persistencia de datos y la conexión con el Backend están planificadas para la siguiente fase de desarrollo.
