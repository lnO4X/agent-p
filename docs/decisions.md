# Design Philosophy & Key Decisions

> Extracted from CLAUDE.md. Rarely changes. Agent reads when making product/design decisions.

---

## Design Philosophy

**Core insight** (16personalities.com, Wordle, Character.AI):
> Tests can be boring, but results must create identity. 200M users share "I'm INFJ" — because results define "who I am".

**5 Rules**:
1. **10-second hook** — First screen makes you want to try immediately
2. **Result = Identity** — Share "I'm a Duelist" not "78 points"
3. **Zero friction** — No registration, 3 minutes to complete
4. **Natural virality** — Results are social currency
5. **Radical simplicity** — One core loop, done perfectly

**Growth Flywheel**: Quiz (free) -> Archetype reveal -> Content depth -> Share -> Friend tests -> Register -> Premium report

**Strategic pivot (2026-03)**: GameTan = 玩家身份系统，不是游戏平台。
- 核心资产: 16 原型 IP + 13维天赋引擎 + 身份认同
- 变现: 峰值变现 (测完买报告) > 订阅 (需留存支撑)
- 增长: SEO 内容矩阵 (96+ 原型子页面) + 游戏专属测试 (病毒传播)
- 不做: 开源游戏 Arcade, 与 Steam/Poki/Character.AI 正面竞争
- 详见: `docs/roadmap.md`

---

## Key Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | 4-tab over 6-tab | Reduce cognitive load. Play merges explore/test/challenge |
| 2 | All-in AI companions | Highest asset value. Talent data = unique differentiation vs Character.AI |
| 3 | Archetype over raw scores | 16personalities model. Identity drives sharing, not numbers |
| 4 | 3-game public quiz | Zero-friction entry. Client-side scoring. URL-encoded stateless sharing |
| 5 | Character presets > blank creation | Users don't create well from scratch. Gallery enables one-click |
| 6 | Partner restrictions removed | Characters can have flaws, attitudes, tempers — diverse personalities |
| 7 | Identity-driven dashboard | Archetype card > game catalog. Emotion > utility |
| 8 | Activation codes > Stripe | Phase simplicity. Stripe deferred to future phase |
| 9 | OG cards via next/og | Server-side ImageResponse, zero external dependency |
| 10 | Brand: GameTan | Unified globally (layout, i18n, manifest, OG cards, prompts, auth forms) |
| 11 | Captcha one-time use | Deleted after ANY verification attempt. Auto-refresh on failure |
| 12 | Local GPU over Docker for voice | RTX 5060 Ti direct access, avoids Docker CUDA complexity |
| 13 | China mirror sources | Architecture requirement: all downloads (pip/npm/HuggingFace) must use mirrors |
| 14 | Public PK with no auth | Viral sharing requires zero friction. nanoid(10) short URLs. No login wall |
| 15 | 39Q questionnaire as quiz alternative | Some users prefer MBTI-style questions over mini-games. 5 min vs 25 min |
| 16 | OG metadata on all shareable pages | Viral loop was broken: cards existed but weren't wired to page metadata. Phase 34 fix |
| 17 | Register → dashboard, not test | 25-min test wall after signup = massive drop-off. 3 lighter paths instead |
| 18 | Archetype pages public | /archetype, /archetype/[id], /explore all public. SEO + sharing + reduce login walls |
| 19 | Identity system > game platform | GameTan 的核心价值是"玩家身份"不是"游戏平台"。不引入开源游戏做 Arcade，聚焦原型内容深度+SEO+峰值变现 |
| 20 | Cloud migration (Vercel+Neon+Upstash) | 本机运行 = 单点故障 + 无法扩展。免费层够 MVP，月费 <$20 |
| 21 | Peak monetization > subscription | 16personalities 模型: 测完情绪高峰时卖深度报告 (¥29.9), 转化率远高于冷启动订阅 |
| 22 | Voice service suspended | GPU 云托管贵 ($0.75/hr), 语音不是核心。阶段 C 有留存数据再决定 |
| 23 | Game-specific quizzes | "你是哪个 Valorant 特工" 比 "你是什么玩家" 更有传播力。复用天赋引擎，零新 mini-game |

---

## Defensibility Score (Phase 36)

**Framework**: 8 dimensions, 0-2 each, max 16.

| Dimension | Score | Notes |
|-----------|-------|-------|
| Network effects | 1 | PK system + community posts. No strong lock-in yet |
| Data moat | 1 | Talent profiles + game scores. Growing but small base |
| Workflow depth | 1 | Quiz → archetype → share. Dashboard redesign adds paths |
| Switching cost | 1 | AI partner memories + identity attachment |
| Content/community | 1 | Community posts, archetypes as culture. Early stage |
| Brand identity | 1 | "Gaming MBTI" positioning clear. gametan.ai |
| Technical edge | 0.5 | 13-game talent measurement unique but replicable |
| Distribution | 0.5 | OG cards wired to all shareable pages, SEO sitemap+robots |
| **Total** | **7/16** | |

**Phase A-B target: 10/16** via:
- Content/community: 1→2 (96 archetype content pages, SEO matrix)
- Distribution: 0.5→1.5 (game-specific quizzes, SEO traffic, cloud uptime)
- Workflow depth: 1→1.5 (premium report at peak engagement)
- Brand identity: 1→1.5 (archetype culture depth, 16personalities-level content)

**Key strategic shift**: Stop expanding breadth (more features). Go deep on identity content + distribution.
