# GameTan — 玩家身份发现器

**Brand**: GameTan (gametan.ai)
**定位**: "16personalities for gamers" — 玩家身份系统（不是游戏平台）
**核心循环**: Quiz → Archetype reveal → Content depth → Share → Register → Premium report
**变现**: 峰值变现（测完买深度报告 ¥29.9）> 订阅

16 gamer archetypes from 13 talent dimensions. Identity content (96+ SEO pages). Game-specific quizzes (viral). See `docs/roadmap.md` for full plan.

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
cloudflared tunnel run dev-local        # gametan.ai → localhost:3100
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
- **会话压缩前**: 必须更新 §7 Current Status。
- **会话压缩后**: 必须读取 §7 Current Status 了解当前进度。
- **中国镜像源**: 所有下载（pip/npm/HuggingFace/Docker）优先使用中国镜像，详见 §6。
- **工具/MCP建议**: 当任务最佳实践需要新的AI模型、Skill、MCP Server或外部工具框架时，必须主动建议用户提供/安装，不要假设当前环境已有。
- **工作量估算**: 按Claude Code单次上下文(~100K tokens)能力评估，而非人工天数。单个上下文通常可完成5-15个文件的修改+测试+部署。

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

## 4. Domain Summary

> 详细架构设计、数据模型、导航布局见 `docs/architecture.md`。修改特定域代码时按需读取。

| Domain | 入口文件 | 一句话 |
|--------|---------|--------|
| **Auth** | `lib/auth.ts`, `middleware.ts` | JWT + captcha + Redis rate limiting, PUBLIC_PATHS 含 `/api/voice/health` |
| **Rate Limiting** | `lib/redis.ts` | @upstash/redis (HTTP REST), `checkRateLimit()`, captcha/login/register/chat daily limits |
| **Talent & Games** | `games/*`, `lib/scoring.ts` | 13 game plugins → 13-dim scores → S/A/B/C/D ranks |
| **Archetype** | `lib/archetype.ts` (610行, pure) | 16 archetypes, 改动必查 4 页面 + 2 OG cards |
| **AI Partners** | `lib/partner-prompts.ts`, `components/chat/*` | 五层 prompt, Vercel AI SDK v6, tier-based limits |
| **Voice** | `voice-service/*`, `api/voice/*` | Whisper STT + Edge TTS (Microsoft neural voices), port 8100 |
| **Billing** | `api/billing/*`, `api/admin/codes/*` | 激活码模式, $4.99/month, Stripe 未接入 |
| **Social** | `api/profile/*`, `api/messages/*` | 公开档案 + Redis 阅后即焚消息 + 排行榜 |
| **Referral** | `api/referral/*`, `api/cron/backfill-referral-codes/*` | 8-char codes, referrals tracking table, Me page card |
| **Crawlers** | `lib/crawlers/*`, `api/cron/crawl-games/*` | Firecrawl-based Steam/TapTap game crawlers |
| **Email** | `lib/email/*`, `api/cron/email-digest/*` | Resend API (weda.ai, Tokyo), weekly digest, streak milestones |
| **Admin Settings** | `api/admin/settings/*`, `admin/settings/page.tsx` | Site settings (ai_model etc.), DB-backed key-value store with 60s cache |
| **Feedback** | `api/feedback/*`, `api/talent-trends/*` | Game rec feedback (like/dislike/played), chat ratings (1-5), talent percentiles |
| **Marketplace** | `api/marketplace/*`, `(main)/marketplace/page.tsx` | Shared partner definitions, likes, usage tracking |
| **Steam** | `api/integrations/steam/*` | Steam ID linking, game library import via Steam Web API |
| **Community** | `api/community/*`, `(main)/community/page.tsx` | Archetype-based posts, replies, likes |

> 设计哲学与历史决策见 `docs/decisions.md`。做产品方向决策时参考。

---

## 5. Environment & Infra

### Environment Variables
```
DATABASE_URL=postgres://agent_p:agent_p_dev@localhost:5433/agent_p
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
JWT_SECRET=<32+ char, MUST be stable>
NEXT_PUBLIC_BASE_URL=https://gametan.ai
OPENROUTER_API_KEY=<for AI chat + analysis>
AI_MODEL=minimax/minimax-m2.5 (fallback; actual value from DB site_settings.ai_model)
FIRECRAWL_API_KEY=<for game crawlers, optional>
RESEND_API_KEY=<for email notifications, optional>
STEAM_API_KEY=<for Steam game library import, optional>
CRON_SECRET=<for /api/admin/* and /api/cron/*>
VOICE_SERVICE_URL=http://localhost:8100
VOICE_SERVICE_SECRET=<shared secret for voice service auth>
```

### Production (Cloud)
```
App:    Vercel (auto-deploy from GitHub main branch)
DB:     Neon PostgreSQL 17 (ap-southeast-1, Singapore)
Redis:  Upstash (REST API, ap-southeast-1)
Domain: gametan.ai (Cloudflare DNS → Vercel)
```

### Local Dev (Docker, optional)
```
app:        Next.js standalone → port 3100:3000
db:         PostgreSQL 16 → port 5433:5432
redis:      (not needed — Upstash REST used directly)
```

### Voice Service (Local GPU)
```
voice-service/       Python 3.11 venv, runs on host machine (not Docker)
  .venv/             Python 3.11.9 virtual environment
  server.py          FastAPI: Whisper STT + Edge TTS (Microsoft neural voices) → port 8100
  start.bat          Double-click to start
  requirements.txt   Dependencies (faster-whisper, edge-tts, torch cu128)
```

**Start**: `cd voice-service && start.bat` (or `.venv/Scripts/python.exe server.py`)
**GPU**: NVIDIA RTX 5060 Ti 16GB (CUDA capability sm_120, requires PyTorch cu128+)
**Models**: Whisper medium (~1.5GB, float16 CUDA) + Edge TTS (cloud, free, ~2s latency)
**Docker access**: App container reaches voice service via `host.docker.internal:8100`

### Cloudflare Tunnel (`~/.cloudflared/config.yml`)
```
gametan.ai → http://localhost:3100  (production)
dev.weda.ai  → http://localhost:3001  (dev, optional)
Tunnel: dev-local (ID: e7a5faf4-dad8-4a54-bb7e-3c57be346ed1)
```

### Tech Stack
Next.js 15 (App Router, Turbopack) · TypeScript · PostgreSQL + Drizzle ORM · Upstash Redis (REST) · Vercel AI SDK v6 + OpenRouter · Tailwind CSS v4 + shadcn/ui · Lucide React · Recharts · next/og (ImageResponse) · Zod · Vitest

---

## 6. Mirror Sources (中国镜像源)

所有包管理和模型下载必须优先使用镜像源，避免因网络问题导致安装超时。

### pip (Python)
```bash
# voice-service/.venv 已配置 pip.conf
# 临时使用: pip install <pkg> -i https://mirrors.aliyun.com/pypi/simple/
# PyTorch: pip install torch --index-url https://mirror.sjtu.edu.cn/pytorch-wheels/cu128
```

### npm (Node.js)
```bash
# 项目 .npmrc 已配置 registry=https://registry.npmmirror.com
```

### HuggingFace (AI models)
```bash
# 环境变量: HF_ENDPOINT=https://hf-mirror.com
# voice-service/start.bat 已自动设置
```

### Docker
```bash
# /etc/docker/daemon.json 或 Docker Desktop Settings
# "registry-mirrors": ["https://mirror.ccs.tencentyun.com"]
```

---

## 7. Current Status (会话压缩后必查)

### ✅ Completed
- Phase A1: Cloud migration — gametan.ai on Vercel + Neon PG (Singapore) + Upstash Redis (Singapore). Domain bought, DB migrated (28 tables), DNS configured, SSL active. ioredis→@upstash/redis (HTTP REST). All game.weda.ai references updated to gametan.ai. Local Docker no longer needed for production.
- Phase 1-8: Core platform — 13 games, talent test, 16 archetypes, AI partners, Premium codes, public profiles
- Phase 9: Quiz funnel + archetype system — public quiz → OG share cards, 8 character presets, dashboard + results redesign
- Phase 10: AI + UX polish — partner archetype context, post-registration funnel, chat stability/streaming/summary, voice (Whisper STT + Edge TTS), WeChat iOS login fix, bilingual everything
- Phase 11: Admin dashboard — 7 stat cards, user detail pages, 127-game management, conversion funnel chart
- Phase 12: Partner proactive greetings (Gemini Flash) + challenge leaderboard
- Phase 13: Referral system + Steam/TapTap crawlers + email notifications (Resend) + voice cleanup
- Phase 14: Data flywheel tables + partner marketplace + Steam integration + archetype community
- Phase 15: Security hardening — Redis rate limiting (captcha/login/register/chat), password complexity, healthchecks, ErrorBoundary, lazy-load Recharts
- Phase 16: Conversion optimization — quiz CTA overhaul, chat rate limit upgrade CTA, celebration confetti, first-chat greeting animation, streak rewards (7d→1, 14d→3, 30d→7, 60d→14, 100d→30 premium days)
- Phase 17: Flywheel activation + architecture cleanup — data flywheel closed (feedback re-ranking), 3 DB indexes, API envelope standardized, 138 tests
- Phase 18: Chat error fix + iOS mobile UX + Admin settings + Results Premium CTA
  - **Chat error misclassification fixed**: OpenRouter 403 "Key limit exceeded" was matching frontend `includes("limit")` → showing "对话次数已用完". Now uses precise matching: `CHAT_LIMIT` / `对话次数` / `429` only. Added separate "AI service unavailable" UI for provider errors.
  - **iOS viewport**: Removed `maximumScale:1` + `userScalable:false` → allows pinch zoom (accessibility)
  - **Bottom nav touch targets**: `py-1.5` → `py-2` + `min-h-[3rem]` (48px), icon 20→22px, label 10→11px
  - **Chat input**: `text-sm` → `text-base md:text-sm` (16px on mobile prevents Safari auto-zoom)
  - **Admin Settings overhaul**: API Key hot-swap from DB (no container restart), model selector simplified to 1 free preset (DeepSeek V3) + persistent custom models
  - **Results page Premium CTA**: Yellow gradient card after AI Analysis, 4 feature highlights, Crown icon, routes to /me/premium. Only shows for free-tier users.
  - **Dev cycle cron**: `gametan-dev-cycle` scheduled task, cron `*/30 * * * *`, auto smoke test → develop → deploy
  - 114 unit tests passing
- Phase 19: Referral UI optimization + type fix
  - **GameScorer interface**: `durationMs` made optional (was causing TS errors in tests; scorers only use rawScore)
  - **Referral card redesign**: Green-tinted card, better incentive copy, "Copy invite link" button, Web Share API button (mobile)
  - **Register form**: Auto-fills referral code from `?ref=CODE` URL param (deep-link support)
  - **i18n**: Added `me.referralCopyLink`, `me.referralLinkCopied` keys to both zh/en locale files
- Phase 20: Community in-app notifications
  - **notifications table**: New DB table (id, userId, type, postId, senderId, read, createdAt) with 2 indexes
  - **Auto-created**: Like/reply on community posts creates notification for post author (skips self-actions)
  - **API**: `GET /api/notifications` (list + unreadCount), `POST /api/notifications/mark-read`
  - **/notifications page**: List view with like/reply icons, relative timestamps, unread blue dot, auto-marks-read on open
  - **Bell icon**: Added to both mobile top bar and desktop nav with unread count badge, refreshes on route change
  - 114 unit tests passing
- Phase 21: Chat A/B model quality tracking
  - **schema**: Added `model_id` column + index to `chat_feedback` table (nullable, backwards-compat)
  - **Auto-resolve**: Feedback API auto-resolves partner.modelId → global site_settings ai_model → env fallback at submit time
  - **Star rating UI**: Shows in chat after 5+ messages (status=ready), once per session, 5-star tap-to-rate
  - **Admin endpoint**: `GET /api/admin/chat-model-stats` returns per-model count/avgRating/distribution
  - **Admin dashboard**: "AI 模型评分 Model Ratings" card with star viz + rating distribution bars
  - 114 unit tests passing
- Phase 23: Community email alerts — like/reply email notifications
  - **Templates**: `communityLikedHtml` + `communityRepliedHtml` added to `lib/email/templates.ts`
  - **API route**: `api/community/[id]/route.ts` — like/reply actions now fetch author email via JOIN, send fire-and-forget email after in-app notification (bilingual zh+en subject + body)
  - **Zero regression**: 114 unit tests passing, build clean
  - **Deploy pending**: Docker Desktop was unresponsive; manual deploy needed
- Phase 22: Infrastructure — Email service + Feishu notifications + OpenRouter key refresh
  - **OpenRouter API key**: Refreshed via admin settings API (hot-swap, no restart)
  - **Resend email service**: RESEND_API_KEY configured, domain `weda.ai` verified (Tokyo region), FROM: `noreply@weda.ai`
  - **Feishu notifications**: `scripts/feishu-notify.py` script, integrated into `gametan-dev-cycle` scheduled task (STEP 8)
  - **Dev cycle enhanced**: Now sends Feishu notification after every cycle (success/warning/error/info)
  - **Steam API key**: STEAM_API_KEY configured, game library import feature unlocked

- Phase 24: Steam game library import UX
  - **Settings page**: New Steam section — link by 17-digit Steam ID, shows username + game count + total hours after linking, unlink button with confirm dialog
  - **i18n**: Added `settings.steam*` keys to both zh.json and en.json (12 new keys each)
  - **UX**: Error display for invalid Steam IDs, external link to Steam account page to find ID, loading state during import
  - 114 unit tests passing, build clean
  - **Deploy pending**: Docker Desktop unresponsive — needs `docker compose build app && docker compose up -d app`

- Phase 25: Community replies UI
  - **Reply threads**: Clicking comment icon on a post now expands an inline reply section with existing replies + reply input
  - **Reply loading**: Fetches replies from `GET /api/community/[id]` on expand (cached, no re-fetch on collapse/re-expand)
  - **Reply submission**: `POST /api/community/[id]` with `action: "reply"`, Enter key shortcut, local count update
  - **UX**: CornerDownRight thread indicator, skeleton loaders, empty state, 300-char limit, pressable send button
  - 114 unit tests passing, build clean
  - **Deploy pending**: Docker Desktop unresponsive

- Phase 26: Community sort toggle (Newest / Hot)
  - **API**: `GET /api/community` now accepts `sort=newest|hot` query param; "hot" sorts by `likeCount DESC, createdAt DESC`
  - **UI**: Two-button sort toggle (Clock/Newest + Flame/Hot) added above post list in community page; re-fetches on sort change
  - **i18n**: Inline `isZh` ternary (最新/Newest, 热门/Hot) — no new i18n keys needed
  - 114 unit tests passing, build clean

- Phase 27: AI Partners + Chat UX fixes (dev-cycle Group B review)
  - **`partner-init-flow.tsx`**: Replaced `alert()` calls (hardcoded Chinese, bad UX) with proper inline `createError` state — bilingual error shown below action buttons
  - **`partner-hub.tsx`**: `createFromPreset()` was silently swallowing all errors; now shows bilingual error toast above gallery on failure
  - Both fixes follow `isZh` bilingual convention; no new i18n keys needed
  - 114 unit tests passing, build clean, deployed to port 3100

- Phase 28: UX polish — i18n error messages + dashboard loading skeleton (dev-cycle Group E review)
  - **Hardcoded English error fallbacks fixed**: `challenge/page.tsx` ("Failed to load" / "Network error" / "Submit failed"), `me/premium/page.tsx` ("Activation failed" / "Purchase failed" / "Network error"), `settings/page.tsx` ("Invalid Steam ID" / "Network error") — all now use `isZh ? "中文" : "English"` bilingual pattern
  - **Dashboard loading skeleton**: Added `loadingProfile` state — renders `animate-pulse` skeleton card while leaderboard fetch is in-flight, preventing flash of "no archetype" CTA before data arrives
  - **Settings page**: Added `locale` + `isZh` destructure from `useI18n()` (was only using `t`)
  - 114 unit tests passing, build clean, deployed to port 3100

- Phase 29: Auth + Security review (dev-cycle Group A)
  - **register-form.tsx**: Frontend password check was `length < 6` — mismatched with backend's 8-char+complexity requirement. Fixed to check 8+ and complexity (uppercase/lowercase/digit) with bilingual error messages. Updated placeholder to match.
  - **change-password-form.tsx**: Fully hardcoded Chinese UI — bilingual (`isZh` ternary) for all labels, errors, success, buttons, placeholder. Password check upgraded to 8-char+complexity matching backend. Now imports `useI18n`.
  - **api/auth/change-password/route.ts**: Missing rate limiting — added user-scoped limit (`rl:chpwd:{userId}`, max 5 per 15min) with `Retry-After: 900` header. Changed `Request` → `NextRequest`.
  - 114 unit tests passing, build clean, deployed to port 3100

- Phase 30: Community + Social review (dev-cycle Group D)
  - **`api/community/route.ts`**: GET + POST handlers had no try-catch — unhandled DB errors would crash; added try-catch with `{success:false, error:{code,message}}` envelope
  - **`api/community/[id]/route.ts`**: 4 responses were using bare `{error:"..."}` without envelope (`NOT_FOUND`, `UNAUTHORIZED`, `VALIDATION_ERROR`, `BAD_REQUEST`); wrapped GET + POST in try-catch; all errors now follow standard envelope
  - **`api/notifications/route.ts`**: 401 response used bare `{error:"Unauthorized"}` → fixed to envelope
  - **`api/notifications/mark-read/route.ts`**: Same 401 envelope fix
  - **`leaderboard/page.tsx`**: Date hardcoded to `zh-CN` locale; now respects `locale` from `useI18n()` → `zh-CN` or `en-US`; added `locale` to destructure
  - **`community/page.tsx`**: Redundant `/api/auth/me` fetch (result ignored) before `/api/talent-trends`; removed wasteful prefetch
  - 114 unit tests passing, build clean, deployed to port 3100

- Phase 31: Billing + Growth hardening (dev-cycle Group G review)
  - **`api/billing/activate/route.ts`**: Wrapped all DB operations in try-catch; fixed 401 to use `{success:false}` envelope
  - **`api/billing/mock-purchase/route.ts`**: Same try-catch + envelope fix
  - **`api/referral/route.ts`**: Wrapped DB queries in try-catch with proper error envelope
  - **`api/marketplace/[id]/route.ts`**: Fixed not-found response to use `{success:false,error}` envelope; added `action` validation (returns 400 on invalid action); wrapped like/unlike in try-catch
  - **`api/integrations/steam/route.ts`**: Added try-catch to GET + DELETE handlers; fixed bare `{error}` envelopes to `{success:false,error}`
  - **`api/partners/route.ts`**: `getUserTier()` now returns `{tier, tierExpiresAt}` object (was just string); GET response now includes `tierExpiresAt` ISO string; POST slot-limit error now uses `{success:false}` envelope
  - **`(main)/me/premium/page.tsx`**: Fixed `useEffect` — removed redundant `/api/auth/me` prefetch; now also picks up `tierExpiresAt` from `/api/partners` response so expiry date shows on page load
  - 114 unit tests passing, build clean, deployed to port 3100

- Phase 32: Product defensibility — public content + archetype culture
  - **Product analysis**: Scored 4/16 on defensibility framework. Core problem: "测完就走" — no retention after quiz. Strategy: pivot to "游戏版 MBTI 文化" — build identity culture, not just a test tool.
  - **`middleware.ts`**: Opened `/explore`, `/api/games/catalog`, `/archetype` to public access (no login required). Removed the login wall that was killing exploration.
  - **`(main)/layout.tsx`**: Auth-aware navigation — anonymous users see "Login" button instead of logout/notifications. Detects `auth-token` cookie client-side.
  - **`/archetype` (new)**: Public archetype index page — 16 archetypes in a grid with gradient cards, icons, taglines. Links to quiz + compatibility.
  - **`/archetype/[id]` (new)**: Rich archetype detail page — hero gradient banner, description, strength/weakness, nemesis/ally relationship cards (clickable), evolution path, recommended genres (linked to /explore), compatibility CTA, other archetypes grid.
  - **`/archetype/compatibility` (new)**: Two-archetype compatibility checker — dropdown selectors, animated result card with score (0-100), label (Soulmates→Rivals), dynamic bilingual analysis text, strengths/challenges lists, shareable URL.
  - **`lib/archetype-compat.ts` (new)**: Compatibility algorithm — scores based on nemesis/ally relationship, genre overlap, talent complementarity, evolution connection. Generates dynamic bilingual analysis text.
  - **`components/games/game-card.tsx`**: Added archetype match badges — shows top 2 archetype icons whose genres overlap with the game's genres. Uses `getAllArchetypes()` for matching.
  - **`(main)/explore/[slug]/page.tsx`**: Added "Best for archetypes" section showing top 4 matching archetypes as clickable pills linking to `/archetype/[id]`. CTA changed from `/test` to `/quiz` (works for anonymous users).
  - **`app/page.tsx` (landing)**: Archetype icons now clickable (link to detail pages), added "Browse Games" + "Compatibility" links below main CTA.
  - **i18n**: Added `archetype.*` (18 keys) + `compat.*` (7 keys) to both zh.json and en.json.
  - Build clean, deployed to port 3100

- Phase 33: Questionnaire + Social PK + Daily ranking + Share cards
  - **Questionnaire test (MBTI-style)**: 39 questions (3 per talent), Likert 1-5 scale. `lib/questionnaire.ts` (question bank + `answersToScores()` + `getShuffledQuestions()`), `/quiz/questions/page.tsx` (full UI with progress, auto-advance, dot navigation). Quiz intro `/quiz/page.tsx` now offers dual mode: "Quick Test" (3 games) + "Full Questionnaire (39Q · 5min)". Result page handles both modes.
  - **Social PK system**: `pk_challenges` DB table. Public `/pk` page (select game → play → get share link), `/pk/[id]` page (accept challenge → play same game → compare scores). API: `POST /api/pk` (create), `GET/POST /api/pk/[id]` (get/submit). No auth required — designed for viral sharing.
  - **Daily score ranking**: `GET /api/challenge/daily-ranking` — today's top 20 scores, public. Challenge page now shows daily ranking + PK link + share button.
  - **OG share card**: `GET /api/challenge/card?score=82&talent=reaction_speed&streak=5&name=Player` — Wordle-style 1200×630 image with score grid, rank, streak badge.
  - **Middleware**: Opened `/pk`, `/api/pk`, `/api/challenge/daily-ranking`, `/api/challenge/card` to public access.
  - 114 unit tests passing, build clean, deployed to port 3100

- Phase 34: Viral loop fix + onboarding redesign
  - **OG metadata wired to all shareable pages**: `archetype/[id]/layout.tsx`, `pk/[id]/layout.tsx`, `quiz/result/layout.tsx` now export `generateMetadata()` with dynamic OG images. Social media shares now show personalized preview cards instead of generic "GameTan" text.
  - **New OG card generators**: `GET /api/archetype/card/[id]` (archetype identity card: icon + gradient + name + tagline), `GET /api/pk/card/[id]` (PK challenge card: game icon + creator score + VS + CTA).
  - **Middleware**: Added `/api/archetype/card`, `/api/pk/card` to PUBLIC_PREFIXES.
  - **Registration redirect fixed**: `register-form.tsx` now redirects to `/dashboard?welcome=1` instead of `/test?welcome=1`. Removes 25-min test wall for new users.
  - **Dashboard "no archetype" redesign**: Three lighter paths (Quick Quiz 3min, Questionnaire 5min, Explore First) replace the single 25-min commitment CTA. Welcome banner for `?welcome=1`. Share archetype link for users who have one.
  - **Test page cleanup**: Removed welcome banner logic (migrated to dashboard).
  - **Quick actions updated**: "Full Test" replaced with "PK Challenge", "AI 角色" icon fixed to Bot.
  - **docs/ updated**: `architecture.md` — PK/Quiz/Challenge domains, new OG cards, pkChallenges table, new routes. `decisions.md` — decisions #14-18 (PK no-auth, questionnaire, OG metadata, register redirect, public pages), defensibility score table.
  - 114 unit tests passing, build clean, deployed to port 3100
- Phase 35: Docker OG fix + share URL fix + SEO + i18n
  - **next/og ImageResponse Docker fix**: Root cause was satori's strict JSX validation — mixed text+expression children (e.g. `\u201C{value}\u201D`) create multiple child nodes in a `<div>` without `display: flex`. Fixed all 4 card endpoints (quiz, archetype, challenge, profile) by converting to template literals (`{`\u201C${value}\u201D`}`). All cards now return `image/png` in Docker standalone mode.
  - **Questionnaire share URL fix**: `quiz/result/page.tsx` — questionnaire mode share URL now includes `?mode=q&archetype=id&scores=key:val,...` instead of generic `/archetype/{id}`. Registration CTA moved above fold (after score bars).
  - **Results page i18n**: `(main)/results/page.tsx` — 6 hardcoded Chinese strings replaced with `isZh` bilingual ternaries, date locale respects user language.
  - **SEO metadata**: New layouts for `/explore`, `/community`, `/archetype/compatibility` with OG metadata. New `sitemap.ts` (static pages + 16 archetypes) and `robots.ts`.
  - 114 unit tests passing, build clean, deployed to port 3100

- Phase 36: AI Chat+Voice hardening (dev-cycle Group B review)
  - **`api/chat/route.ts`**: Fixed 6 bare `{error}` responses → `{success:false,error}` envelope (401/400/404/503). Added try-catch around user-tier DB query and partner DB query (previously unguarded — DB failure would crash handler).
  - **`api/partners/init/route.ts`**: Changed 401/503/400 from plain-text `new Response()` to JSON envelopes. Added try-catch around `convertToModelMessages()` which can throw on malformed client messages.
  - **`api/partners/[id]/memory/route.ts`**: Fixed POST's 401/400/404 bare `{error}` → `{success:false,error}` envelope.
  - **`api/voice/stt/route.ts`** + **`api/voice/tts/route.ts`**: Fixed 401 responses to use `{success:false,error}` envelope.
  - **`partner-conversation.tsx`**: Hardcoded English "Partner not found" → bilingual `isZh ? "找不到该角色" : "Partner not found"`.
  - 114 unit tests passing, build clean, deployed to port 3100

- Phase 37: Auth system overhaul — Google OAuth + password reset + account lockout + email verification
  - **Google OAuth**: Manual flow (no next-auth). `GET /api/auth/google` → Google consent → `GET /api/auth/callback/google` → find/create/link user → issue JWT. Handles 3 cases: existing by googleId, existing by email (link), new user (create). CSRF state via cookie.
  - **Password reset**: `POST /api/auth/forgot-password` (rate-limited 3/hr, sends email via Resend, doesn't leak user existence) + `POST /api/auth/reset-password` (validates token, 1hr expiry, resets lockout). UI pages: `/forgot-password`, `/reset-password?token=xxx`.
  - **Account lockout**: 5 failed attempts → 15 min lock. Shows remaining attempts. Resets on success. Login route fully rewritten.
  - **Email verification**: `GET /api/auth/verify-email?token=xxx` → sets emailVerifiedAt → redirect to dashboard.
  - **DB schema**: `googleId`, `avatarUrl`, `failedLoginAttempts`, `lockedUntil` on users table (passwordHash now nullable for OAuth). New `verification_tokens` table.
  - **UI**: Google button on login + register forms, "Forgot password?" link, forgot/reset password pages.
  - **Cookie fix**: `cookies().set()` + `NextResponse.redirect()` are incompatible — must use `response.cookies.set()` on the redirect response directly.
  - 114 unit tests passing, build clean, deployed to Vercel
  - **Google Cloud**: OAuth consent screen published (production mode), project "gametan", callback URI configured.

- Phase 38: Product surgery + test coverage + performance
  - **Test infrastructure**: Vitest integration tests (19 new: login/register/community API routes with Drizzle mock helpers) + Playwright E2E (34 tests against live gametan.ai). Total: 380 unit + 34 E2E = 414 tests.
  - **Product surgery**: Hidden community/marketplace/PK from all navigation (code preserved). Based on product audit: these features had zero engagement, distracted from core loop.
  - **Freemium model**: AI chat opened to free users (5 msgs/day, was fully paywalled). Premium: unlimited.
  - **NPS feedback**: `product_feedback` DB table + `POST /api/feedback` (public) + `NpsPrompt` component (appears 3s after quiz result, 1-10 score + comment, once-per-day).
  - **Chat performance**: Greeting AI deferred 800ms + 2s timeout. Single-partner GET `/api/partners/[id]` (was fetching full list).
  - **Dashboard performance**: All 4 fetches parallelized via Promise.all (was: leaderboard → auth/me waterfall chain). Expected LCP -50%.
  - **Layout performance**: Notification fetch runs on mount only (was per-route-change).
  - **DESIGN.md**: Full design system document extracted from codebase (in `docs/DESIGN.md` per architecture rules).
  - **Valorant quiz**: E2E test confirms full 39-question flow + result works. Unmapped archetypes correctly redirect to generic result.
  - 380 unit tests + 34 E2E passing, build clean, deployed to Vercel

- Phase 39: Product depth — personality matrix + Hall of Fame + region selector
  - **Archetype deep narratives**: 16 archetypes × 4 sections (instinct/behaviors/teamView/growthPath), ~9000 words total bilingual. Integrated into `/archetype/[id]` detail page.
  - **Personality type system (P0)**: 16 Jungian types (no MBTI trademark). `personality-types.ts` (types + gaming descriptions), `personality-archetype-matrix.ts` (algorithmic 256-combo generator: insight/superpower/blindspot), `POST /api/auth/personality`, `PersonalitySelector` component, `users.personality_type` DB column. Settings page integrated.
  - **Pro Player Hall of Fame (P1)**: 80 curated entries across 16 archetypes, 6 regions, multiple games (LoL/CS2/Valorant/Dota2/osu!/PUBG). Bilingual signatures. Integrated into archetype detail page, filtered by region.
  - **Region selector (P2)**: 🇨🇳/🌍 toggle replaces language switcher. Region auto-sets locale, persists to localStorage, exposed via `useI18n()`. Desktop two-button + mobile single-tap.
  - **Roadmap updated**: `docs/roadmap.md` Phase B rewritten with B0-B3 strategy (personality matrix → deep content → Hall of Fame → region).
  - Build clean, deployed to Vercel

### 🔲 Pending
- ~~A1: 云部署迁移~~ ✅ 已完成
- ~~Auth overhaul~~ ✅ 已完成
- ~~A3: 功能精简~~ ✅ 已完成 (community/marketplace/PK hidden)
- **A2: LemonSqueezy 支付** — 峰值变现: 测试结果页直接购买深度报告 (¥29.9). LemonSqueezy store created, identity verification may be complete.
- **游戏数据引擎重构** — 当前游戏数量少,推荐引擎无法有效工作。考虑改为纯静态类型推荐(无需DB)。
- **推荐奖励** — referral 有追踪无奖励,需加 invite→3天Premium 机制
- **产品深度** — 核心循环完整但每个环节深度不足,需加强原型内容+测试体验+AI聊天质量
- **A4: 监控 + CI/CD** — Sentry + GitHub Actions + Vercel auto-deploy

### 🗓️ 中长期路线
- **阶段 B (Month 2-4)**: 游戏专属测试 (病毒传播) + 深度报告 (PDF) + landing page SEO
- **阶段 C (Month 4-8)**: 英文市场 + SEO矩阵 + 邮件营销 + 游戏厂商合作
- **阶段 D (Month 8-12)**: 白标引擎 + UGC测试 + API开放 + 数据变现
