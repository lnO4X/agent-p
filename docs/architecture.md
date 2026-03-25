# Architecture Reference

> Extracted from CLAUDE.md. Agent reads this on-demand when working on specific domains.

---

## Domain Map

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

### Domain Modules (7 domains)

| Domain | Core Files | Exports | No Direct Dependency On |
|--------|---------|---------|------------|
| **Auth** | `lib/auth.ts`, `lib/captcha.ts`, `api/auth/*`, `middleware.ts` | JWT helpers, captcha | — |
| **Talent & Games** | `games/*`, `lib/scoring.ts`, `lib/constants.ts`, `api/scores/*`, `api/sessions/*` | Game plugins, scoring fns, talent enums | Partner domain |
| **Archetype** | `lib/archetype.ts` | 16 archetypes, mapping algorithms | DB layer (pure) |
| **AI Partners** | `lib/partner-prompts.ts`, `lib/character-presets.ts`, `lib/ai.ts`, `api/partners/*`, `api/chat/*`, `components/chat/*` | Partner CRUD, chat streaming | Game plugins |
| **Voice** | `voice-service/*`, `api/voice/*`, `hooks/use-voice.ts`, `components/chat/voice-button.tsx` | STT, TTS, voice recording | AI Partners (uses chat UI) |
| **Billing** | `api/billing/*`, `api/admin/codes/*` | Tier check, activation | — |
| **Social/Profile** | `api/profile/*`, `api/messages/*`, `api/leaderboard/*`, `app/profile/*` | Public profiles, messaging | — |
| **PK Challenge** | `api/pk/*`, `app/pk/*`, `db/schema.ts (pkChallenges)` | 1v1 viral challenges, no auth | Game plugins |
| **Daily Challenge** | `api/challenge/*`, `app/(main)/challenge/*` | Daily training + ranking + streak | Game plugins |
| **Quiz (Public)** | `app/quiz/*`, `api/quiz/*`, `lib/questionnaire.ts` | 3-game quick quiz + 39Q questionnaire | Archetype |

**Dependency chain**: Auth ← all domains | Talent → Archetype → Partner prompts | Billing → User tier checks | Voice → AI Partners | PK/Quiz → Game plugins + Archetype

---

## Domain: Auth

**Files**: `src/lib/auth.ts`, `src/lib/captcha.ts`, `src/middleware.ts`, `src/app/api/auth/*`

- JWT (jose) in HttpOnly cookie `auth-token`, 7-day expiry
- Payload: `{ sub: userId, username }`
- JWT_SECRET from env — **MUST be stable across restarts**
- Math captcha: SVG-rendered, one-time use (deleted after any verification attempt)
- Middleware: all routes protected EXCEPT `PUBLIC_PATHS` (includes `/api/voice/health`), `PUBLIC_PREFIXES` (`/profile/`, `/api/profile/`, `/quiz`), `SELF_AUTH_PREFIXES` (`/api/admin/`, `/api/cron/`)

**Tier check pattern** (used by Partner/Billing domains):
```typescript
const isPremium = user.tier === "premium" && (!user.tierExpiresAt || user.tierExpiresAt >= new Date());
```

---

## Domain: Talent & Games

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

**Ranks**: S (>=90), A (>=75), B (>=60), C (>=40), D (<40)

**10 Genres**: `fps`, `moba`, `rpg`, `rhythm`, `puzzle`, `strategy`, `battle_royale`, `racing`, `simulation`, `card`

**Testing Flow**:
1. `POST /api/sessions` → create session
2. Play 13 games → each `POST /api/scores` with `{ sessionId, gameId, rawScore, durationMs, metadata }`
3. `POST /api/sessions/[id]/complete` → `computeTalentScore()` → talentProfile + gameRecommendations
4. Redirect to `/results/[sessionId]` → archetype reveal

**Adding a new game**: Create `src/games/<id>/` with 3 files, register in `src/games/index.ts` registry. If it should be in quiz, add to `QUICK_TEST_GAMES` in `lib/archetype.ts`.

---

## Domain: Archetype

**Files**: `src/lib/archetype.ts` (610 lines, pure — no DB, no React)

**16 Archetypes**, each with: id, name/nameEn, icon (emoji), tagline, description, weakness, nemesisId, allyId, weakTalent, strongTalent, evolutionId, evolutionHint, gradient colors, genres.

**Two mapping algorithms**:
1. `quickScoresToArchetype(reaction, pattern, risk)` — 3-score for public quiz. Two axes: reflexive vs strategic + bold vs steady.
2. `scoreToArchetype(scores: Record<string, number>)` — Full 13-dim for registered users. Specialist detection first (rhythm>=75 → Rhythm Walker), then quadrant-based fallback.

**Used in 4 pages** (change archetype.ts → must verify all 4):
- `/quiz/result` — public quiz reveal
- `/results/[sessionId]` — full test reveal
- `/dashboard` — identity card
- `/me` — identity card

**OG cards** (change archetype definitions → must verify):
- `/api/quiz/card?s=78-45-62` — quiz share card
- `/api/profile/card/[username]` — profile share card
- `/api/archetype/card/[id]` — archetype detail share card
- `/api/pk/card/[id]` — PK challenge share card
- `/api/challenge/card?score=&talent=&streak=&name=` — daily challenge share card

---

## Domain: AI Partners

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
- **Rival**: fierce-rival, silent-ace
- **Mentor**: dark-mentor, Weda (archetype interpreter)
- **Companion**: hype-duo, chill-friend
- **Wild**: chaos-sprite, game-philosopher

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

## Domain: Billing / Premium

**Files**: `src/app/api/billing/activate/route.ts`, `src/app/api/admin/codes/route.ts`, `src/app/(main)/me/premium/page.tsx`, `src/app/api/webhooks/lemonsqueezy/route.ts` (TODO), `src/app/me/report/page.tsx` (TODO)

### Payment Provider: LemonSqueezy

| Config | Value |
|--------|-------|
| **Provider** | [LemonSqueezy](https://lemonsqueezy.com) |
| **Store** | GameTan store (ID: TBD — get from dashboard) |
| **Webhook endpoint** | `POST /api/webhooks/lemonsqueezy` |
| **Webhook secret** | `LEMONSQUEEZY_WEBHOOK_SECRET` env var |
| **API key** | `LEMONSQUEEZY_API_KEY` env var |

### Products

| Product | Type | Price | Tax Category | Status |
|---------|------|-------|-------------|--------|
| **Deep Archetype Report** | Single payment | $3.99 | Information Services | ✅ Published |
| **Premium Subscription** | Subscription | $4.99/mo or $29.99/yr | SaaS - Personal | 🔲 TODO |

### Purchase Flow: Deep Archetype Report

```
User takes quiz → sees result → clicks "Unlock Full Report $3.99"
  → LemonSqueezy checkout overlay (or redirect)
  → Payment complete → LemonSqueezy webhook fires
  → POST /api/webhooks/lemonsqueezy
    → Validate signature (HMAC SHA256)
    → Extract order_id, customer_email, product_id
    → Find/create user by email → mark report as purchased
    → Generate personalized PDF report (archetype + talents + pro comparisons)
  → User redirects to https://gametan.ai/me/report
  → Page checks purchase status → shows/downloads report
```

### Post-Purchase Pages

| Route | Purpose |
|-------|---------|
| `/me/report` | Report download page (checks purchase status, generates PDF on demand) |
| Confirmation modal | Title: "Your Report is Ready!", Button: "View My Report" → `/me/report` |
| Email receipt | Button: "Download My Report" → `/me/report` |

### Activation Codes (legacy, still active)

1. Admin: `POST /api/admin/codes` with Bearer CRON_SECRET → generates codes
2. User: enters code on `/me/premium`
3. System: validates → sets `users.tier='premium'`, `tierExpiresAt=now+30d`

### Premium Tiers

| Feature | Free | Premium |
|---------|------|---------|
| Quiz + Archetype | ✅ | ✅ |
| AI Chat | 5 msgs/day | Unlimited |
| Deep Report | $3.99 one-time | Included |
| Custom Partners | 2 slots | 5 slots |
| Advanced Analytics | ❌ | ✅ |

**Premium price**: $4.99/month or $29.99/year (50% savings)

---

## Domain: Social / Profile

**Files**: `src/app/profile/[username]/*`, `src/app/api/profile/*`, `src/app/api/messages/*`, `src/app/api/leaderboard/*`

- Public profile: `/profile/[username]` (outside `(main)` layout, standalone)
- OG card: `/api/profile/card/[username]` → 1200x630 `ImageResponse`
- Messaging: Redis ephemeral (24h TTL, read-burns messages)
- Leaderboard: usernames link to public profiles

---

## Data Model (src/db/schema.ts)

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | Accounts + tier | <- partners, testSessions, gameScores, talentProfiles, microChallenges, userKnowledge |
| `partners` | AI agents | -> users. slot=0 is Weda (system), 1-N custom |
| `testSessions` | Test tracking | -> users. <- gameScores, talentProfiles |
| `gameScores` | Mini-game results | -> testSessions, users, games |
| `talentProfiles` | Aggregated 13-dim scores | -> testSessions, users. <- gameRecommendations |
| `games` | Game catalog (227+) | <- gameScores, gameRecommendations, microChallenges |
| `gameRecommendations` | Cached recs | -> talentProfiles, games |
| `microChallenges` | Daily challenges | -> users, games |
| `userKnowledge` | Shared knowledge graph | -> users |
| `activationCodes` | Premium codes | -> users (usedBy) |
| `captchaSessions` | One-time captcha tokens | — |
| `pkChallenges` | Social PK 1v1 challenges | -> users (creator/challenger), games |

**Key fields on `users`**: id, username(unique), passwordHash, tier(free/premium), tierExpiresAt, referralCode, isProfilePublic, displayName, email

---

## Navigation & Layout

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

### Route -> Tab Mapping

| Route | Tab | Notes |
|-------|-----|-------|
| `/dashboard` | Home | Archetype card + evolution + challenge |
| `/play`, `/explore/*`, `/test/*`, `/challenge` | Play | Game catalog + testing |
| `/chat`, `/chat/[id]`, `/chat/new` | Partners | AI character gallery + conversations |
| `/me`, `/results/*`, `/leaderboard`, `/settings` | Me | Profile + history + settings |
| `/quiz/*` | — | Public, no nav (standalone layout) |
| `/profile/[username]` | — | Public, no nav (standalone layout) |
| `/pk`, `/pk/[id]` | — | Public, no nav (PK challenge) |
| `/archetype`, `/archetype/[id]` | — | Public, no nav (archetype pages) |
| `/archetype/compatibility` | — | Public, no nav (compatibility tool) |
| `/me/report` | Me | Post-purchase report download (auth required) |
