# Reglas del Proyecto AI - PixelFlow

## Resumen del Proyecto
PixelFlow es una plataforma de Digital Signage interactiva de alto rendimiento. El sistema permite diseñar layouts dinámicos en un Admin y empujarlos a pantallas remotas (Players) en tiempo real.

## Estándares de Diseño (Estética "Altos del Arapey")
*   **Esquinas:** Usar consistentemente `rounded-xl` o `rounded-2xl`. Evitar redondeos extremos o bordes rectos.
*   **Transparencias:** El Player DEBE ser transparente en su base para permitir que los PNGs respiren. Nunca forzar fondos negros en componentes raíz.
*   **Velocidad de Animación:** Las transiciones de `AnimatePresence` deben ser rápidas (entre 0.3s y 0.5s). Los staggers (retrasos escalonados) deben ser de ~0.05s.
*   **Feedback Táctil:** Todo botón debe responder al `whileTap` con escalas de 0.94 a 0.97 y cambios sutiles de color/brillo.

## Guías de Arquitectura

### 1. Widgets y Renderizado Dinámico
*   Los widgets se encuentran en `src/components/widgets`.
*   Un "Widget" debe ser puro en su renderizado, recibiendo toda su configuración desde `data`.
*   Para widgets que consulten APIs externas (como Clima), manejar estados de carga (**Loader2**) y errores.

### 2. Capas de Fondo (Background Layers)
El Player sigue un orden estricto de capas (z-index):
1.  **Z-0:** Media Layer (Video/Imagen/YouTube).
2.  **Z-1:** Color Overlay Layer (Tinte de color ajustable).
3.  **Z-2:** Pattern Mask Layer (Dots, Noise, etc.).
4.  **Z-5:** Blur Layer (Backdrop blur global).
5.  **Z-10:** Widget Layer (Contenido interactivo).

### 3. Comunicación Socket.io
*   **Admin -> Server:** `save_layout` (persiste en DB), `update_content` (volátil, solo preview).
*   **Server -> Player:** `update_layout` (emite el objeto Layout completo).
*   **Player -> Server:** `register_screen` (conecta la pantalla a su habitación de sockets específica).

### 4. Gestión de Estado (Zustand)
*   Usar `usePlayerStore` para manejar el layout actual, el historial de navegación (para el botón "Volver") y el estado de conexión.

## APIs de Terceros Implementadas
*   **Open-Meteo:** Consultada por `WeatherWidget` para clima en tiempo real sin necesidad de API Key.
*   **Nominatim (OSM):** Usada para convertir nombres de ciudades en coordenadas lat/lon.
*   **YouTube Embed:** Renderizado de videos de fondo mediante IFrames optimizados para cubrir el 100% del viewport.

## Checklist de Calidad para el Agente
- [ ] ¿El componente funciona en retrato y paisaje?
- [ ] ¿Tiene animaciones de entrada/salida rápidas?
- [ ] ¿Soporta transparencia PNG?
- [ ] ¿Ofrece configuración desde el panel Admin?