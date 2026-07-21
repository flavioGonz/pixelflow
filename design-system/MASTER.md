# PixelFlow — Design System (Source of Truth)

> Generado con UI UX Pro Max v2.5 (motor de razonamiento) + curaduría manual basada en
> análisis del código actual. **Esta es la fuente de verdad** para toda decisión visual.
> Las páginas pueden anular reglas específicas en `design-system/pages/<page>.md`.

---

## 1. Identidad de producto

| Campo | Valor |
| :--- | :--- |
| Producto | PixelFlow — Digital Signage Studio (SaaS, B2B) |
| Tipo | SaaS dashboard + Real-time monitoring + Content management |
| Audiencia | Operadores de pantallas en hostelería, gimnasios, retail, oficinas |
| Tono | Profesional · Técnico · Premium · Confiable · Moderno |
| Inspiración | Linear · Vercel · Raycast · Apple Bento · Stripe Dashboard |

### Anti-patrones a evitar

- Gradientes pastel "AI purple" sin propósito (ya hay demasiado en el SaaS genérico)
- Emojis como íconos (siempre Lucide/Heroicons SVG)
- Animaciones gratuitas que ralentizan la interfaz
- Densidad excesiva sin jerarquía
- Botones sin estados hover/focus claros
- Fondos puro negro `#000000` (mata contraste y se ve cheap → usar `#050505`–`#0a0a0a`)

---

## 2. Patrón de página

**Real-Time Operations + Bento Grid Dashboard**

```
┌─────┬──────────────────────────────────────────────────────────────────┐
│  S  │  Header (titulo · breadcrumb · acciones · notificaciones · user) │
│  i  ├──────────────────────────────────────────────────────────────────┤
│  d  │                                                                  │
│  e  │  Bento Grid de widgets / canvas del editor                       │
│  b  │  (cards con tamaños asimétricos: 1×1, 2×1, 2×2, 3×1)             │
│  a  │                                                                  │
│  r  │                                                                  │
│     │  Status bar / connection indicator (cuando aplique)              │
└─────┴──────────────────────────────────────────────────────────────────┘
```

- **Sidebar** colapsable: 64px (icons-only, default) ↔ 224px (icons + labels)
- **Header** sticky 72px de alto, glass backdrop-blur
- **Canvas** scroll independiente, sin overscroll
- **Status bar** opcional en pies cuando hay actividad real-time

---

## 3. Color tokens (CSS variables)

> **Estrategia:** todos los componentes consumen `var(--color-*)`. El switch de tema
> cambia las definiciones en `:root` vs `.dark`. Nunca usar hex hardcodeados en
> componentes nuevos.

### Modo Dark (default — OLED-friendly, WCAG AA)

| Token | Valor | Uso |
| :--- | :--- | :--- |
| `--color-bg`              | `#050505` | Background principal de la app |
| `--color-bg-elevated`     | `#0a0a0a` | Sidebar, headers |
| `--color-bg-card`         | `#111114` | Cards / paneles |
| `--color-bg-card-hover`   | `#16161a` | Card hover |
| `--color-bg-input`        | `#0d0d10` | Inputs, selects |
| `--color-fg`              | `#fafafa` | Texto principal |
| `--color-fg-muted`        | `#a1a1aa` | Texto secundario |
| `--color-fg-subtle`       | `#71717a` | Labels, hints |
| `--color-border`          | `rgba(255,255,255,0.06)` | Borders sutiles |
| `--color-border-strong`   | `rgba(255,255,255,0.12)` | Borders enfáticos |
| `--color-primary`         | `#6366f1` | Indigo — acción principal |
| `--color-primary-hover`   | `#4f46e5` | Indigo hover |
| `--color-primary-fg`      | `#ffffff` | Texto sobre primary |
| `--color-accent`          | `#10b981` | Emerald — éxito, live, online |
| `--color-warning`         | `#f59e0b` | Amber — pendiente, sync |
| `--color-danger`          | `#ef4444` | Rojo — error, offline |
| `--color-info`            | `#0ea5e9` | Cyan — info |
| `--color-ring`            | `#6366f1` | Focus ring |

### Modo Light (full support, WCAG AA)

| Token | Valor |
| :--- | :--- |
| `--color-bg`              | `#fafafa` |
| `--color-bg-elevated`     | `#ffffff` |
| `--color-bg-card`         | `#ffffff` |
| `--color-bg-card-hover`   | `#f4f4f5` |
| `--color-bg-input`        | `#ffffff` |
| `--color-fg`              | `#0a0a0a` |
| `--color-fg-muted`        | `#52525b` |
| `--color-fg-subtle`       | `#71717a` |
| `--color-border`          | `#e4e4e7` |
| `--color-border-strong`   | `#d4d4d8` |
| `--color-primary`         | `#4f46e5` (indigo más oscuro para AA) |
| `--color-primary-hover`   | `#4338ca` |
| `--color-primary-fg`      | `#ffffff` |
| `--color-accent`          | `#059669` |
| `--color-warning`         | `#d97706` |
| `--color-danger`          | `#dc2626` |
| `--color-info`            | `#0284c7` |
| `--color-ring`            | `#4f46e5` |

---

## 4. Tipografía — "Tech Startup" pairing

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

| Variable | Familia | Uso |
| :--- | :--- | :--- |
| `--font-heading` | `'Space Grotesk', system-ui, sans-serif` | h1–h6, page titles, KPI numbers |
| `--font-body` | `'DM Sans', system-ui, sans-serif` | Body, labels, buttons |
| `--font-mono` | `'JetBrains Mono', ui-monospace, monospace` | Códigos, IDs, datos técnicos |

### Escala (Type Ramp)

| Token | Tamaño / line-height | Peso | Uso |
| :--- | :--- | :--- | :--- |
| `text-display`  | `40 / 44`  | 700 | Login, hero titles |
| `text-h1`       | `28 / 34`  | 700 | Page titles |
| `text-h2`       | `22 / 28`  | 600 | Section titles |
| `text-h3`       | `18 / 24`  | 600 | Card titles |
| `text-body-lg`  | `16 / 24`  | 400 | Body destacado |
| `text-body`     | `14 / 22`  | 400 | Body default |
| `text-body-sm`  | `13 / 20`  | 400 | Small text |
| `text-caption`  | `12 / 16`  | 500 | Captions, hints |
| `text-overline` | `10 / 14`  | 700 | Letter-spaced 0.2em uppercase labels |

---

## 5. Espaciado y radios

Tailwind defaults son la base. Reglas:

- **Espaciado interior cards:** `p-5` (20px) o `p-6` (24px) — nunca menos de 16px
- **Espaciado entre cards:** `gap-4` (16px) o `gap-5` (20px)
- **Page padding:** `px-8 lg:px-10` y `py-6 lg:py-8`
- **Radius scale:** `rounded` (4px) inputs · `rounded-lg` (8px) buttons · `rounded-xl` (12px) cards · `rounded-2xl` (16px) modales · `rounded-3xl` (24px) hero/landing

---

## 6. Sombras y elevación

| Token | Valor (dark) | Valor (light) |
| :--- | :--- | :--- |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,.4)` | `0 1px 2px rgba(0,0,0,.06)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,.5)` | `0 4px 12px rgba(0,0,0,.08)` |
| `--shadow-lg` | `0 16px 40px rgba(0,0,0,.6)` | `0 16px 40px rgba(0,0,0,.12)` |
| `--shadow-glow` | `0 0 24px rgba(99,102,241,.35)` | `0 0 24px rgba(79,70,229,.25)` |

Glassmorphism (paneles flotantes):
```css
background: var(--color-bg-card);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid var(--color-border);
```

---

## 7. Animación e interacción

- **Curva default:** `cubic-bezier(0.16, 1, 0.3, 1)` (smoothstep) o `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard)
- **Duraciones:** 150ms (color/bg) · 200ms (hover state) · 300ms (page transitions) · 400ms (entrada de modales)
- **Pulse live indicator:** `animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite`
- **Respeta `prefers-reduced-motion`** — desactivar transforms/animations cuando esté on
- Cualquier elemento clickeable: **hover state visible + cursor-pointer + focus-visible ring**

---

## 8. Componentes base (especificaciones)

### Button

| Variant | Look |
| :--- | :--- |
| `primary` | bg `--color-primary`, text `--color-primary-fg`, hover bg `--color-primary-hover`, shadow-sm |
| `secondary` | bg transparente, border `--color-border-strong`, text `--color-fg`, hover bg `--color-bg-card-hover` |
| `ghost` | bg transparente, text `--color-fg-muted`, hover bg `--color-bg-card-hover` text `--color-fg` |
| `danger` | bg `--color-danger`/15, text `--color-danger`, hover bg `--color-danger`/25 |
| `icon` | 36×36, rounded-lg, ghost-like |

Sizes: `sm` (32px h, px-3 text-body-sm) · `md` (40px h, px-4 text-body) · `lg` (44px h, px-5 text-body-lg).

### Card

```tsx
className="rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]
           hover:border-[var(--color-border-strong)] transition-colors p-5 shadow-sm"
```

Variantes: `default` · `interactive` (hover bg + cursor) · `selected` (ring-2 ring-primary).

### Input / Select / Textarea

```
h-10  rounded-lg  bg-[var(--color-bg-input)]  border border-[var(--color-border)]
focus:border-[var(--color-primary)]  focus:ring-2 focus:ring-[var(--color-ring)]/30
placeholder:text-[var(--color-fg-subtle)]
px-3  text-body
```

### Badge / Status pill

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-overline
bg-[--color-...]/15 text-[--color-...] border border-[--color-...]/20
```

Estados: `online` (accent green pulsing dot) · `offline` (danger) · `pending` (warning) · `syncing` (info animated).

### Sidebar item

```
w-full h-11 rounded-lg flex items-center gap-3 px-3
text-body-sm font-medium text-[var(--color-fg-muted)]
hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-fg)]
data-[active=true]:bg-[var(--color-primary)]/12  data-[active=true]:text-[var(--color-primary)]
```

---

## 9. Iconografía

- **Lucide React** ya instalado (no agregar otra librería).
- Tamaños: 16 · 18 · 20 · 24. Default 18 en sidebar/buttons, 20 en page headers.
- Stroke `1.75` para mejor lectura en pantallas grandes.
- Nunca emojis como íconos.

---

## 10. Layout grid (Bento)

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
}
.bento-1x1 { grid-column: span 3; min-height: 160px; }
.bento-2x1 { grid-column: span 6; min-height: 160px; }
.bento-2x2 { grid-column: span 6; min-height: 336px; }
.bento-3x1 { grid-column: span 9; min-height: 160px; }
.bento-full { grid-column: span 12; }
@media (max-width: 1024px) { .bento-1x1, .bento-2x1, .bento-2x2, .bento-3x1 { grid-column: span 6; } }
@media (max-width: 640px)  { .bento-1x1, .bento-2x1, .bento-2x2, .bento-3x1 { grid-column: span 12; } }
```

---

## 11. Real-time monitoring (Pantallas)

- **Dot indicator pulsante** en cada terminal: verde (online <30s heartbeat), ámbar (>30s y <2min), rojo (offline >2min)
- **Connection bar** opcional al fondo si hay desconexión del socket.io
- **Toasts** críticos: top-right, máx 3 simultáneos, auto-dismiss 5s, dismissible
- **Auto-refresh** indicado con barra delgada animada en el top de la card

---

## 12. Pre-delivery checklist

Antes de mergear cualquier vista nueva:

- [ ] Cero hex hardcodeados en componentes (todo `var(--color-*)`)
- [ ] Light mode visualizado (no solo dark)
- [ ] Todos los clickeables con `cursor-pointer` y `focus-visible:ring`
- [ ] Hover states con transición 150–300ms
- [ ] Contraste ≥ 4.5:1 en texto, ≥ 3:1 en UI pequeña
- [ ] `prefers-reduced-motion` respetado
- [ ] Responsive testeado en 375 / 768 / 1024 / 1440
- [ ] Sin emojis como íconos (todos Lucide)
- [ ] Estados de loading, empty y error explícitos
- [ ] Skip-link y focus order correcto para teclado
