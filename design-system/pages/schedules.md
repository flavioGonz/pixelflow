# Page Override: Cronogramas / Agenda — `/admin/schedules`

> **Hereda de** `design-system/MASTER.md`. Calendar premium con drag&drop pulido.

## Intención

Programar **qué layout** se muestra **en qué pantalla** y **cuándo**. La pantalla
combina lista (eventos) + calendar visual (FullCalendar ya integrado).

## Layout

```
┌──────┬──────────────────────────────────────────────┬──────────────┐
│ side │ Header (Cronogramas · acciones)              │              │
│ bar  ├──────────────────────────────────────────────┤  Sidebar     │
│      │ Toolbar (vista mes/sem/día · today · prev/next) │  Layouts │
│      ├──────────────────────────────────────────────┤  + Filtros   │
│      │                                              │              │
│      │       FULLCALENDAR                           │  280px       │
│      │       (eventos drag&drop)                    │              │
│      │                                              │              │
│      │                                              │              │
└──────┴──────────────────────────────────────────────┴──────────────┘
```

## FullCalendar — restyling

FullCalendar trae sus propias clases (`.fc-*`). Vamos a sobrescribir solo lo necesario
en `globals.css` con CSS variables para que herede el tema:

```css
.fc {
  --fc-page-bg-color: var(--color-bg);
  --fc-border-color: var(--color-border);
  --fc-button-bg-color: var(--color-bg-card);
  --fc-button-border-color: var(--color-border-strong);
  --fc-button-text-color: var(--color-fg);
  --fc-button-hover-bg-color: var(--color-bg-card-hover);
  --fc-button-active-bg-color: var(--color-primary);
  --fc-today-bg-color: rgba(99,102,241,0.06);
  --fc-event-bg-color: var(--color-primary);
  --fc-event-border-color: var(--color-primary);
  --fc-event-text-color: var(--color-primary-fg);
  font-family: var(--font-body);
}
.fc .fc-toolbar-title { font-family: var(--font-heading); font-weight: 700; }
.fc .fc-button { border-radius: 8px; font-weight: 500; }
.fc .fc-event { border-radius: 6px; padding: 2px 6px; font-size: 12px; }
.fc-theme-standard td, .fc-theme-standard th { border-color: var(--color-border); }
```

## Eventos (cronograma item)

- **Color del evento** = color asociado al layout (cliente puede asignar). Si no, primary.
- **Hover** muestra tooltip con: layout name, pantallas afectadas, recurrencia.
- **Click** abre modal de edición.
- **Drag** mueve · **resize handles** ajustan duración.

## Sidebar derecho — Layouts

- Lista de layouts publicados con thumbnail (16:9 mini, 80×45)
- Cada layout es **draggable** sobre el calendar para crear evento nuevo
- Filtros: por cliente, por tipo de pantalla
- Buscador

## Recurrencias

UI tipo Google Calendar:
- "Una vez", "Diariamente", "Lun a Vie", "Días específicos", "Personalizado"
- Custom: cron-like simple (cada N días/semanas, en días X)

## Estados visuales

- Evento **publicado** y activo ahora: ring-2 `--color-accent` + dot pulsante
- Evento **pendiente** de inicio (futuro): opacidad normal
- Evento **pasado**: opacidad 50%
- Conflicto entre eventos: stripe pattern + icon warning + tooltip explicativo

## Acciones rápidas (header)

`Hoy` · `Vista` (mes/sem/día/lista) · `Nuevo evento` (primary)
