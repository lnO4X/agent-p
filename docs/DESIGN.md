# GameTan Design System

> Extracted from the live codebase. All values are real — no placeholders.

## Brand Identity

- **Mission**: "16personalities for gamers" — a gamer identity system, not a game platform.
- **Visual direction**: Esports aesthetic with purple-tinted depth, neon accents, and premium gaming feel (inspired by Razer/Discord dark themes).
- **Tagline**: "Discover Your Gaming DNA"

---

## Color Palette

Color space: **OkLCH** (all tokens defined in `src/app/globals.css`).

### Light Mode (`:root`)

| Token | Value | Description |
|-------|-------|-------------|
| `--background` | `oklch(0.968 0.002 285)` | Near-white with faint purple tint |
| `--foreground` | `oklch(0.145 0 0)` | Near-black |
| `--card` | `oklch(1 0 0)` | Pure white |
| `--card-foreground` | `oklch(0.145 0 0)` | Near-black |
| `--primary` | `oklch(0.55 0.25 285)` | Deep purple (hue 285) |
| `--primary-foreground` | `oklch(1 0 0)` | White |
| `--secondary` | `oklch(0.955 0.005 285)` | Very light purple-gray |
| `--secondary-foreground` | `oklch(0.205 0 0)` | Dark gray |
| `--muted` | `oklch(0.955 0.005 285)` | Same as secondary |
| `--muted-foreground` | `oklch(0.45 0 0)` | Mid-gray |
| `--accent` | `oklch(0.75 0.2 145)` | Neon green (hue 145) |
| `--accent-foreground` | `oklch(0.18 0.02 285)` | Dark purple |
| `--destructive` | `oklch(0.58 0.22 27)` | Red-orange |
| `--border` | `oklch(0.885 0.005 285)` | Light purple-gray border |
| `--input` | `oklch(0.922 0 0)` | Light gray |
| `--ring` | `oklch(0.55 0.25 285)` | Same as primary |
| `--radius` | `1rem` (16px) | Base border radius |

### Dark Mode (`.dark`)

| Token | Value | Description |
|-------|-------|-------------|
| `--background` | `oklch(0.13 0.02 285)` | Deep purple-black |
| `--foreground` | `oklch(0.985 0 0)` | Near-white |
| `--card` | `oklch(0.16 0.025 285)` | Slightly lighter purple-black |
| `--primary` | `oklch(0.65 0.28 285)` | Brighter purple |
| `--secondary` | `oklch(0.2 0.025 285)` | Dark purple |
| `--muted` | `oklch(0.22 0.03 285)` | Slightly lighter dark purple |
| `--muted-foreground` | `oklch(0.6 0.04 285)` | Purple-gray text |
| `--accent` | `oklch(0.75 0.2 145)` | Neon green (same as light) |
| `--accent-foreground` | `oklch(0.13 0.02 285)` | Dark background on accent |
| `--border` | `oklch(0.25 0.03 285)` | Subtle purple border |
| `--input` | `oklch(0.22 0.03 285)` | Dark input background |

### Chart Colors

| Token | Value | Used For |
|-------|-------|---------|
| `--chart-1` | `oklch(0.75 0.2 145)` | Neon green (accent) |
| `--chart-2` | `oklch(0.65 0.28 285)` | Bright purple |
| `--chart-3` | `oklch(0.55 0.25 285)` | Deep purple |
| `--chart-4` | `oklch(0.45 0.22 285)` | Dark purple |
| `--chart-5` | `oklch(0.7 0.15 300)` | Pink-purple |

### Archetype Gradient Pairs

Every archetype has a `gradient: [from, to]` used for identity coloring throughout the app.

| Archetype | From | To |
|-----------|------|----|
| Lightning Assassin | `#3b82f6` (blue) | `#06b6d4` (cyan) |
| Berserker | `#ef4444` (red) | `#f97316` (orange) |
| Sharpshooter | `#8b5cf6` (violet) | `#6366f1` (indigo) |
| Duelist | `#ec4899` (pink) | `#be185d` (dark pink) |
| Oracle | `#06b6d4` (cyan) | `#0891b2` (dark cyan) |
| Fortress | `#78716c` (warm gray) | `#57534e` (darker gray) |
| Shadow Strategist | `#1e1b4b` (midnight) | `#4c1d95` (deep violet) |
| Gambler | `#d97706` (amber) | `#b45309` (dark amber) |
| Rhythm Walker | `#ec4899` (pink) | `#db2777` (hot pink) |
| Commander | `#eab308` (yellow) | `#ca8a04` (dark yellow) |
| Weaver | `#a855f7` (purple) | `#7c3aed` (dark purple) |
| Sentinel | `#64748b` (slate) | `#475569` (dark slate) |
| Shapeshifter | `#6366f1` (indigo) | `#8b5cf6` (violet) |
| Lone Wolf | `#374151` (gray) | `#1f2937` (dark gray) |
| Collector | `#14b8a6` (teal) | `#0d9488` (dark teal) |
| Chaos Child | `#f59e0b` (amber) | `#ea580c` (orange-red) |

### Theme Color (viewport meta)

```
Light: #f7f7f7
Dark:  #1a1a2e
```

---

## Typography

### Font Stack

Defined in `src/app/layout.tsx`. Three Google Fonts loaded via `next/font/google`:

| Variable | Font | Weights | Usage |
|----------|------|---------|-------|
| `--font-geist-sans` | Geist | All (variable) | Primary body text |
| `--font-geist-mono` | Geist Mono | All (variable) | Code, monospace |
| `--font-outfit` | Outfit | 600, 700, 800 | Display headings, brand name |

**Body `fontFamily` cascade** (set via inline style on `<body>`):
```
var(--font-geist-sans), "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, -apple-system, sans-serif
```

Chinese fallback stack: PingFang SC (macOS/iOS) > Hiragino Sans GB (legacy mac) > Microsoft YaHei (Windows).

### Size Usage (from Tailwind utility classes observed)

| Context | Class | Size |
|---------|-------|------|
| Brand name (landing) | `text-4xl md:text-6xl font-extrabold` | 36px / 60px |
| Page headings | `text-2xl md:text-3xl font-bold` | 24px / 30px |
| Section headings | `text-lg font-semibold` | 18px |
| Card title | `text-base font-medium` | 16px |
| Body text | `text-sm` | 14px |
| Small labels | `text-xs` | 12px |
| Bottom tab labels | `text-[11px] font-medium` | 11px |
| Badge, notification count | `text-[10px] font-bold` | 10px |

Display headings use `font-[family-name:var(--font-outfit)]` explicitly.

---

## Component Patterns

### Card (shadcn, `src/components/ui/card.tsx`)

- Base style: `rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10`
- Sizes: `default` (gap-4, py-4) and `sm` (gap-3, py-3)
- Padding: `px-4` (content), `px-3` (sm variant)
- Footer: `border-t bg-muted/50`, rounded bottom

### Button (shadcn, `src/components/ui/button.tsx`)

Built with `class-variance-authority`. Wraps `@base-ui/react/button`.

**Variants:**

| Variant | Style |
|---------|-------|
| `default` | `bg-primary text-primary-foreground` |
| `outline` | `border-border bg-background hover:bg-muted` |
| `secondary` | `bg-secondary text-secondary-foreground` |
| `ghost` | `hover:bg-muted hover:text-foreground` |
| `destructive` | `bg-destructive/10 text-destructive` |
| `link` | `text-primary underline-offset-4 hover:underline` |

**Sizes:**

| Size | Height |
|------|--------|
| `xs` | `h-6` (24px) |
| `sm` | `h-7` (28px) |
| `default` | `h-8` (32px) |
| `lg` | `h-9` (36px) |
| `icon` | `size-8` (32px square) |

All buttons: `rounded-lg`, `text-sm font-medium`, `transition-all`.

### Badge (shadcn, `src/components/ui/badge.tsx`)

- Height: `h-5` (20px), `rounded-4xl` (pill shape)
- Variants: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`

### Pressable Interaction (`globals.css`)

```css
.pressable {
  transition: transform 200ms ease-out, opacity 200ms ease-out;
  -webkit-tap-highlight-color: transparent;
}
.pressable:active {
  transform: scale(0.97);
  opacity: 0.88;
}
```

Reduced-motion: disables transform, uses `opacity: 0.7` only.

Used on: nav items, archetype icons, action cards, send buttons, share buttons.

### Skeleton Loading (`src/components/ui/skeleton.tsx`)

```
animate-pulse rounded-md bg-muted
```

Dashboard uses custom skeleton: `h-36 bg-muted/60 rounded-2xl animate-pulse`.

### Progress/Score Bars

Score bars use inline width + background gradient from archetype colors:
```tsx
style={{ width: `${score}%`, background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})` }}
```

---

## Icons

### Archetype Icons (`src/components/archetype-icon.tsx`)

16 unique geometric SVG icons, one per archetype. Each icon:
- ViewBox: `0 0 48 48`
- Uses `<linearGradient>` from archetype's `gradient[0]` to `gradient[1]`
- Strokes use `currentColor`, fills use gradient via `url(#gradId)`
- Accepts `size` prop (default 48), `className`, custom `gradient` override
- File exports `ArchetypeIcon` component and `getArchetypeIconIds()`

Icon designs: Lightning bolt (assassin), Crossed axes (berserker), Crosshair (sharpshooter), Crossed swords (duelist), All-seeing eye (oracle), Castle (fortress), Dagger (shadow strategist), Diamond (gambler), Sound wave (rhythm walker), Star insignia (commander), Connected nodes (weaver), Hexagonal shield (sentinel), Theater mask (shapeshifter), Wolf silhouette (lone wolf), Gem with facets (collector), Tornado swirl (chaos child).

### UI Icons

Lucide React exclusively. Key mappings in `src/components/talent-icon.tsx`:

| Talent | Icon |
|--------|------|
| reaction_speed | `Zap` |
| hand_eye_coord | `Target` |
| spatial_awareness | `Box` |
| memory | `Brain` |
| strategy_logic | `Lightbulb` |
| rhythm_sense | `Music` |
| pattern_recog | `Search` |
| multitasking | `Layers` |
| decision_speed | `Timer` |
| emotional_control | `Heart` |
| teamwork_tendency | `Users` |
| risk_assessment | `Shield` |
| resource_mgmt | `Package` |

Navigation icons: `Home`, `Gamepad2`, `Bot`, `User`, `Bell`.

---

## Animation

### Framer Motion (`motion/react`)

Used in result/reveal pages for orchestrated entrance animations:

| Pattern | Properties | Duration |
|---------|-----------|----------|
| Icon reveal | `scale: 0→1, rotate: -180→0` | 0.6s, spring |
| Fade up | `opacity: 0→1, y: 20→0` | 0.5s |
| Fade in | `opacity: 0→1` | 0.4s |
| Staggered list | parent `staggerChildren: 0.08`, child `opacity: 0→1, y: 10→0` | 0.35s per item |

### CSS Animations (`globals.css`)

**`animate-fade-up`**
```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
animation: fade-up 0.4s ease-out both;
```

**`animate-shimmer`** (loading skeleton)
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
background: linear-gradient(90deg, transparent 25%, oklch(0.8 0.02 285 / 0.08) 50%, transparent 75%);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
```

**`animate-pulse`** (Tailwind built-in, used on skeleton components)

### CSS Transitions

| Element | Properties | Duration | Easing |
|---------|-----------|----------|--------|
| `.pressable` | `transform, opacity` | 200ms | ease-out |
| `.card-hover` | `transform, box-shadow` | 200ms | ease |
| Nav links | `color` via `transition-colors` | 150ms (Tailwind default) | ease |
| Archetype icon hover | `transform` via `transition-transform` | 150ms | ease |

---

## Layout

### Mobile-First

- Content container: `max-w-lg mx-auto` (512px) on most pages
- Landing page: `max-w-md md:max-w-2xl` (448px / 672px)
- Main content: `container mx-auto p-4 md:p-6 pb-20 md:pb-6`
- `pb-20` on mobile reserves space for bottom nav

### Bottom Tab Navigation (mobile, 4 tabs)

```
Dashboard (Home) | Play (Gamepad2) | Partners (Bot) | Me (User)
```

- Fixed bottom, `z-50`
- Glass background: `bg-background/80 glass-nav border-t border-border`
- Safe area: `pb-[env(safe-area-inset-bottom)]`
- Touch targets: `min-h-[3rem]` (48px), `py-2`
- Icon: 22px active (`strokeWidth: 2`), 22px inactive (`strokeWidth: 1.5`)
- Label: `text-[11px] font-medium`
- Active state: `text-primary`
- Inactive: `text-muted-foreground`

### Desktop Top Navigation

- Sticky, `h-14`, glass background
- Logo left, nav items + lang switcher + auth button right
- Nav items: `px-3 py-1.5 rounded-xl text-sm`
- Active: `bg-primary/10 text-primary`

### Viewport

```tsx
width: "device-width",
initialScale: 1,
maximumScale: 5,
userScalable: true,
viewportFit: "cover",
```

---

## Dark Mode

### Switching Mechanism

Class-based (`dark` class on `<html>`). Detected before React hydrates via inline `<script>`:

1. Check `localStorage.getItem('app-theme')` for explicit preference (`light` | `dark`)
2. Fall back to `prefers-color-scheme: light` media query
3. Default: dark mode

### Key Differences

| Element | Light | Dark |
|---------|-------|------|
| Background | Near-white (`0.968 L`) | Deep purple-black (`0.13 L, 0.02 C, 285 H`) |
| Cards | Pure white | Slightly lighter purple-black (`0.16 L`) |
| Primary | Deep purple (`0.55 L`) | Brighter purple (`0.65 L`) |
| Borders | Light gray (`0.885 L`) | Subtle purple (`0.25 L`) |
| Muted text | Mid-gray neutral | Purple-tinted gray (`0.6 L, 0.04 C, 285 H`) |
| Card hover shadow | `oklch(0 0 0 / 0.12)` | `oklch(0 0 0 / 0.3)` |

The accent (neon green `oklch(0.75 0.2 145)`) stays the same in both modes.

---

## Depth System

Five-level shadow scale + specialty glow effects (`globals.css`):

| Class | Box Shadow |
|-------|-----------|
| `.shadow-1` | `0 1px 3px oklch(0 0 0 / 0.08)` |
| `.shadow-2` | `0 2px 8px oklch(0 0 0 / 0.12)` |
| `.shadow-3` | `0 4px 16px oklch(0 0 0 / 0.16)` |
| `.shadow-4` | `0 8px 24px oklch(0 0 0 / 0.2)` |
| `.shadow-5` | `0 16px 48px oklch(0 0 0 / 0.25)` |
| `.shadow-glow` | `0 4px 20px oklch(0.55 0.25 285 / 0.2)` — purple glow |
| `.shadow-glow-lg` | `0 8px 30px oklch(0.55 0.25 285 / 0.25)` — larger purple glow |
| `.neon-glow` | `0 0 15px oklch(0.75 0.2 145 / 0.3), 0 0 30px oklch(0.75 0.2 145 / 0.1)` — green neon |

---

## Utility Classes

### Glass Navigation

```css
.glass-nav {
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}
```

### Gradient Text

```css
.gradient-text {
  background: linear-gradient(135deg, oklch(0.65 0.28 285), oklch(0.75 0.2 145));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

Purple-to-green gradient. Used on the "Tan" in "GameTan" brand name.

### Gradient Border

```css
.gradient-border::before {
  background: linear-gradient(135deg, oklch(0.65 0.28 285), oklch(0.75 0.2 145));
  opacity: 0.3;
}
```

### Card Hover Lift

```css
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px oklch(0 0 0 / 0.12);
}
```

---

## Border Radius Scale

Base: `--radius: 1rem` (16px). All computed radii from `globals.css`:

| Token | Formula | Approx |
|-------|---------|--------|
| `--radius-sm` | `radius * 0.6` | 10px |
| `--radius-md` | `radius * 0.8` | 13px |
| `--radius-lg` | `radius` | 16px |
| `--radius-xl` | `radius * 1.4` | 22px |
| `--radius-2xl` | `radius * 1.8` | 29px |
| `--radius-3xl` | `radius * 2.2` | 35px |
| `--radius-4xl` | `radius * 2.6` | 42px |

Cards use `rounded-xl`. Buttons use `rounded-lg`. Badges use `rounded-4xl` (pill).

---

## Accessibility

### Touch Targets

- Bottom nav tabs: `min-h-[3rem]` (48px) with `py-2`, exceeds 44px minimum
- Button minimum: `h-8` (32px) default, but primary CTAs use `h-14` (56px)
- Icon buttons: `size-8` (32px) minimum

### Color Contrast

- Light mode: `oklch(0.145)` foreground on `oklch(0.968)` background — high contrast
- Dark mode: `oklch(0.985)` foreground on `oklch(0.13)` background — high contrast
- Muted text in light mode: `oklch(0.45)` — lower contrast, used for secondary info only

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .pressable, .pressable:active {
    transition: none;
    transform: none;
  }
  .pressable:active { opacity: 0.7; }
}
```

### Text Selection

Disabled globally (`user-select: none`) to prevent accidental selection on mobile. Re-enabled for `input`, `textarea`, `[contenteditable]`.

### Pull-to-Refresh / Overscroll

Disabled globally via `overscroll-behavior: none` on both `html` and `body`. Touch action limited to `pan-y`.

---

## Tech Stack (Design-Relevant)

- **CSS framework**: Tailwind CSS v4 (CSS-based config via `@theme inline`, no `tailwind.config.ts`)
- **Component library**: shadcn/ui (base-nova style, neutral base color, CSS variables)
- **Animation**: Framer Motion (`motion/react`) for page transitions; CSS keyframes for loading states
- **Icons**: Lucide React (UI) + custom SVG (archetypes)
- **Charts**: Recharts (lazy-loaded)
- **shadcn style**: `base-nova` with `@base-ui/react` primitives
