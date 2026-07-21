# Page Override: Studio (Editor maestro) — `/admin`

> **Hereda de** `design-system/MASTER.md`. Esta hoja sólo lista lo específico de la pantalla.

## Intención

Editor visual del grid del cliente. La densidad de info es alta: lista de widgets +
canvas + propiedades. El usuario está concentrado en diseño, así que la cromática
debe **soportar el contenido sin pelearle**.

## Layout

```
┌───────┬─────────────────────────────────────────────────┬───────────┐
│ side  │  Header (Studio · Layout actual · Acciones)     │           │
│ bar   ├─────────────────────────────────────────────────┤  Panel    │
│       │                                                 │  derecho  │
│ 64px  │           CANVAS (16:9 fit-content)             │           │
│       │                                                 │  Widgets  │
│       │           Bento + drag-n-drop                   │  /        │
│       │                                                 │  Props    │
│       │                                                 │           │
│       │  Status bar (saved · cliente · zoom)            │  320px    │
└───────┴─────────────────────────────────────────────────┴───────────┘
```

- **Panel derecho** plegable a 56px (rail icons) ↔ 320px (full).
- **Canvas zoom** controlado: `25 / 50 / 75 / 100 / fit` con shortcut `cmd/ctrl+0/1/2/3/F`.
- **Toolbar flotante** en la parte superior del canvas con: undo/redo, align, distribute, lock, delete.

## Componentes específicos

### Widget tile (drag source)
- Card 80×80 con icono 24, label `text-caption`, `cursor-grab`
- Hover: bg `--color-primary`/8 + border `--color-primary`/40
- Active drag: scale 0.95 + shadow-lg

### Drop zone activo
- Border dashed 2px `--color-primary` + bg `--color-primary`/5
- Highlight pulsante 2s mientras se arrastra

### Properties panel
- Secciones colapsables tipo accordion
- Inputs numéricos con `<` `>` para ajuste fino
- Color pickers con paleta del cliente activo

## Estados especiales

- **Sin layout cargado** → empty state con CTA "Crear nuevo layout" + plantillas predefinidas
- **Cambios sin guardar** → indicador en header (dot warning) + autosave cada 30s
- **Layout publicado** → badge `accent` en header con timestamp

## Acciones rápidas (header)

`Vista previa` (secondary) · `Publicar` (primary) · `···` (more) con: Duplicar, Exportar, Eliminar
