
> 详细 Phase 历史见 `docs/changelog.md`。下面只保留当前工作状态。

### ✅ Completed (Phases 1-42, see docs/changelog.md)
- Core: 13 games, 16 archetypes, AI partners, quiz funnel, 256 personality×archetype SEO pages
- Auth: Google OAuth, password reset, account lockout, email verification
- Infra: Vercel + Neon PG + Upstash Redis, Cloudflare tunnel, 380 unit + 34 E2E tests
- Growth: Referral system, NPS feedback, social share cards, embeddable widget, AdSense prep
- i18n: Browser language detection, DEFAULT_LOCALE=en, `<html lang>` dynamic, keywords English-only
- Sharing: `&own=1` URL param distinguishes own vs shared results, confetti gated
- Design: DESIGN.md finalized (teal+gold, dark-first, DM Sans+Outfit), competitive research done
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

- Phase 40: Product surgery + free model + landing page redesign
  - **Product surgery**: Hidden community/marketplace/PK from all navigation (code preserved). Freemium: AI chat 5 msgs/day free.
  - **NPS feedback**: `product_feedback` table + `POST /api/feedback` + NpsPrompt component (quiz result, once/day).
  - **Chat perf**: Greeting AI deferred 800ms + 2s timeout. Dashboard fetches parallelized.
  - **Landing page**: 6-section redesign (hero → what you get → archetypes → how it works → stats → CTA). Dual CTA with "完全免费" badges.
  - **Free model**: Removed premium CTA from results/chat/me pages. LemonSqueezy product created ($3.99) but UI hidden.
  - **Locale auto-detect**: Browser language detection (was hardcoded zh). English users see English by default.

- Phase 41: SEO + viral sharing + retention + performance
  - **256 personality×archetype SEO pages**: `/archetype/[id]/personality/[typeId]` with generateStaticParams (256 combos) + 16 personality index pages. Sitemap 91 → 363 URLs. Google Search Console submitted, 363 pages discovered.
  - **Viral sharing**: Large gradient share button on result page + Web Share API + "Challenge a Friend" invite card. Share button on archetype detail. Bilingual share text.
  - **AI coach×archetype**: System prompt includes user's archetype strengths/weakness/nemesis/ally. Coaching instructions for targeting weak talents.
  - **Daily challenge weakness bias**: 40% chance daily challenge targets user's weakest talent.
  - **Referral rewards**: 1+ successful referrals → 15 msgs/day chat (was 5).
  - **Performance**: games/catalog in-memory cache (0.3s cached vs 4.8s). CDN caching on OG cards (24hr), daily ranking (5min), profile cards (1hr).
  - 380 unit tests passing, build clean, deployed to Vercel

- Phase 42: Analytics + evolution tracker + embed + AdSense
  - **Vercel Analytics events**: 7 funnel points (quiz_start, quiz_complete, share_click, register, chat_start, archetype_view, personality_combo_view).
  - **Evolution tracker**: `GET /api/talent-history`, `EvolutionTracker` component (SVG line chart, per-talent deltas, "You've evolved!" banner), integrated into dashboard + me page.
  - **Embeddable quiz widget**: `/embed/quiz` (dark theme, 4 phases), `/embed` (docs + preview), `public/embed.js` (573 bytes), `?ref=embed` tracking.
  - **AdSense prep**: `ads.txt`, `AdSlot` component (invisible when no pub ID), slots in result/archetype/explore. Conditional script in layout.
  - **Social distribution**: `docs/social-posts.md` — ready-to-post for Reddit, 知乎, Discord, Twitter/X, 小红书.
  - Build clean, deployed to Vercel

### 🔲 Pending — 🔴 立即执行：应用新设计系统

- **🔴 应用 DESIGN.md 到代码** — 新设计系统已定稿（根目录 `DESIGN.md`），基于 5 个美国游戏产品研究。需要修改：
  - `globals.css` — 替换所有 OkLCH 颜色变量：紫色→青绿 #00D4AA，新增金色 #FFB800，暗色背景 #0F1117
  - `layout.tsx` — 替换 Geist Sans → DM Sans（next/font/google），保留 Outfit + Geist Mono
  - 所有组件 — 紫色 primary → 青绿，CTA 按钮 → 金色，暗色为默认主题
  - `page.tsx` (landing) — 移除粉色渐变背景，改用暗色主题
  - 预览页在 `.gstack/design-preview.html`，可作为视觉参考
  - **预计影响 15-20 个文件，建议新会话集中执行**

### 🔲 Pending — 核心体验

- **🔴 游戏不好玩** — 创始人测试后认为13款小游戏更像"测试工具"。三条路径待决策：
  - A: 精简到最好玩的 3 个 + 加音效/粒子/连击
  - B: 纯问卷模式（像 16personalities）
  - C: 1 个深度综合游戏（像 Aim Lab）

### 🔲 Pending — 其他

- **社交分发** — `docs/social-posts.md` 已写好 6 平台内容，需手动发布
- **等 SEO 索引** — 363 页已被 Google 发现，等 1-2 周索引
- **观察 Analytics** — 自建事件追踪已上线，admin dashboard 有 Event Analytics 面板
- **Google AdSense** — 广告位已就绪（invisible），设置 `NEXT_PUBLIC_ADSENSE_ID` 即激活

### ✅ 本会话完成 (2026-03-27)

- **i18n 修复 (已部署)**: `<html lang>` 从 `zh-CN` 改为动态检测（默认 `en`）、`DEFAULT_LOCALE` 从 `zh` 改为 `en`、keywords 改纯英文。363 个 SEO 页面现在被 Google 正确识别为英文。
- **共享视图检测 (已部署)**: Quiz result 页面通过 `&own=1` URL 参数区分自己的结果 vs 朋友分享的结果。共享视图显示 "A friend's result" + quiz CTA；自己的结果显示 "Your Gamer Archetype" + 注册 CTA。Confetti 和 analytics 只在自己完成测试时触发。
