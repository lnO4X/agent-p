# GameTan 全盘开发计划

> 最后更新: 2026-03-21 | 阶段: 从本地原型 → 云端产品

---

## 战略定位（已确认）

**GameTan = 玩家身份系统，不是游戏平台。**

对标 16personalities.com（200M 用户），不是 Steam/Poki/Character.AI。

核心资产:
1. 16 原型 IP（独创，不可复制）
2. 13 维天赋测量引擎（心理测量基础）
3. "我是决斗者" 的身份认同（社交货币）

核心循环: **测试 → 身份 → 内容 → 分享 → 回流**

变现模型: **峰值变现**（测完立刻卖深度报告）> 订阅（需要留存支撑）

---

## 全局里程碑

```
            本地原型                    云端产品                 增长引擎                规模化
        ──────────────           ──────────────           ──────────────          ──────────────
阶段 A:  基础加固 + 上云         阶段 B: 身份内容深度        阶段 C: 分发 + 增长       阶段 D: 平台化
(1-2 月)                      (2-4 月)                   (4-8 月)                (8-12 月)
├─ 云部署迁移                  ├─ 原型深度内容(AI生成)      ├─ 英文市场(10x)          ├─ 白标测试引擎
├─ Stripe 支付                ├─ 游戏专属测试              ├─ SEO 内容矩阵           ├─ 用户生成测试
├─ 精简功能集                  ├─ 峰值变现:深度报告          ├─ 社媒自动化分发          ├─ API 开放
├─ 核心体验打磨                ├─ 数据结构化(JSON-LD)       ├─ 邮件营销漏斗           ├─ B2B(游戏厂商)
└─ 监控 + CI/CD              └─ 互动内容(投票/排行)        └─ 游戏厂商合作           └─ 数据变现
```

---

## 阶段 A: 基础加固 + 上云 (Month 1-2)

**目标**: 从个人电脑跑的原型 → 可以不关机、有支付、能监控的云端产品

### A1: 云部署迁移

**当前问题**: 所有服务跑在 Windows 本机，Cloudflare tunnel 暴露。电脑关机 = 服务挂。

**目标架构**:
```
                    Cloudflare (DNS + CDN)
                           │
                    ┌──────▼──────┐
                    │   Vercel    │  ← Next.js (免费层够用)
                    │   App       │     自动 CI/CD, 边缘网络
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──┐  ┌──────▼──┐  ┌─────▼─────┐
       │  Neon   │  │ Upstash │  │ OpenRouter│
       │  PG     │  │ Redis   │  │ AI API    │
       │ (free)  │  │ (free)  │  │ (pay/use) │
       └─────────┘  └─────────┘  └───────────┘
```

| 组件 | 当前 | 迁移到 | 费用 | 理由 |
|------|------|--------|------|------|
| Next.js App | 本机 Docker :3100 | **Vercel** (Hobby) | $0 → $20/mo | Next.js 原生平台, 自动部署, 边缘CDN, 零运维 |
| PostgreSQL | 本机 Docker :5433 | **Neon** (free tier) | $0 → $19/mo | Serverless PG, 自动备份, 0.5GB free |
| Redis | 本机 Docker :6379 | **Upstash** (free tier) | $0 → $10/mo | Serverless Redis, 10K cmd/day free |
| Voice STT/TTS | 本机 GPU :8100 | **降级/移除** | - | 见下方分析 |
| Domain | gametan.ai (tunnel) | gametan.ai (Vercel) | $0 | DNS 指向 Vercel |
| Tunnel | cloudflared | 不需要 | -$0 | Vercel 自带域名 |

**Voice 服务决策** ⚠️ 战略问题:
- 语音聊天是 AI 角色功能的增强，但 AI 角色本身不是核心产品
- 云端 GPU (A10G) 约 $0.75/hr，Whisper API (OpenAI) 约 $0.006/min
- **建议**: Phase A 暂停 Voice，Phase C 如果 AI 角色有留存数据再决定是否恢复
- **替代**: 用 OpenAI Whisper API ($0.006/min) 替代本地 GPU（按用量付费，低量时更便宜）

**迁移步骤**:
1. Neon 创建 PG 实例 → `pg_dump` 导出 → `pg_restore` 导入 → 更新 DATABASE_URL
2. Upstash 创建 Redis → 更新 REDIS_URL (rate limiting + sessions 会自动重建)
3. Vercel 连接 GitHub repo → 配置环境变量 → 部署
4. Cloudflare DNS: gametan.ai CNAME → Vercel
5. 验证所有 API 端点 + OG cards + Auth flow

### A2: Stripe 支付集成

**当前**: 激活码模式（手工生成，手工分发）
**目标**: 自助支付，用户测完直接购买

**两种变现模型并行**:

| 模型 | 价格 | 触发点 | 内容 |
|------|------|--------|------|
| **深度报告** (一次性) | ¥29.9 / $4.99 | 测试结果页 | 20页PDF: 天赋详解+游戏推荐+进化路径+兼容性 |
| **Premium 订阅** (月付) | ¥29.9 / $4.99/mo | 设置页/AI角色 | AI 无限聊天 + 高级原型内容 + 排行榜标记 |

**峰值变现** 是核心——用户测完、看到原型、情绪最高涨的那一刻 = 转化率最高。

**技术实现**:
- Stripe Checkout (hosted page, 最简集成)
- Webhook → 更新 user tier / 生成报告
- 报告生成: React → PDF (react-pdf) 或 HTML → Puppeteer PDF

### A3: 功能精简（减法）

**原则**: 核心产品 = 测试 + 结果 + 原型内容 + 支付。其他都是噪音。

| 功能 | 决策 | 理由 |
|------|------|------|
| 测试 (Quiz/Questionnaire) | ✅ 保留，核心 | 入口 |
| 原型系统 | ✅ 保留，核心 | IP 资产 |
| 游戏浏览 (Explore) | ✅ 保留，降权 | SEO 价值，但不是主推 |
| AI 角色聊天 | ⚠️ 保留，观察 | 可能有留存价值，但 OpenRouter 成本需监控 |
| 语音聊天 | ❌ 暂停 | 依赖 GPU，用量极低，可后期恢复 |
| 社区帖子 | ⚠️ 简化 | 低用量时反而显空，考虑合并到原型页评论 |
| PK 挑战 | ✅ 保留 | 病毒传播工具，零成本 |
| 消息系统 | ❌ 降优先级 | 无用户量时无意义 |
| 排行榜 | ✅ 保留 | 竞争驱动，低成本 |
| Steam 导入 | ⚠️ 保留 | 数据价值，但非核心流程 |

### A4: 监控 + CI/CD

- **Vercel Analytics** (free): 页面访问量、Web Vitals
- **Sentry** (free tier): 错误追踪
- **Uptime Robot** (free): gametan.ai 可用性监控
- **GitHub Actions**: PR → build + test → Vercel preview deploy
- **Drizzle migrations**: 从 `drizzle-kit push` 切换到 `drizzle-kit generate` + `migrate` (生产环境不能用 push)

---

## 阶段 B: 身份内容深度 (Month 2-4)

**目标**: 每个原型从"一段描述" → "一个世界"。对标 16personalities 每个类型 5000+ 字。

### B0: 性格类型 × 原型矩阵 (P0 — 最高优先级)

**核心决策**: 集成 16 性格类型（Jungian types, 非 MBTI 商标），创建 16×16=256 种组合。

**法律要点**:
- "MBTI" 和 "Myers-Briggs" 是注册商标，**绝不使用**
- 四字母代码 (INTJ, ENFP 等) 来自荣格公共域理论，可自由使用
- 品牌名称: **"玩家性格分析 / Player Personality Profile"**
- 问卷使用 IPIP 公共域题目 (ipip.ori.org)，或用户自选已知类型

**数据架构**:
```
用户自选性格类型 → 存入 user profile
16 原型 × 16 性格类型 = 256 种组合
每种组合 = 独特描述 + 游戏行为分析 + 推荐调整
```

**页面结构**:
| 页面 | URL | 内容 |
|------|-----|------|
| 性格选择 | `/personality` | 用户选择/测试性格类型 |
| 组合详情 | `/archetype/[id]/personality/[type]` | 256 个独特页面 |
| 我的完整画像 | `/me/profile` | 原型 + 性格 + 天赋 综合视图 |

**SEO 价值**: 256 个长尾页面 (e.g. "INTJ 闪电刺客 游戏风格")

### B1: 原型深度内容页 (已部分完成)

每个原型 (16个) 的子页面:

| 页面 | URL | 状态 |
|------|-----|------|
| 总览 | `/archetype/duelist` | ✅ 已有 + 深度叙事 (4 章节) |
| 游戏推荐 | `/archetype/duelist/games` | 🔲 待建 |
| 关系指南 | `/archetype/duelist/relationships` | 🔲 待建 |
| 进化路径 | `/archetype/duelist/growth` | 🔲 待建 |
| 名人堂 | `/archetype/duelist/hall-of-fame` | 🔲 待建 (P1) |

### B2: 原型名人堂 (P1 — 职业选手/主播映射)

**设计原则**: 手动策展 + 管理后台可更新（非硬编码）

**数据结构**:
```typescript
interface ProPlayer {
  id: string;
  name: string;           // 显示名
  nameEn: string;
  game: string;           // 主要游戏
  role: string;           // "职业选手" | "主播" | "内容创作者"
  region: "cn" | "kr" | "na" | "eu" | "sea" | "global";
  archetypeId: string;    // 映射到哪个原型
  signature: string;      // 标志性特点 (zh)
  signatureEn: string;
  imageUrl?: string;
}
```

**初始数据**: 每原型 3-5 人，覆盖 CN + Global = ~80 条记录
**更新机制**: Admin API 管理，无需改代码 → 长期可维护
**展示**: 原型详情页 "名人堂" 区域 + 独立 `/hall-of-fame` 页

### B3: 地区选择器 (P2)

**右上角**: 🇨🇳 中国 | 🌍 Global (替代纯语言切换)
- 地区决定: 语言 + 职业选手推荐 + 游戏偏好
- 存储: localStorage + user profile
- 影响: 名人堂显示、游戏推荐排序、内容本地化

### B2: 游戏专属测试 (病毒传播引擎)

**核心洞察**: "你是什么类型的玩家" 太泛。"你是哪个英雄联盟英雄" 更具体、更有传播力。

| 测试 | 映射逻辑 | 传播场景 |
|------|---------|---------|
| "你是哪个 Valorant 特工？" | 天赋 → 特工角色 | FPS 玩家群 |
| "你是哪个宝可梦训练家？" | 天赋 → 训练家类型 | 泛玩家 |
| "你的 MOBA 位置是什么？" | 天赋 → 上中下野辅 | MOBA 玩家群 |
| "你是什么 Minecraft 玩家？" | 天赋 → 建造/探索/PVP/红石 | MC 社区 |
| "你的游戏年龄是多少？" | 天赋 → "游戏心理年龄" | 趣味传播 |

**技术**:
- 复用现有天赋引擎 (13维分 → 映射到具体角色)
- 每个专属测试 = 一个配置文件 (角色列表 + 映射规则 + OG 卡片模板)
- 不需要新 mini-game，用同一个测试/问卷，换结果映射
- URL: `/quiz/valorant`, `/quiz/pokemon`, etc.

### B3: 深度报告 (变现产品)

**16personalities 的 Premium Profile 售价 $50-80，转化率约 5-10%。**

GameTan 深度报告内容 (PDF/网页):
1. 你的天赋雷达图 (13维 detailed)
2. 你的原型完整分析 (2000字)
3. 你的 Top 10 推荐游戏 (基于天赋+偏好)
4. 你的原型关系图谱 (克星/盟友/进化)
5. 你的游戏风格进化建议
6. 你的兼容性速查表 (与 16 原型)

**定价**: ¥29.9 (中国) / $4.99 (海外) — 比 16personalities 低很多，因为品牌力弱

### B4: 互动内容 (UGC 轻量版)

- **原型投票**: "闪电刺客 vs 决斗者 谁更强？" — 实时投票 + 结果分享
- **原型排行**: 各原型的全站人数统计，"决斗者是第3多的原型"
- **每周话题**: "本周最强原型" — 基于挑战分数的原型排行

---

## 阶段 C: 分发 + 增长 (Month 4-8)

**目标**: 从"做出来了" → "有人用了"

### C1: 英文市场

- 所有内容已经双语 ✅
- 英文 SEO 着陆页 (archetype content in English)
- 英文市场 = 10x 中文市场 (addressable audience)
- Reddit/Twitter/TikTok 分发 (英文内容)

### C2: SEO 内容矩阵

```
                    gametan.ai
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    /archetype/*    /quiz/*         /blog/*
    (96 pages)     (5-10 quizzes)  (weekly articles)
         │               │               │
    "决斗者推荐游戏"   "你是哪个特工"    "2025最强原型排行"
    长尾SEO           社媒传播          新闻+趋势
```

- **Blog**: AI 生成 + 人工编辑的周更文章
- **Schema markup**: FAQ, HowTo, Article — Google Rich Snippets
- **Internal linking**: 所有页面互相链接 (原型↔游戏↔测试↔博客)

### C3: 社媒自动化

- **OG 卡片已就绪** ✅ — 确保每次分享都有精美预览
- **Twitter/X Bot**: 每日发布 "今日最强原型" + 原型趣味对比
- **短视频脚本**: AI 生成原型介绍短视频脚本 → 发 TikTok/Bilibili
- **KOL 合作**: 游戏主播测试 → 分享结果 → 粉丝跟测

### C4: 邮件营销漏斗

```
注册 → 欢迎邮件 (原型介绍)
Day 3 → "你的原型克星是谁？" (回流)
Day 7 → "本周你的原型排名" (社交比较)
Day 14 → "深度报告限时优惠" (变现)
Day 30 → "新测试上线" (再激活)
```

- Resend API 已集成 ✅
- 需要: 邮件模板系统 + 发送队列 + 用户分组

### C5: 游戏厂商合作

- **价值主张**: "我们有 X 万玩家的天赋画像数据，可以帮你精准推荐"
- **合作模式**: 游戏厂商付费在 "推荐游戏" 里置顶 / 投放测试
- **前提**: 需要先有用户量 (>10K MAU)

---

## 阶段 D: 平台化 (Month 8-12)

**前提**: 已验证 PMF，MAU > 10K，有付费用户

### D1: 白标测试引擎

- 游戏厂商/媒体可以嵌入 GameTan 测试到自己的网站
- `<iframe src="gametan.ai/embed/quiz/valorant">`
- 厂商自定义品牌色 + 结果页
- 按测试次数收费

### D2: 用户生成测试

- 允许用户创建自己的 "你是哪个 XXX" 测试
- 复用天赋引擎 + 自定义映射
- UGC 内容 = 免费增长引擎

### D3: API 开放

- `GET /api/v1/archetype/:id` — 原型数据
- `POST /api/v1/analyze` — 天赋分 → 原型
- 第三方 app 集成 (Discord bot, Twitch extension)

### D4: 数据洞察 (B2B)

- 玩家画像报告 (聚合匿名数据)
- "FPS 玩家的天赋分布" / "RPG 玩家 vs MOBA 玩家"
- 游戏厂商/投资人/媒体购买

---

## 成本估算

### 阶段 A-B (Month 1-4) — 极低成本启动

| 项目 | 月费 | 说明 |
|------|------|------|
| Vercel Hobby | $0 | 100GB 带宽，够用 |
| Neon Free | $0 | 0.5GB storage, 够 MVP |
| Upstash Free | $0 | 10K cmd/day |
| OpenRouter | ~$5-20 | AI 聊天按用量 |
| Resend | $0 | 3K emails/month free |
| Domain | $0 | gametan.ai |
| **Total** | **$5-20/mo** | |

### 阶段 C (Month 4-8) — 有用户后

| 项目 | 月费 | 触发条件 |
|------|------|---------|
| Vercel Pro | $20 | 带宽超 100GB |
| Neon Launch | $19 | 数据超 0.5GB |
| Upstash Pro | $10 | 请求超 10K/day |
| Sentry | $0-26 | 错误量 |
| **Total** | **$50-80/mo** | |

### 收入预测 (保守)

| 阶段 | MAU | 转化率 | 月收入 |
|------|-----|--------|--------|
| A (Month 2) | 100 | 5% | ¥150 ($20) |
| B (Month 4) | 1,000 | 5% | ¥1,500 ($200) |
| C (Month 8) | 10,000 | 3% | ¥9,000 ($1,200) |
| D (Month 12) | 50,000 | 2% | ¥30,000 ($4,000) |

*基于深度报告 ¥29.9 单次购买，转化率随规模递减*

---

## 关键指标 (North Star Metrics)

| 阶段 | 北极星指标 | 目标 |
|------|-----------|------|
| A | 测试完成数/周 | 50+ |
| B | 深度报告购买率 | >3% |
| C | 自然搜索流量/月 | >5,000 |
| D | 月活跃用户 (MAU) | >50,000 |

**每个阶段只看一个指标**，不分散注意力。

---

## 关于"引入开源游戏"的最终结论

| 场景 | 做/不做 | 理由 |
|------|---------|------|
| 替换弱 mini-game (塔防/协作模拟) | ✅ 可做,低优先 | 提升测试体验质量 |
| 新增 Arcade 休闲区 | ❌ 不做 | 偏离核心定位，与巨头竞争 |
| 游戏专属测试 (Valorant quiz) | ✅ 高优先 | 复用引擎，病毒传播 |
| 社区游戏推荐+评论 | ⚠️ 阶段C再做 | 需要用户基数 |

---

## 技术债清单 (阶段 A 顺带解决)

| 债务 | 影响 | 修复 |
|------|------|------|
| `drizzle-kit push` 用于生产 | 数据丢失风险 | 切换到 `generate` + `migrate` |
| OG cards 全部需要 Docker fix | 已修复 ✅ | 迁移 Vercel 后自动解决 |
| 无错误追踪 | 线上问题盲区 | Sentry 集成 |
| 无 CI/CD | 手动部署 | GitHub Actions + Vercel |
| env 硬编码 | 安全风险 | Vercel env vars |
| 无数据备份 | 数据丢失 | Neon 自动备份 |
