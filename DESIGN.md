# Design System — GameTan

## Product Context
- **What this is:** Esports talent detection — 3 mini-games measure real gaming talent, compare against pro player benchmarks
- **Who it's for:** Aspiring pro gamers + their parents (18-30 gamers, parents of 12-18 gamers), familiar with Discord/Steam/tracker.gg aesthetic
- **Space/industry:** Esports talent assessment (peers: Aim Lab, Human Benchmark, ProGuides)
- **Project type:** Web app — quiz funnel + identity content + dashboard

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian with identity warmth
- **Decoration level:** Intentional — dark surfaces with archetype gradient accents
- **Mood:** Like Blitz.gg's polish meets 16personalities' discovery moment. Data-credible but personally meaningful.
- **Reference sites:** OP.GG, Tracker.gg, Aimlabs, Blitz.gg, Prydwen.gg, 16personalities.com

### Research Summary (2026-03-27)
Analyzed 5 US-facing gaming products + 16personalities. Universal patterns:
1. Dark mode mandatory (5/5 use near-black backgrounds)
2. Sans-serif only (geometric/humanist)
3. High-contrast white text on dark
4. 1-2 saturated accent colors on neutral dark base
5. Compact information density

GameTan's previous purple+pink light theme violated all 5 patterns. US gamers associate dark interfaces with gaming tools they trust.

## Typography
- **Display/Hero:** Outfit 600-800 — geometric, rounded, gaming-friendly without being aggressive. Already in codebase.
- **Body:** DM Sans 300-700 — replaces Geist Sans. Warmer, more readable at body sizes, supports tabular-nums. Geometric but not clinical.
- **UI/Labels:** DM Sans 500-600
- **Data/Tables:** Geist Mono 400-500 — retained for monospace data display. Supports tabular-nums.
- **Code:** Geist Mono
- **Loading:** Google Fonts via next/font/google (Outfit, DM Sans already optimized for Next.js)
- **Scale:**
  - 4xl: 56px (hero, Outfit 800)
  - 3xl: 36px (page title, Outfit 700)
  - 2xl: 28px (section heading, Outfit 700)
  - xl: 22px (card title, Outfit 600)
  - lg: 18px (large body, DM Sans 400)
  - base: 15px (body, DM Sans 400)
  - sm: 13px (secondary, DM Sans 400)
  - xs: 11px (labels/badges, DM Sans 500)

### Chinese Fallback
```
DM Sans, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif
```

## Color

- **Approach:** Balanced — teal primary + gold accent on dark neutral base

### Why these colors
- **Teal #00D4AA:** Aimlabs uses #47D8D7 successfully. In gaming, teal/cyan = "active/online/connected." Distinct from the purple that every AI-generated site uses.
- **Gold #FFB800:** In gaming, gold = achievement/legendary/unlock. Blitz.gg uses #FFD164 for CTAs. Creates urgency without anxiety.
- **NOT purple:** Purple (hue 285) is the default AI slop color in 2024-2026. Every auto-generated SaaS site uses purple gradients. It erodes trust with design-aware users.

### Dark Mode (default)
| Token | Hex | Usage |
|-------|-----|-------|
| background | `#0F1117` | Page background, near-black with blue undertone |
| surface | `#1A1D27` | Cards, containers, modals |
| surface-hover | `#222535` | Hover states on surface |
| border | `#2A2D3A` | Subtle borders |
| text | `#F0F0F0` | Primary text |
| text-secondary | `#8B8FA3` | Secondary/description text |
| text-muted | `#565B6E` | Labels, placeholders |
| primary | `#00D4AA` | Primary actions, links, active states |
| primary-dim | `rgba(0,212,170,0.12)` | Primary backgrounds (badges, highlights) |
| accent | `#FFB800` | CTA buttons, achievement moments |
| accent-dim | `rgba(255,184,0,0.12)` | Accent backgrounds |
| destructive | `#EF4444` | Error, danger, delete |
| success | `#22C55E` | Positive outcomes |
| warning | `#F59E0B` | Caution |
| info | `#3B82F6` | Informational |

### Light Mode (alternative, landing page)
| Token | Hex | Usage |
|-------|-----|-------|
| background | `#F5F5F7` | Page background |
| surface | `#FFFFFF` | Cards |
| surface-hover | `#F0F0F2` | Hover |
| border | `#E2E2E8` | Borders |
| text | `#1A1D27` | Primary text |
| text-secondary | `#565B6E` | Secondary text |
| text-muted | `#8B8FA3` | Muted text |
| primary | `#00B894` | Slightly darker teal for light bg contrast |
| accent | `#E5A600` | Slightly darker gold for light bg |

### Archetype Gradients
Each archetype retains its unique gradient pair for identity coloring. These override the teal primary when displaying archetype-specific content (result pages, cards, profiles).

### Theme Color (viewport meta)
```
Dark: #0F1117
Light: #F5F5F7
```

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable-compact — 20% tighter than typical SaaS, but not as dense as OP.GG
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)

## Layout
- **Approach:** Hybrid — marketing layout for landing/quiz, data-dense for dashboard/results
- **Grid:** Single column (mobile-first, max 640px content). 2-col on tablet+ for dashboard.
- **Max content width:** 640px (content), 1000px (landing sections)
- **Border radius:**
  - sm: 6px (inputs, small elements)
  - md: 10px (buttons, alerts)
  - lg: 14px (cards, containers)
  - full: 9999px (badges, pills, avatars)

## Motion
- **Approach:** Intentional — archetype reveal gets cinematic treatment, everything else is fast and functional
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:**
  - micro: 50-100ms (button press, hover)
  - short: 150-250ms (fade in, tab switch)
  - medium: 300-500ms (archetype reveal steps, card entrance)
  - long: 500-800ms (confetti, celebration moments)
- **Archetype reveal sequence:** Slow, dramatic. Icon fade-in → name typewriter → tagline slide-up → score bars animate. This is the product's "magic moment" — it deserves motion budget.
- **Everything else:** Minimal. No scroll-driven animations. No page transitions. Fast and functional.

## Component Patterns

### Buttons
- **Primary CTA:** Gold (#FFB800) background, dark text, used sparingly (1 per screen max)
- **Secondary:** Teal (#00D4AA) background, dark text
- **Outline:** Teal border, teal text, transparent bg
- **Ghost:** No border, text-secondary color, hover shows surface-hover bg
- **Danger:** Red-tinted background, red text
- **Press effect:** `active:scale(0.97) active:opacity(0.88)` (retain existing .pressable class)

### Cards
- **Default:** surface bg, 1px border, radius-lg, padding 20-24px
- **Archetype card:** surface bg + archetype gradient on icon/accent elements
- **CTA card:** accent-dim bg, accent border, used for upsell/registration

### Score Bars
- **Background:** surface-hover (#222535)
- **Fill:** primary gradient (teal→lighter teal) for normal scores, danger gradient (red→orange) for low scores (<50)
- **Value label:** Geist Mono, right-aligned

### Alerts
- **Pattern:** Tinted background (color at 10% opacity) + 1px border (color at 20% opacity) + icon + text in the semantic color
- **Never use solid-color alert backgrounds** — too aggressive on dark themes

## Icons
- **Library:** Lucide React only (no emoji in UI chrome)
- **Archetype icons:** Emoji retained as archetype identity (🔥⚡🎯 etc.) — these are data, not UI decoration
- **Size:** 16px (inline), 20px (buttons), 24px (section headers), 48px (archetype display)

## Anti-Patterns (never do)
- Purple/violet as primary color (AI slop signal)
- Pink or pastel backgrounds (signals non-gaming product)
- Gradient buttons as default CTA pattern
- 3-column feature grid with icons in colored circles
- Centered everything with uniform spacing
- Light mode as default (gaming products are dark-first)
- Generic stock-photo hero sections
- Border radius > 16px on non-pill elements

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-27 | Dark-first design with teal+gold | 5/5 US gaming products use dark themes. Teal reads as "active/online" in gaming. Gold reads as "achievement." |
| 2026-03-27 | Replace Geist Sans → DM Sans | Geist feels like Vercel dev tools. DM Sans has geometric clarity with warmth for personality content. |
| 2026-03-27 | Replace purple primary → teal #00D4AA | Purple is 2024-2026 AI slop color. Teal differentiates from every AI-generated site. |
| 2026-03-27 | Gold #FFB800 for CTAs | Gaming association: gold = legendary/achievement. Creates visual hierarchy without anxiety. |
| 2026-03-27 | Keep Outfit for display | Already in codebase. Rounded geometric style has gaming personality without being aggressive. |
| 2026-03-27 | html lang="en" default | 主要用户在美国, Google SEO needs correct lang tag. Chinese via browser detection. |
