# GameTan — 玩家身份发现器

**Brand**: GameTan (game.weda.ai)
**定位**: "16personalities for gamers" — 玩家版 MBTI
**核心循环**: 3-minute quiz → archetype reveal → share → register → AI characters

16 gamer archetypes (like MBTI) from 13 talent dimensions. AI character gallery (rivals, mentors, companions). Premium tier ($4.99/mo).

---

## 1. Quick Start

```bash
docker compose up -d                    # PostgreSQL :5433 + Redis :6379
npx drizzle-kit push                    # Sync DB schema
npm run dev                             # Dev server :3000
curl -X POST http://localhost:3000/api/admin/seed  # Seed 127 games
```

**Production:**
```bash
docker compose build app && docker compose up -d app
cloudflared tunnel run dev-local        # game.weda.ai → localhost:3100
```

**Build & Type Check:**
```bash
npx next build     # MUST pass before deploy — catches type errors + lint
npx vitest run     # Unit tests (scoring, game logic, scorers)
```

---

## 2. Agent 工作原则

- **执行顺序自主决定**: Coding agent 自己判断任务的最优执行顺序，不需要询问用户。
- **只在需要战略/设计决策时问用户**: 例如"是否引入新技术栈"、"产品方向二选一"这类不可逆决策才需确认。
- **实现细节不问**: 文件命名、代码结构、API 设计等在 Convention 范围内的决策，agent 直接做。
- **会话压缩前**: 必须更新 §15 Current Status。
- **会话压缩后**: 必须读取 §15 Current Status 了解当前进度。

---

## 3. Coding Conventions (所有新代码必须遵守)

### 3.1 File & Naming Rules

| What | Convention | Example |
|------|-----------|---------|
| Pages | `page.tsx` in route directory | `src/app/(main)/me/page.tsx` |
| API routes | `route.ts` in route directory | `src/app/api/partners/route.ts` |
| Components | PascalCase `.tsx` | `partner-hub.tsx` exports `PartnerHub` |
| Lib modules | camelCase `.ts`, pure functions preferred | `scoring.ts`, `archetype.ts` |
| Types | camelCase `.ts` in `src/types/` | `talent.ts`, `partner.ts` |
| Hooks | `use-*.ts` in `src/hooks/` | `use-device.ts` |
| Game plugins | `src/games/<id>/` with `index.ts` + `game.tsx` + `scorer.ts` | `src/games/reaction-speed/` |

### 3.2 Import Dependency Rules (模块依赖方向)

```
types/        ← 所有模块可引用 (最底层，纯类型定义)
lib/          ← components, app, games 可引用 (纯逻辑/算法，不依赖 React)
db/           ← lib, api routes 可引用 (仅后端)
hooks/        ← components, pages 可引用 (React hooks)
components/   ← pages 可引用 (UI 组件)
i18n/         ← components, pages 可引用 (翻译上下文)
games/        ← pages 可引用 (游戏插件，自包含)
```

**禁止方向**: `lib/` 不得 import `components/` 或 `app/`。`types/` 不得 import 任何其他模块。

### 3.3 React / Next.js Patterns

- **Client components**: `"use client"` at top. Use `useI18n()` for translations.
- **Bilingual text**: Use `isZh ? "中文" : "English"` ternary for inline text, `t("key")` for i18n-keyed text. Never hardcode single-language strings.
- **Hooks before returns**: All `useState`, `useMemo`, `useEffect` must come BEFORE any conditional `return`. React hooks cannot be called conditionally.
- **API responses**: Always return `{ success: boolean, data?: T, error?: string }` envelope.
- **Error handling**: API routes use try-catch, return `{ success: false, error: message }` with appropriate HTTP status.

### 3.4 UI Patterns (iOS HIG)

- **Icons**: Lucide React ONLY — no emoji in UI (archetype icons are the exception, stored as data not UI)
- **Colors**: OkLch color space, iOS systemBlue primary
- **Radius**: `--radius: 1rem` (16px)
- **Typography**: Geist Sans + PingFang SC
- **Interaction**: `.pressable` class for `active:scale(0.97) + opacity 0.88`
- **Glass nav**: `.glass-nav` for `backdrop-filter: blur(20px) saturate(180%)`
- **Scrollbar hide**: `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`
- **Archetype gradients**: Always use `archetype.gradient[0]` and `archetype.gradient[1]` for identity coloring

### 3.5 i18n Rules

```tsx
const { t, locale, setLocale } = useI18n();
const isZh = locale === "zh";
```

- ALL user-facing strings must be bilingual (either `t()` or `isZh` ternary)
- Talent names: `t("talent.reaction_speed")`
- Genre names: `t("genre.fps")`
- Platform names: `t("platform.pc")`
- **Key namespaces**: `nav.*`, `common.*`, `dashboard.*`, `explore.*`, `game.*`, `test.*`, `results.*`, `leaderboard.*`, `talent.*`, `genre.*`, `platform.*`, `chat.*`, `partners.*`, `messages.*`, `settings.*`, `auth.*`, `premium.*`, `profile.*`, `play.*`, `me.*`
- Locale files: `src/i18n/locales/zh.json`, `src/i18n/locales/en.json`

### 3.6 Change Impact Rules (改一处必查关联)

| 你改了... | 必须同步检查... |
|----------|---------------|
| `db/schema.ts` (表结构) | 所有引用该表的 API routes + `npx drizzle-kit push` |
| `lib/archetype.ts` (原型定义) | quiz result, results detail, dashboard, me page, OG cards |
| `lib/constants.ts` (talent/genre 枚举) | i18n locale files + scoring.ts + game-recommender.ts |
| `lib/partner-prompts.ts` | AI chat behavior 变化 → 需实际对话验证 |
| `lib/character-presets.ts` | partner-hub.tsx 的 preset gallery |
| `i18n/locales/*.json` | 两个语言文件必须同步增删 key |
| `middleware.ts` | 新路由的 public/protected 可达性 |
| `(main)/layout.tsx` | 导航 tab 结构 + activePrefixes |
| 任何 game plugin | games/index.ts registry + QUICK_TEST_GAMES if quiz game |

---

## 4. Architecture — Domain Map

```
┌──────────────────────────────────────────────────────┐
│                    App Layer (pages)                   │
│  Landing / Quiz / Dashboard / Play / Partners / Me    │
└────────────┬────────────────────────┬─────────────────┘
             │                        │
   ┌─────────▼──────────┐  ┌─────────▼──────────┐
   │  Component Layer    │  │  API Route Layer    │
   │  (UI components)    │  │  (server handlers)  │
   └─────────┬──────────┘  └─────────┬──────────┘
             │                        │
   ┌─────────▼────────────────────────▼──────────┐
   │              Lib Layer (pure logic)          │
   │  archetype · scoring · partner-prompts ·     │
   │  character-presets · auth · ai · constants   │
   └─────────────────────┬───────────────────────┘
                         │
   ┌─────────────────────▼───────────────────────┐
   │           Data Layer (DB + Redis)            │
   │  db/schema.ts · db/index.ts · lib/redis.ts  │
   └─────────────────────────────────────────────┘
```

### Domain Modules (7 个独立域)

| Domain | 核心文件 | 对外暴露 | 禁止直接依赖 |
|--------|---------|---------|------------|
| **Auth** | `lib/auth.ts`, `lib/captcha.ts`, `api/auth/*`, `middleware.ts` | JWT helpers, captcha | — |
| **Talent & Games** | `games/*`, `lib/scoring.ts`, `lib/constants.ts`, `api/scores/*`, `api/sessions/*` | Game plugins, scoring fns, talent enums | Partner domain |
| **Archetype** | `lib/archetype.ts` | 16 archetypes, mapping algorithms | DB layer (pure) |
| **AI Partners** | `lib/partner-prompts.ts`, `lib/character-presets.ts`, `lib/ai.ts`, `api/partners/*`, `api/chat/*`, `components/chat/*` | Partner CRUD, chat streaming | Game plugins |
| **Voice** | `voice-service/*`, `api/voice/*`, `hooks/use-voice.ts`, `components/chat/voice-button.tsx` | STT, TTS, voice recording | AI Partners (uses chat UI) |
| **Billing** | `api/billing/*`, `api/admin/codes/*` | Tier check, activation | — |
| **Social/Profile** | `api/profile/*`, `api/messages/*`, `api/leaderboard/*`, `app/profile/*` | Public profiles, messaging | — |

**依赖链**: Auth ← 所有域 | Talent → Archetype → Partner prompts | Billing → User tier checks | Voice → AI Partners

---

## 5. Domain: Auth

**Files**: `src/lib/auth.ts`, `src/lib/captcha.ts`, `src/middleware.ts`, `src/app/api/auth/*`

- JWT (jose) in HttpOnly cookie `auth-token`, 7-day expiry
- Payload: `{ sub: userId, username }`
- JWT_SECRET from env — **MUST be stable across restarts**
- Math captcha: SVG-rendered, one-time use (deleted after any verification attempt)
- Middleware: all routes protected EXCEPT `PUBLIC_PATHS`, `PUBLIC_PREFIXES` (`/profile/`, `/api/profile/`, `/quiz`), `SELF_AUTH_PREFIXES` (`/api/admin/`, `/api/cron/`)

**Tier check pattern** (used by Partner/Billing domains):
```typescript
const isPremium = user.tier === "premium" && (!user.tierExpiresAt || user.tierExpiresAt >= new Date());
```

---

## 6. Domain: Talent & Games

**Files**: `src/games/*`, `src/lib/scoring.ts`, `src/lib/constants.ts`, `src/lib/game-recommender.ts`, `src/lib/seed-games.ts`

### Game Plugin Structure
```
src/games/<game-id>/
  index.ts    — metadata: id, name, icon, instructions, talentCategory, estimatedDurationSec, difficulty
  game.tsx    — React component: receives onComplete(GameRawResult), onAbort()
  scorer.ts   — normalize(rawScore, durationMs, metadata) → 0-100
```

**13 Talent Categories** (camelCase in DB, snake_case in types):
`reaction_speed`, `hand_eye_coord`, `spatial_awareness`, `memory`, `strategy_logic`, `rhythm_sense`, `pattern_recog`, `multitasking`, `decision_speed`, `emotional_control`, `teamwork_tendency`, `risk_assessment`, `resource_mgmt`

**Ranks**: S (≥90), A (≥75), B (≥60), C (≥40), D (<40)

**10 Genres**: `fps`, `moba`, `rpg`, `rhythm`, `puzzle`, `strategy`, `battle_royale`, `racing`, `simulation`, `card`

**Testing Flow**:
1. `POST /api/sessions` → create session
2. Play 13 games → each `POST /api/scores` with `{ sessionId, gameId, rawScore, durationMs, metadata }`
3. `POST /api/sessions/[id]/complete` → `computeTalentScore()` → talentProfile + gameRecommendations
4. Redirect to `/results/[sessionId]` → archetype reveal

**Adding a new game**: Create `src/games/<id>/` with 3 files, register in `src/games/index.ts` registry. If it should be in quiz, add to `QUICK_TEST_GAMES` in `lib/archetype.ts`.

---

## 7. Domain: Archetype

**Files**: `src/lib/archetype.ts` (610 lines, pure — no DB, no React)

**16 Archetypes**, each with: id, name/nameEn, icon (emoji), tagline, description, weakness, nemesisId, allyId, weakTalent, strongTalent, evolutionId, evolutionHint, gradient colors, genres.

**Two mapping algorithms**:
1. `quickScoresToArchetype(reaction, pattern, risk)` — 3-score for public quiz. Two axes: reflexive vs strategic + bold vs steady.
2. `scoreToArchetype(scores: Record<string, number>)` — Full 13-dim for registered users. Specialist detection first (rhythm≥75→Rhythm Walker), then quadrant-based fallback.

**Used in 4 pages** (change archetype.ts → must verify all 4):
- `/quiz/result` — public quiz reveal
- `/results/[sessionId]` — full test reveal
- `/dashboard` — identity card
- `/me` — identity card

**OG cards** (change archetype definitions → must verify):
- `/api/quiz/card?s=78-45-62` — quiz share card
- `/api/profile/card/[username]` — profile share card

---

## 8. Domain: AI Partners

**Files**: `src/lib/partner-prompts.ts`, `src/lib/character-presets.ts`, `src/lib/ai.ts`, `src/app/api/partners/*`, `src/app/api/chat/*`, `src/app/api/voice/*`, `src/hooks/use-voice.ts`, `src/components/chat/*`

### Five-Layer Prompt System
```
Layer 1: definition      — Partner personality (Markdown)
Layer 2: memory          — Accumulated observations (bullet list, max 20 items)
Layer 3: userKnowledge   — Cross-partner shared knowledge graph
Layer 4: talentCtx       — User's talent profile + archetype identity from DB
Layer 5: convSummary     — (Optional) Summary of truncated earlier messages in long conversations
+ Universal rules (concise replies, language matching)
```

**Conversation Summary** (Layer 5): When a conversation exceeds the 10-message window, older messages are summarized by a fast LLM call (Gemini Flash, maxOutputTokens: 200) and injected into the system prompt. This preserves context continuity without sending the full message history. Runs in parallel with other prompt layer loading for zero additional latency on the critical path.

### 8 Character Presets (4 categories)
- **Rival**: 毒舌对手, 沉默强者
- **Mentor**: 暗黑导师, Weda · 原型解读者
- **Companion**: 热血搭档, 佛系损友
- **Wild**: 混沌精灵, 游戏哲学家

### Vercel AI SDK v6 Patterns (CRITICAL — v6 API differs from v3)
```
Frontend: useChat() + DefaultChatTransport, sendMessage({ text }), status: "submitted"|"streaming"|"ready"|"error"
UIMessage.parts: Array<UIMessagePart> — NOT .content
Backend: convertToModelMessages() (async), maxOutputTokens (not maxTokens), toUIMessageStreamResponse()
```

### Tier Limits
| Feature | Free | Premium |
|---------|------|---------|
| Partner slots | 1 (Weda) + 1 custom | 1 (Weda) + 5 custom |
| Memory items | 10 max | 50 max |
| Daily chat turns | 20/day | Unlimited |
| Proactive greetings | No | Yes |

### Memory Extraction Flow
1. User leaves conversation → fire-and-forget `POST /api/partners/[id]/memory`
2. LLM extracts key observations → updates `partners.memory` field
3. Max 20 items, only valuable long-term info

---

## 9. Domain: Billing / Premium

**Files**: `src/app/api/billing/activate/route.ts`, `src/app/api/admin/codes/route.ts`, `src/app/(main)/me/premium/page.tsx`

**Current method**: Activation codes (no Stripe yet)
1. Admin: `POST /api/admin/codes` with Bearer CRON_SECRET → generates codes
2. User: enters code on `/me/premium`
3. System: validates → sets `users.tier='premium'`, `tierExpiresAt=now+30d`

**Premium price**: $4.99/month

---

## 10. Domain: Social / Profile

**Files**: `src/app/profile/[username]/*`, `src/app/api/profile/*`, `src/app/api/messages/*`, `src/app/api/leaderboard/*`

- Public profile: `/profile/[username]` (outside `(main)` layout, standalone)
- OG card: `/api/profile/card/[username]` → 1200×630 `ImageResponse`
- Messaging: Redis ephemeral (24h TTL, read-burns messages)
- Leaderboard: usernames link to public profiles

---

## 11. Data Model (src/db/schema.ts)

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | Accounts + tier | ← partners, testSessions, gameScores, talentProfiles, microChallenges, userKnowledge |
| `partners` | AI agents | → users. slot=0 is Weda (system), 1-N custom |
| `testSessions` | Test tracking | → users. ← gameScores, talentProfiles |
| `gameScores` | Mini-game results | → testSessions, users, games |
| `talentProfiles` | Aggregated 13-dim scores | → testSessions, users. ← gameRecommendations |
| `games` | Game catalog (227+) | ← gameScores, gameRecommendations, microChallenges |
| `gameRecommendations` | Cached recs | → talentProfiles, games |
| `microChallenges` | Daily challenges | → users, games |
| `userKnowledge` | Shared knowledge graph | → users |
| `activationCodes` | Premium codes | → users (usedBy) |
| `captchaSessions` | One-time captcha tokens | — |

**Key fields on `users`**: id, username(unique), passwordHash, tier(free/premium), tierExpiresAt, referralCode, isProfilePublic, displayName, email

---

## 12. Navigation & Layout

### 4-Tab Mobile-First Layout (`src/app/(main)/layout.tsx`)

```typescript
const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "nav.home", icon: Home },
  { href: "/play", labelKey: "nav.play", icon: Gamepad2,
    activePrefixes: ["/play", "/explore", "/test", "/challenge"] },
  { href: "/chat", labelKey: "nav.partners", icon: Bot,
    activePrefixes: ["/chat"] },
  { href: "/me", labelKey: "nav.me", icon: User,
    activePrefixes: ["/me", "/results", "/leaderboard", "/settings"] },
];
```

- Mobile: fixed bottom glass-nav bar
- Desktop: sticky top header + language switcher + logout
- `activePrefixes` determine tab highlight for sub-pages

### Route → Tab Mapping

| Route | Tab | Notes |
|-------|-----|-------|
| `/dashboard` | Home | Archetype card + evolution + challenge |
| `/play`, `/explore/*`, `/test/*`, `/challenge` | Play | Game catalog + testing |
| `/chat`, `/chat/[id]`, `/chat/new` | Partners | AI character gallery + conversations |
| `/me`, `/results/*`, `/leaderboard`, `/settings` | Me | Profile + history + settings |
| `/quiz/*` | — | Public, no nav (standalone layout) |
| `/profile/[username]` | — | Public, no nav (standalone layout) |

---

## 13. Environment & Infra

### Environment Variables
```
DATABASE_URL=postgres://agent_p:agent_p_dev@localhost:5433/agent_p
REDIS_URL=redis://localhost:6379
JWT_SECRET=<32+ char, MUST be stable>
NEXT_PUBLIC_BASE_URL=https://game.weda.ai
OPENROUTER_API_KEY=<for AI chat + analysis>
AI_MODEL=anthropic/claude-sonnet-4
FIRECRAWL_API_KEY=<for crawlers, optional>
CRON_SECRET=<for /api/admin/* and /api/cron/*>
VOICE_SERVICE_URL=http://localhost:8100
VOICE_SERVICE_SECRET=<shared secret for voice service auth>
```

### Docker Services
```
app:        Next.js standalone → port 3100:3000
db:         PostgreSQL 16 → port 5433:5432
redis:      Redis 8.4 → port 6379:6379
voice:      Whisper STT + Kokoro TTS (GPU) → port 8100 (profile: voice)
```

**Voice service**: Start with `docker compose --profile voice up -d`. Requires NVIDIA GPU + NVIDIA Container Toolkit.

### Cloudflare Tunnel (`~/.cloudflared/config.yml`)
```
game.weda.ai → http://localhost:3100  (production)
dev.weda.ai  → http://localhost:3001  (dev, optional)
Tunnel: dev-local (ID: e7a5faf4-dad8-4a54-bb7e-3c57be346ed1)
```

### Tech Stack
Next.js 15 (App Router, Turbopack) · TypeScript · PostgreSQL + Drizzle ORM · Redis + ioredis · Vercel AI SDK v6 + OpenRouter · Tailwind CSS v4 + shadcn/ui · Lucide React · Recharts · next/og (ImageResponse) · Zod · Vitest

---

## 14. Design Philosophy

**Core insight** (16personalities.com, Wordle, Character.AI):
> 测试本身可以无聊，但结果必须创造身份认同。2亿用户分享"我是INFJ"——因为结果定义了"我是谁"。

**5 Rules**:
1. **10秒心动** — 首屏让人立刻想试
2. **结果 = 身份** — 分享"我是决斗者"而非"78分"
3. **零摩擦** — 无注册、3分钟完成
4. **天然病毒性** — 结果自带社交货币
5. **简单到极致** — 一个核心循环做到完美

**Growth Flywheel**: Quiz (free) → Archetype reveal → Share → Friend tests → Register → AI characters

---

## 15. Key Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | 4-tab over 6-tab | Reduce cognitive load. Play merges explore/test/challenge |
| 2 | All-in AI companions | Highest asset value. Talent data = unique differentiation vs Character.AI |
| 3 | Archetype over raw scores | 16personalities model. Identity drives sharing, not numbers |
| 4 | 3-game public quiz | Zero-friction entry. Client-side scoring. URL-encoded stateless sharing |
| 5 | Character presets > blank creation | Users don't create well from scratch. Gallery enables one-click |
| 6 | Partner restrictions removed | "角色可以有缺陷、有态度、有脾气" — diverse characters |
| 7 | Identity-driven dashboard | Archetype card > game catalog. Emotion > utility |
| 8 | Activation codes > Stripe | Phase simplicity. Stripe deferred to Phase 10 |
| 9 | OG cards via next/og | Server-side ImageResponse, zero external dependency |
| 10 | Brand: GameTan | 全局已统一 (layout, i18n, manifest, OG cards, prompts, auth forms) |
| 11 | Captcha one-time use | Deleted after ANY verification attempt. Auto-refresh on failure |

---

## 16. Current Status (会话压缩后必查)

### ✅ Completed
- Phase 1-8: Core platform (13 games, talent test, AI partners, Premium codes, public profiles)
- Phase 9A: 16 archetype system + dual mapping algorithms
- Phase 9B: Public quiz funnel (/ → /quiz → /quiz/result → share) + OG share cards
- Phase 9C: 8 character presets + partner gallery + INIT_AGENT_PROMPT unlocked
- Phase 9D: Dashboard + Me page identity-driven redesign
- Phase 9E: 13-game test results page → full archetype reveal experience
- Phase 10A: AI partner archetype context (archetypeId in DB + partner prompts include archetype identity)
- Phase 10B: Post-registration funnel (register → `/test?welcome=1` + welcome banner + dashboard progress card + Premium CTA on test limit)
- Phase 10B-backfill: All existing talentProfiles backfilled with archetypeId
- Phase 10C: Partner management UI (edit name/avatar/definition, delete with 2-step confirm, settings sheet)
- Phase 10D: Chat stability (stream error fix, message copy, retry on error, 10-message window, maxDuration=60)
- Phase 10E: Captcha anti-cache fix (force-dynamic, no-store headers, fetchingRef dedup, pre-submit validation)
- Phase 10F: Login form bilingual rewrite (all strings i18n, loading guards)
- Phase 10G: Chat conversation summary (Layer 5: truncated messages → Gemini Flash summary → injected into system prompt)
- Phase 10H: Voice infrastructure (Whisper STT + Kokoro TTS Docker service, API proxy routes, useVoice hook, VoiceButton component)
- Phase 10I: Chat UX overhaul — typing indicator (bouncing dots on `status=submitted`), friendlier error display (toast-style with amber icon + inline retry), mobile layout fix (correct viewport height calc for top header + bottom tab bar, `enterKeyHint="send"` for mobile keyboards, `overscroll-contain` to prevent swipe-nav, safe-area-inset-bottom padding for notch devices), removed VoiceButton (hidden until voice service deployed), zh.json brand name fixed (游戏百宝箱 → GameTan)
- Phase 10J: WeChat iOS login fix — dual cookie strategy (server-side HttpOnly + client-side `document.cookie`), JWT 30d expiry, remember-username checkbox with localStorage
- Brand: GameTalent → GameTan (unified globally)
- Bilingual: Landing, Quiz, Test Session, Auth forms, Results, Register
- Daily challenge system: fully implemented (13-talent cycle, streak, trend chart, dashboard + play + me integration)
- Tests: 114 unit tests passing (scoring, game-logic, scorers)

### 🔲 Pending
- Voice service GPU deployment: needs `docker compose --profile voice up` with NVIDIA GPU + Container Toolkit
- Crawler automation (code exists in `lib/crawlers/`, no scheduler yet)
- Stripe/payment integration (future phase)
- Referral system (referralCode field exists, not implemented)
- Email notifications (schema ready, not activated)
- Challenge leaderboard + streak rewards
- Backfill cron utility exists at `/api/cron/backfill-archetypes`
