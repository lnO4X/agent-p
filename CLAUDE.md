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
- **会话压缩前**: 必须更新 §7 Current Status。
- **会话压缩后**: 必须读取 §7 Current Status 了解当前进度。
- **中国镜像源**: 所有下载（pip/npm/HuggingFace/Docker）优先使用中国镜像，详见 §6。

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
| **Auth** | `lib/auth.ts`, `middleware.ts` | JWT + captcha, PUBLIC_PATHS 含 `/api/voice/health` |
| **Talent & Games** | `games/*`, `lib/scoring.ts` | 13 game plugins → 13-dim scores → S/A/B/C/D ranks |
| **Archetype** | `lib/archetype.ts` (610行, pure) | 16 archetypes, 改动必查 4 页面 + 2 OG cards |
| **AI Partners** | `lib/partner-prompts.ts`, `components/chat/*` | 五层 prompt, Vercel AI SDK v6, tier-based limits |
| **Voice** | `voice-service/*`, `api/voice/*` | Whisper STT + Edge TTS (Microsoft neural voices), 本机 GPU port 8100 |
| **Billing** | `api/billing/*`, `api/admin/codes/*` | 激活码模式, $4.99/month, Stripe 未接入 |
| **Social** | `api/profile/*`, `api/messages/*` | 公开档案 + Redis 阅后即焚消息 + 排行榜 |

> 设计哲学与历史决策见 `docs/decisions.md`。做产品方向决策时参考。

---

## 5. Environment & Infra

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
```

### Voice Service (Local GPU)
```
voice-service/       Python 3.11 venv, runs on host machine (not Docker)
  .venv/             Python 3.11.9 virtual environment
  server.py          FastAPI: Whisper STT + Edge TTS (Microsoft neural voices) → port 8100
  start.bat          Double-click to start
  requirements.txt   Dependencies (faster-whisper, kokoro, torch cu128)
```

**Start**: `cd voice-service && start.bat` (or `.venv/Scripts/python.exe server.py`)
**GPU**: NVIDIA RTX 5060 Ti 16GB (CUDA capability sm_120, requires PyTorch cu128+)
**Models**: Whisper medium (~1.5GB, float16 CUDA) + Edge TTS (cloud, Microsoft neural voices, free)
**Docker access**: App container reaches voice service via `host.docker.internal:8100`

### Cloudflare Tunnel (`~/.cloudflared/config.yml`)
```
game.weda.ai → http://localhost:3100  (production)
dev.weda.ai  → http://localhost:3001  (dev, optional)
Tunnel: dev-local (ID: e7a5faf4-dad8-4a54-bb7e-3c57be346ed1)
```

### Tech Stack
Next.js 15 (App Router, Turbopack) · TypeScript · PostgreSQL + Drizzle ORM · Redis + ioredis · Vercel AI SDK v6 + OpenRouter · Tailwind CSS v4 + shadcn/ui · Lucide React · Recharts · next/og (ImageResponse) · Zod · Vitest

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
- Phase 10H: Voice infrastructure + deployment — Whisper STT + Kokoro TTS (English + Chinese) running locally on GPU (Python 3.11 venv, PyTorch cu128 for RTX 5060 Ti sm_120). API proxy routes, useVoice hook with health probe.
- Phase 10I: Chat UX overhaul — typing indicator, friendlier error display, mobile layout fix, VoiceButton hidden until voice service deployed
- Phase 10J: WeChat iOS login fix — dual cookie strategy, JWT 30d expiry, remember-username
- Phase 10K: Chat streaming reliability — removed nodeMiddleware, Edge runtime middleware, maxRetries: 3, auto-retry
- Brand: GameTalent → GameTan (unified globally)
- Bilingual: Landing, Quiz, Test Session, Auth forms, Results, Register
- Daily challenge system: fully implemented (13-talent cycle, streak, trend chart)
- Tests: 114 unit tests passing (scoring, game-logic, scorers)
- CLAUDE.md modular split: architecture → docs/architecture.md, decisions → docs/decisions.md
- Phase 10L: Voice UX redesign — Chinese TTS (multi-language Kokoro pipelines with auto-detection), STT auto-send (voice→transcribe→send, no manual click), per-message 🔊 TTS buttons, auto-play TTS when last input was voice
- Phase 10M: Voice quality upgrade — Kokoro TTS → Edge TTS (Microsoft neural voices, free, much better prosody). STT fix: explicit `task="transcribe"` prevents Whisper from translating Chinese→English. Auto-play toggle (localStorage-persisted, Volume2/VolumeX icon in chat nav). Audio format: WAV → MP3. Removed Kokoro/numpy/soundfile/cn2an/jieba deps.

### 🔲 Pending
- Crawler automation (code exists in `lib/crawlers/`, no scheduler yet)
- Stripe/payment integration (future phase)
- Referral system (referralCode field exists, not implemented)
- Email notifications (schema ready, not activated)
- Challenge leaderboard + streak rewards
- Backfill cron utility exists at `/api/cron/backfill-archetypes`
