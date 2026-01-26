# PixelFlow - Digital Signage High-Performance Platform

PixelFlow es una solución de señalización digital interactiva y en tiempo real de alto rendimiento. Permite el diseño remoto de lienzos (layouts) y su publicación instantánea en pantallas táctiles (Kioscos, TVs), con soporte nativo para orientaciones Landscape (16:9) y Portrait (9:16).

## 🚀 Stack Tecnológico

*   **Core:** Next.js 14 (App Router), Node.js Express (Custom Server).
*   **Real-time:** Socket.io (Comunicación bidireccional instantánea).
*   **Motor Gráfico:** Framer Motion (Animaciones de 60fps), Swiper.js (Carruseles).
*   **Estilos:** Tailwind CSS (Diseño Premium & Glassmorphism).
*   **APIs Externas:** Open-Meteo & Nominatim (Clima en vivo), YouTube Embed API.
*   **Persistencia:** MongoDB (Mongoose) para Layouts y Gestión de Pantallas.

## 🛠️ Instalación y Configuración

1.  **Instalar Dependencias:**
    ```bash
    npm install
    ```

2.  **Variables de Entorno (.env):**
    Configura tu `MONGODB_URI` y `PORT` (3000 por defecto).

3.  **Ejecutar en Desarrollo:**
    *Importante: Usamos un servidor personalizado para manejar WebSockets. No uses `next dev` directamente.*
    ```bash
    node server.js
    ```
    Accede a:
    *   **Admin:** `http://localhost:3000/admin`
    *   **Player:** `http://localhost:3000/player/[ID_PANTALLA]`

## 🔌 Documentación de APIs y Sockets

### Endpoints Express
*   **POST `/api/upload`**: Recibe archivos (imágenes/videos) mediante `multer`. Devuelve la URL local del recurso.

### Eventos de Socket (Comunicación en Tiempo Real)
*   **`register_screen`**: El Player se registra con su ID único.
*   **`save_layout`**: El Admin guarda un diseño en la base de datos y lo vincula a una pantalla.
*   **`update_content`**: Empuja cambios en vivo del Admin al Player (modo preview).
*   **`request_layout`**: Navegación interactiva. Solicita un diseño específico para una pantalla.
*   **`authorize_screen`**: Permite o revoca el acceso de una pantalla desde el Admin.
*   **`update_layout` (Server -> Player)**: Envía el JSON completo del diseño para ser renderizado.

## 📱 Características Destacadas (Updates de Hoy)

*   **Motor de Transparencia PNG:** Soporte total para canales alfa. Los logos y elementos PNG flotan sin fondos negros.
*   **Capas de Diseño (Masks):** Sistema de overlays de color y patrones animados (Dots, Grid, Waves, Noise) sobre fondos de video/imagen.
*   **Clima Inteligente:** Widget con auto-geolocalización y clima en vivo con iconos coloridos y animados.
*   **Botones con Templates:** 5 estilos táctiles (Glass, Neon, 3D, Minimal, Gradient) con feedback de presión inmediato.
*   **Optimización de Velocidad:** Transiciones cinemáticas ultra-rápidas (0.4s) y animaciones de entrada "snappy" (0.05s stagger).
*   **Agenda por Sección:** Filtrado inteligente de actividades dinámicas según la ubicación de la pantalla.

## 📂 Estructura del Proyecto

*   **`server.js`**: Punto de entrada del servidor. Gestiona Next.js + Socket.io + Multer.
*   **`src/app/admin`**: Panel de control y editor Drag & Drop.
*   **`src/app/player/[id]`**: Motor de renderizado del Player interactivo.
*   **`src/components/widgets`**: Catálogo de componentes visuales (Clima, Carta, Agenda, Sliders).
*   **`src/store`**: Estado global del reproductor con Zustand.