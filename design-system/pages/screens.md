# Page Override: Pantallas (Monitoreo) — `/admin/screens`

> **Hereda de** `design-system/MASTER.md`. Estilo: **Real-Time Monitoring**.

## Intención

Vista de control: el operador necesita saber al instante qué pantallas están
online, cuáles fallan y cuántas hay desplegadas. El énfasis es **estado** primero,
acciones después.

## Layout

Bento Grid de 3 niveles:

1. **KPI Strip (top)** — 4 cards `1×1` mostrando:
   - Total de pantallas
   - Online (con dot pulsante verde)
   - Pendientes de autorización (warning)
   - Offline (danger)
2. **Grid de pantallas** — cards de tamaño `2×1` o `1×1` alternando, ordenadas por estado:
   primero offline (atención), luego pending, luego online (alfabético)
3. **Filtro/búsqueda flotante** en el header con: estado, cliente, búsqueda libre

## Card de pantalla (terminal)

```
┌──────────────────────────────────────┐
│ ● [estado-dot]  TERMINAL-NAME        │  ← header card
│   client.id · last seen 12s ago      │
├──────────────────────────────────────┤
│  [thumbnail / preview live 16:9]     │  ← preview
│                                      │
├──────────────────────────────────────┤
│ Layout: "Lobby - Day"     v 2.4      │  ← meta
│ Resolution: 1920×1080                │
├──────────────────────────────────────┤
│ [Ver]  [Reiniciar]  [···]            │  ← acciones
└──────────────────────────────────────┘
```

- **Estado-dot**: 8px circle con `box-shadow: 0 0 8px currentColor`, animación pulse cuando online.
- **Thumbnail**: si la pantalla expone screenshot vía socket, mostrar; sino placeholder con icono Monitor + estado.
- **Last seen**: relativo si <60s, absoluto formato `dd/MM HH:mm` si más viejo. Color `accent` si <30s, `warning` 30–120s, `danger` >120s.

## Conexión real-time

- **Socket.io** mantiene canal abierto para heartbeat.
- Banner al fondo de página si el socket se desconecta:
  `bg-[--color-warning]/15 border-t border-[--color-warning]/40 text-[--color-warning]`
  con mensaje "Reconectando…" y spinner pequeño.
- Auto-reconnect con backoff exponencial.

## Pending devices

- Sección colapsable arriba del grid si hay terminales pidiendo autorización.
- CTA destacado: `Autorizar` (primary) o `Rechazar` (danger ghost).
- Mostrar fingerprint, IP, user-agent, timestamp.

## Toasts críticos

- Cuando un terminal pasa a offline: toast `danger`, sound opcional, dismissible.
- Cuando se autoriza un nuevo terminal: toast `accent` "Terminal X conectado".

## Keyboard shortcuts

- `r` → refresh manual
- `f` → focus en búsqueda
- `Esc` → cerrar modales
