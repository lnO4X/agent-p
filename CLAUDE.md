# GameTan — 电竞天赋测试

**Brand**: GameTan (gametan.ai)
**定位**: 电竞天赋测试 — esports talent detection（不是性格问卷）
**核心循环**: 3 Mini-Games → 天赋分数 + 职业对比 → Share → Register → Premium report
**变现**: 峰值变现（测完买深度报告 ¥29.9）> 订阅

3 mini-games测量真实游戏天赋，与职业选手基准对比。16 archetypes (弱化为次要标签)。96+ SEO pages。See `docs/roadmap.md` for full plan.

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

### 3.4 UI Patterns — see `DESIGN.md` for full design system

- **Design system**: Read `DESIGN.md` before ANY visual/UI change. Dark-first, teal #00D4AA primary, gold #FFB800 CTA.
- **Icons**: Lucide React ONLY — no emoji in UI (archetype icons are the exception, stored as data not UI)
- **Colors**: OkLCH color space. Teal primary, gold accent. NO purple (AI slop signal).
- **Fonts**: DM Sans (body) + Outfit (display) + Geist Mono (data). Chinese fallback: PingFang SC.
- **Radius**: sm:6px, md:10px, lg:14px, full:9999px
- **Interaction**: `.pressable` class for `active:scale(0.97) + opacity 0.88`
- **Glass nav**: `.glass-nav` for `backdrop-filter: blur(20px) saturate(180%)`
- **CTA hierarchy**: Gold `bg-accent` (1 per screen max) > Teal `bg-primary` > Outline > Ghost
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

### 3.7 Gotchas (踩坑记录)

| 问题 | 根因 | 解法 |
|------|------|------|
| **Neon DB 日期参数 500** | `db.execute(sql\`... >= ${new Date()}\`)` — Neon 不接受 JS Date 对象作为参数，会报 `Failed query ... params: Tue Feb 24...` | 必须用 `.toISOString()` 转字符串 + SQL 里加 `::timestamp` cast |
| **drizzle db.execute() 返回格式不确定** | 可能返回数组 `[{...}]` 或 `{rows:[{...}]}`，取决于 drizzle/postgres.js 版本 | 用安全解包: `Array.isArray(r) ? r : r.rows ?? []` |
| **next/og ImageResponse Docker 崩溃** | satori 严格 JSX 验证 — `<div>` 里混合文字+表达式子节点（如 `"{value}"` 会创建多个子节点）在没有 `display:flex` 时报错 | 全部改用模板字符串 `` {`"${value}"`} `` |
| **cookies().set() + redirect() 不兼容** | Next.js 里 `cookies().set()` 和 `NextResponse.redirect()` 不能同时用 | 必须用 `response.cookies.set()` 在 redirect response 上直接设置 |
| **Vercel Analytics 自定义事件需要 Pro** | 免费版只有 page views，custom events 需要 $20/月 Pro plan | 自建: `POST /api/analytics` + `analytics_events` 表 + `lib/analytics.ts` (sendBeacon) |
| **Promise.all 一个失败全部失败** | admin dashboard 3 个 API fetch 用 Promise.all，一个 500 导致全部数据丢失 | 每个 fetch 包 `.catch(() => ({success:false}))` 独立处理 |
| **默认语言硬编码中文** | `DEFAULT_LOCALE = "zh"` 且没检测浏览器语言 | ✅ 已修复: DEFAULT_LOCALE="en", `<html lang>` 动态化, keywords 纯英文 |

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
| **Billing** | `api/billing/*`, `api/webhooks/lemonsqueezy/*`, `me/report/*` | LemonSqueezy: Deep Report $3.99 (已发布) + Premium $4.99/mo (TODO). 激活码仍可用 |
| **Social** | `api/profile/*`, `api/messages/*` | 公开档案 + Redis 阅后即焚消息 + 排行榜 |
| **Referral** | `api/referral/*`, `api/cron/backfill-referral-codes/*` | 8-char codes, referrals tracking table, Me page card |
| **Crawlers** | `lib/crawlers/*`, `api/cron/crawl-games/*` | Firecrawl-based Steam/TapTap game crawlers |
| **Email** | `lib/email/*`, `api/cron/email-digest/*` | Resend API (gametan.ai, Tokyo), weekly digest, streak milestones |
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
dev.gametan.ai → http://localhost:3001  (dev, optional)
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

> 详细 Phase 历史见 `docs/changelog.md`。下面只保留当前工作状态。

### ✅ Completed (Phases 1-42, see docs/changelog.md)
- Core: 13 games, 16 archetypes, AI partners, quiz funnel, 256 personality×archetype SEO pages
- Auth: Google OAuth, password reset, account lockout, email verification
- Infra: Vercel + Neon PG + Upstash Redis, Cloudflare tunnel, 380 unit + 34 E2E tests
- Growth: Referral system, NPS feedback, social share cards, embeddable widget, AdSense prep
- i18n: Browser language detection, DEFAULT_LOCALE=en, `<html lang>` dynamic, keywords English-only
- Sharing: `&own=1` URL param distinguishes own vs shared results, confetti gated
- Design: DESIGN.md finalized (teal+gold, dark-first, DM Sans+Outfit), competitive research done
### ✅ Phase 43: DESIGN.md → 代码 (完成)

- ✅ `globals.css` — OkLCH 颜色替换（紫→青绿+金色，暗色/亮色双主题）
- ✅ `layout.tsx` — Geist Sans → DM Sans, `class="dark"` SSR 默认, 暗色优先逻辑
- ✅ `page.tsx` — CTA 按钮改金色 `bg-accent`
- ✅ 18 个组件 — 紫色 class → `text-primary`/`bg-primary` (全部替换)
- ✅ build 通过 + Vercel 部署

### ✅ Phase 44: 产品重定位 — 电竞天赋检测 (完成)

- ✅ Landing/Quiz/Result 页面 → 天赋检测定位 + 职业选手对比
- ✅ Pro benchmarks 数据层 + 天赋等级系统 (pro-elite/pro-level/pro-potential/above-average/developing)
- ✅ Hall of Fame: 80+ 职业选手映射到原型

### ✅ Phase 45: 产品聚焦 — 砍掉噪音 (完成)

- ✅ 导航 Partners → Coach (天赋教练)
- ✅ 删除: marketplace、community、character-presets、MBTI选择器、39题问卷入口
- ✅ Dashboard: 删除AI Characters区块/问卷卡片，文案对齐天赋检测
- ✅ Weda → GameTan 品牌 (教练重命名、email domain)
- ✅ SEO metadata: "Discover Your Gaming DNA" → "Test Your Esports Talent"
- ✅ 全站文案统一为天赋检测语言
- ✅ build + 374 tests 通过

### 🔲 Pending

- **游戏不好玩** — 13 款小游戏像测试工具。待决策：A) 精简 3 个+音效 B) 纯问卷 C) 单个深度游戏
- **社交分发** — `docs/social-posts.md` 6 平台内容待发布
- **SEO 索引** — 363 页已被 Google 发现，等索引
- **AdSense** — 设置 `NEXT_PUBLIC_ADSENSE_ID` 即激活

### 📊 数据 (2026-03-27)

| 日活 | 页面浏览 | 跳出率 | SEO页面 | 注册 |
|------|---------|--------|---------|------|
| 30 | 519 | 77% | 363 | 7 |

### 🗓️ 路线

1. **现在**: 应用 DESIGN.md（进行中）→ build → deploy
2. **然后**: 游戏设计方向决策
3. **同时**: 社交帖子分发
4. **1-2周后**: SEO 流量 + 用户反馈 → 调整
