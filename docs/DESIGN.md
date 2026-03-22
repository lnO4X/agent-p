# GameTan Design System — Esports Edition

## Brand Identity

**Aesthetic**: Esports / competitive gaming — deep purple + neon green
**Vibe**: Discord meets Razer — dark, vibrant, energetic
**Target**: Young gamers (16-30), competitive and identity-driven

---

## 1. Color System (OKLCh)

### Primary Palette
| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--primary` | `oklch(0.55 0.25 285)` | `oklch(0.65 0.28 285)` | Buttons, links, active states |
| `--accent` | `oklch(0.75 0.2 145)` | `oklch(0.75 0.2 145)` | Neon green highlights, badges, success |
| `--background` | `oklch(1 0 0)` | `oklch(0.13 0.02 285)` | Page background |
| `--card` | `oklch(1 0 0)` | `oklch(0.16 0.025 285)` | Card surfaces |
| `--muted` | `oklch(0.955 0.01 285)` | `oklch(0.22 0.03 285)` | Disabled, secondary surfaces |
| `--border` | `oklch(0.922 0.01 285)` | `oklch(0.25 0.03 285)` | Borders, dividers |

### Archetype Colors
Each of the 16 archetypes has a unique gradient pair defined in `lib/archetype.ts`.
Use `archetype.gradient[0]` and `archetype.gradient[1]` for identity coloring.

### Semantic Colors
- **Destructive**: Orange `oklch(0.577 0.245 27.325)` — errors, warnings
- **Success**: Use `--accent` (neon green)
- **Info**: Use `--primary` (purple)

---

## 2. Typography

### Font Stack
| Role | Font | Weight | CSS Variable |
|------|------|--------|-------------|
| **Display/Hero** | Outfit | 700-800 | `--font-outfit` |
| **Body** | Geist Sans | 400-600 | `--font-geist-sans` |
| **Monospace** | Geist Mono | 400 | `--font-geist-mono` |
| **CJK Fallback** | PingFang SC, Noto Sans SC | — | System fallback |

### Scale
| Level | Class | Font | Size | Usage |
|-------|-------|------|------|-------|
| Display | `text-5xl font-outfit font-bold` | Outfit | 48px | Landing hero |
| H1 | `text-3xl font-outfit font-bold` | Outfit | 30px | Page titles |
| H2 | `text-2xl font-semibold` | Geist | 24px | Section headers |
| H3 | `text-lg font-semibold` | Geist | 18px | Card titles |
| Body | `text-base` | Geist | 16px | Content |
| Small | `text-sm` | Geist | 14px | Descriptions |
| Tiny | `text-xs` | Geist | 12px | Labels, meta |
| Micro | `text-[10px]` | Geist | 10px | Badges only |

---

## 3. Depth & Shadow System

5-level hierarchy from subtle to dramatic:

| Level | Class | Box-Shadow | Usage |
|-------|-------|-----------|-------|
| 1 | `.shadow-1` | `0 1px 3px oklch(0 0 0 / 0.08)` | Subtle elevation |
| 2 | `.shadow-2` | `0 2px 8px oklch(0 0 0 / 0.12)` | Cards at rest |
| 3 | `.shadow-3` | `0 4px 16px oklch(0 0 0 / 0.16)` | Hover state |
| 4 | `.shadow-4` | `0 8px 24px oklch(0 0 0 / 0.2)` | Modal / dropdown |
| 5 | `.shadow-5` | `0 16px 48px oklch(0 0 0 / 0.25)` | Hero elements |

### Special Effects
| Class | Effect | Usage |
|-------|--------|-------|
| `.shadow-glow` | Purple glow (20px) | CTA buttons |
| `.shadow-glow-lg` | Purple glow (30px) | Hero CTAs |
| `.neon-glow` | Green neon (15px + 30px) | Achievement badges |
| `.gradient-border` | Purple→green border | Featured cards |

---

## 4. Motion & Animation

### Library: Framer Motion

### Timing Tokens
| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| Instant | 100ms | ease-out | Button press feedback |
| Fast | 200ms | ease-out | Hover states, toggles |
| Normal | 400ms | ease-out | Card transitions |
| Slow | 600ms | ease-out | Page section entrance |
| Spring | type: spring, stiffness: 200 | — | Bouncy reveals |

### Standard Animations
| Animation | Properties | Usage |
|-----------|-----------|-------|
| Fade Up | `opacity: 0→1, y: 15→0` | Section entrance |
| Scale Bounce | `scale: 0→1, rotate: -180→0` (spring) | Icon reveal |
| Stagger | `staggerChildren: 0.1` | List items |
| Slide In | `opacity: 0→1, x: -20→0` | Score bars |

### Celebration
- **Confetti**: `canvas-confetti` on quiz result reveal
- Colors: archetype gradient + gold (#FFD700)
- Particle count: 80, spread: 60

---

## 5. Component Patterns

### Interactive States
| State | Visual Treatment |
|-------|-----------------|
| Default | Base styling |
| Hover | `.card-hover` — translateY(-2px) + shadow increase |
| Active | `.pressable` — scale(0.97) + opacity(0.88) |
| Focus | Ring with `--ring` color |
| Disabled | opacity(0.5), pointer-events: none |
| Loading | `.animate-shimmer` gradient sweep |

### Card Variants (by purpose)
| Variant | Visual | Usage |
|---------|--------|-------|
| Default | `bg-card border-border` | Data display |
| CTA | `shadow-glow gradient-border` | Conversion hooks |
| Accent | `border-primary/20 bg-primary/5` | Highlights |
| Identity | Archetype gradient background (8% opacity) | Profile cards |
| Danger | `border-destructive/20 bg-destructive/5` | Warnings |

### Archetype Icons
Component: `<ArchetypeIcon archetypeId="berserker" size={48} />`
- 16 unique geometric SVG icons
- Auto-applies archetype gradient
- Replaces emoji in professional contexts

---

## 6. Layout Principles

- **Container**: `max-w-lg` (mobile-first), `container mx-auto` (desktop)
- **Spacing**: Tailwind 4px scale — gap-2(8px), gap-3(12px), gap-4(16px), gap-6(24px)
- **Section spacing**: `space-y-5` between card groups
- **Page padding**: `px-6 py-12` hero, `px-6 py-6` content
- **Safe areas**: `pb-[env(safe-area-inset-bottom)]` on bottom nav

### Navigation
- **Desktop**: Top bar with glass blur
- **Mobile**: Bottom tab bar (4 tabs) + top bar (brand + actions)
- **Glass effect**: `.glass-nav` — `backdrop-filter: blur(20px) saturate(180%)`

---

## 7. Accessibility

- **Contrast**: OKLCh lightness values ensure WCAG AA
- **Touch targets**: Min 48x44px (iOS HIG)
- **Motion**: Respect `prefers-reduced-motion`
- **Icons**: `aria-label` on all SVG icons
- **Focus**: Visible ring on keyboard navigation

---

## 8. File Organization

```
src/
├── app/globals.css          # Design tokens + utilities
├── components/
│   ├── ui/                  # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── archetype-icon.tsx   # 16 geometric SVG icons
│   └── games/
│       └── game-card.tsx    # Game discovery card
└── lib/
    └── archetype.ts         # 16 archetype definitions + gradients
```

---

## 9. Extensibility Rules

1. **New color**: Add to `@theme` block in globals.css, use OKLCh
2. **New component**: Follow shadcn/ui pattern (cva variants)
3. **New animation**: Define in Framer Motion, use timing tokens above
4. **New archetype**: Add gradient to archetype.ts + SVG to archetype-icon.tsx
5. **New shadow level**: Use the 5-level system, don't create ad-hoc shadows
6. **New font weight**: Only use Outfit for display/hero, Geist for everything else
