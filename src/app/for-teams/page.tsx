"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";
import {
  Users,
  TrendingUp,
  Target,
  Download,
  Check,
  X,
  Gamepad2,
  ChevronRight,
  Sparkles,
  Shield,
  FileText,
} from "lucide-react";
import { FeatureCard, Step, PricingTier } from "./sections";

/**
 * /for-teams — B2B landing page for coaches, clubs, and esports academies.
 *
 * Honest positioning: structured cognitive observation tool — not a crystal ball,
 * not a scouting replacement, not a clinical diagnostic.
 *
 * Metadata lives in ./layout.tsx (server component) because this is a client
 * component (uses useI18n). JSON-LD Product schema is inlined below.
 */

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "GameTan for Teams",
  description:
    "Cognitive assessment platform for esports teams. Longitudinal tracking, role fit analysis, CSV + API export, built on published cognitive science paradigms.",
  brand: { "@type": "Brand", name: "GameTan" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "99",
    highPrice: "299",
    offerCount: 3,
    offers: [
      {
        "@type": "Offer",
        name: "Team Starter",
        price: "99",
        priceCurrency: "USD",
        description:
          "Up to 10 players, team dashboard, retest tracking, CSV export, email support.",
      },
      {
        "@type": "Offer",
        name: "Team Pro",
        price: "299",
        priceCurrency: "USD",
        description:
          "Up to 50 players, API access, advanced longitudinal analytics, priority support.",
      },
      {
        "@type": "Offer",
        name: "Enterprise",
        price: "0",
        priceCurrency: "USD",
        description:
          "100+ players, custom onboarding, white-label, SLA, dedicated support.",
      },
    ],
  },
};

export default function ForTeamsPage() {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const features = isZh
    ? [
        { icon: Users, title: "团队仪表板", desc: "所有选手的认知画像集中在一个视图中查看。" },
        { icon: TrendingUp, title: "纵向追踪", desc: "对比选手训练 30 / 90 / 180 天后的画像变化。" },
        { icon: Target, title: "位置适配分析", desc: "基于认知画像文献，将选手匹配到游戏内位置（ADC / Support / IGL / Rifler / AWPer）。" },
        { icon: Download, title: "CSV + API 导出", desc: "将团队数据拉入你的分析管线。" },
      ]
    : [
        { icon: Users, title: "Team Dashboard", desc: "See all players' cognitive profiles in one view." },
        { icon: TrendingUp, title: "Longitudinal Tracking", desc: "Compare profiles over 30/90/180 days of training." },
        { icon: Target, title: "Role Fit Analysis", desc: "Match players to in-game roles (ADC / Support / IGL / Rifler / AWPer) based on cognitive profile literature." },
        { icon: Download, title: "CSV + API Export", desc: "Pull team data into your analytics pipeline." },
      ];

  const steps = isZh
    ? [
        { step: "1", icon: Users, title: "邀请选手", desc: "发送邀请链接，选手在自己的设备上完成 25 分钟的测试。" },
        { step: "2", icon: Target, title: "审查画像", desc: "教练仪表板展示每位选手的优势、弱点、可训练性估算和位置适配度。" },
        { step: "3", icon: TrendingUp, title: "追踪进展", desc: "30 / 90 / 180 天的复测周期展示认知变化趋势。" },
      ]
    : [
        { step: "1", icon: Users, title: "Invite players", desc: "Send invite links. Players take the 25-min assessment on their own device." },
        { step: "2", icon: Target, title: "Review profiles", desc: "Coach dashboard shows each player's strengths, weaknesses, trainability estimates, and role fit." },
        { step: "3", icon: TrendingUp, title: "Track progress", desc: "Retest cycles at 30/90/180 days show cognitive change." },
      ];

  const whoFor = isZh
    ? [
        "评估新秀的业余电竞学院",
        "评估招募新人的高校电竞项目",
        "追踪选手发展的半职业俱乐部",
        "希望在比赛表现之外获得结构化认知数据的教练",
      ]
    : [
        "Amateur esports academies assessing new talent",
        "Collegiate esports programs evaluating recruits",
        "Semi-pro clubs tracking player development",
        "Coaches wanting structured cognitive data alongside game performance",
      ];

  const notFor = isZh
    ? [
        "不是取代观看实战录像的球探工具",
        "不是职业预测模型 —— 成功还取决于训练量、心理韧性、机会等多重因素",
        "不是临床诊断工具（未获 FDA / CE 认证）",
        "不测量团队协作、游戏特定技巧、或赛事压力",
      ]
    : [
        "Not a scouting tool that replaces watching gameplay",
        "Not a pro-prediction model — success has many more factors (practice, mental toughness, opportunity)",
        "Not a clinical diagnostic tool (not FDA/CE certified)",
        "Not a measurement of teamwork, game-specific skill, or tournament pressure",
      ];

  const starterFeatures = isZh
    ? ["最多 10 位选手", "团队仪表板", "复测追踪", "CSV 导出", "邮件支持"]
    : ["Up to 10 players", "Team dashboard", "Retest tracking", "CSV export", "Email support"];

  const proFeatures = isZh
    ? ["最多 50 位选手", "入门版所有功能", "API 访问（Bearer token）", "高级纵向分析", "优先支持"]
    : ["Up to 50 players", "Everything in Starter", "API access with bearer tokens", "Advanced longitudinal analytics", "Priority support"];

  const entFeatures = isZh
    ? ["100+ 位选手", "定制化接入", "白标方案", "SLA + 专属支持"]
    : ["100+ players", "Custom onboarding", "White-label option", "SLA + dedicated support"];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── 1. Hero ─── */}
      <section className="relative flex flex-col items-center justify-center px-5 pt-16 pb-10 md:pt-24 md:pb-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-lg md:max-w-2xl text-center space-y-5 w-full">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary">
            <Shield size={12} />
            {isZh ? "教练和俱乐部专用" : "For Coaches & Clubs"}
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-[family-name:var(--font-outfit)] leading-tight">
            {isZh ? (
              <><span className="gradient-text">GameTan</span> 教练与俱乐部版</>
            ) : (
              <><span className="gradient-text">GameTan</span> for Coaches and Clubs</>
            )}
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {isZh
              ? "面向电竞团队的结构化认知观察工具。基于已发表的认知科学范式——对我们能测量什么、不能测量什么保持诚实。"
              : "Structured cognitive observation for esports teams. Based on published paradigms — honest about what we can and cannot measure."}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register?ref=for-teams" className="inline-block">
              <Button
                size="lg"
                className="text-base h-12 px-8 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_8px_30px_oklch(0.80_0.17_85/0.25)]"
              >
                <Gamepad2 size={18} />
                {isZh ? "申请内测" : "Request Access"}
              </Button>
            </Link>
            <Link href="/methodology" className="inline-block">
              <Button variant="outline" size="lg" className="text-base h-12 px-6 gap-2">
                <FileText size={16} />
                {isZh ? "查看方法论" : "View Methodology"}
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            {isZh ? "内测期免费 · 2026 Q2 之前 · 无需信用卡" : "Beta free through Q2 2026 · No credit card required"}
          </p>
        </div>
      </section>

      {/* ─── 2. What you get ─── */}
      <section className="px-5 py-10 md:py-16">
        <div className="max-w-lg md:max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)]">
              {isZh ? "你将获得" : "What you get"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              {isZh ? "为教练和俱乐部打造的完整工具链" : "A complete toolchain built for coaches and clubs"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. How it works ─── */}
      <section className="px-5 py-10 md:py-16 bg-muted/30">
        <div className="max-w-lg md:max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)]">
              {isZh ? "工作流程" : "How it works"}
            </h2>
          </div>

          <div className="space-y-5">
            {steps.map((s) => (
              <Step key={s.step} step={s.step} icon={s.icon} title={s.title} desc={s.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Who this is for ─── */}
      <section className="px-5 py-10 md:py-16">
        <div className="max-w-lg md:max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)]">
              {isZh ? "适用人群" : "Who this is for"}
            </h2>
          </div>

          <Card className="border-primary/10">
            <CardContent className="pt-5 pb-5 space-y-3">
              {whoFor.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Check size={18} className="text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t border-border/50">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {isZh ? "不适用于" : "NOT for"}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isZh
                    ? "替代比赛表现层面的球探工作、预测职业成功、临床评估。"
                    : "Replacing game-performance scouting, predicting pro success, clinical assessment."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── 5. What this is NOT ─── */}
      <section className="px-5 py-10 md:py-16 bg-muted/30">
        <div className="max-w-lg md:max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)]">
              {isZh ? "这不是什么（诚实声明）" : "What this is NOT"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              {isZh ? "我们对自己能力的边界保持清晰。" : "We're clear-eyed about the boundaries of what we do."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notFor.map((point) => (
              <div
                key={point}
                className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/[0.03] p-4"
              >
                <X size={18} className="text-destructive shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. Pricing ─── */}
      <section className="px-5 py-10 md:py-16">
        <div className="max-w-lg md:max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)]">
              {isZh ? "定价" : "Pricing"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              {isZh
                ? "内测期间所有套餐免费使用，正式上线后开始计费。"
                : "All tiers free during beta. Billing begins at general availability."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PricingTier
              name={isZh ? "团队入门版" : "Team Starter"}
              price="$99"
              priceSuffix={isZh ? "/ 月" : "/month"}
              features={starterFeatures}
              ctaLabel={isZh ? "开始使用" : "Start Starter"}
              ctaHref="/register?ref=for-teams&plan=starter"
            />
            <PricingTier
              name={isZh ? "团队专业版" : "Team Pro"}
              price="$299"
              priceSuffix={isZh ? "/ 月" : "/month"}
              features={proFeatures}
              ctaLabel={isZh ? "开始使用 Pro" : "Start Pro"}
              ctaHref="/register?ref=for-teams&plan=pro"
              featured
              featuredBadge={isZh ? "最受欢迎" : "Most Popular"}
            />
            <PricingTier
              name={isZh ? "企业版" : "Enterprise"}
              price={isZh ? "联系我们" : "Contact us"}
              features={entFeatures}
              ctaLabel={isZh ? "联系销售" : "Contact Sales"}
              ctaHref="mailto:teams@gametan.ai?subject=Enterprise%20inquiry"
              external
            />
          </div>
        </div>
      </section>

      {/* ─── 7. Scientific foundation ─── */}
      <section className="px-5 py-10 md:py-16 bg-muted/30">
        <div className="max-w-lg md:max-w-2xl mx-auto text-center space-y-5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles size={22} className="text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)]">
            {isZh ? "科学基础" : "Scientific foundation"}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {isZh
              ? "每一个范式都有引用。每一份常模都有来源。每一项局限都已披露。阅读完整方法论。"
              : "Every paradigm cited. Every norm sourced. Every limitation disclosed. Read the full methodology."}
          </p>
          <Link href="/methodology" className="inline-block">
            <Button variant="outline" size="lg" className="gap-2">
              <FileText size={16} />
              {isZh ? "阅读方法论" : "Read the Methodology"}
              <ChevronRight size={14} />
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── 8. CTA footer ─── */}
      <section className="px-5 py-12 md:py-20">
        <div className="max-w-md mx-auto text-center space-y-4">
          <p className="text-lg md:text-2xl font-bold font-[family-name:var(--font-outfit)]">
            {isZh ? "准备好开始了吗？" : "Ready to get started?"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isZh ? "2026 Q2 之前内测完全免费。立即注册 →" : "Beta is free through Q2 2026. Sign up →"}
          </p>
          <Link href="/register?ref=for-teams" className="inline-block">
            <Button
              size="lg"
              className="text-base h-12 px-10 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_8px_30px_oklch(0.80_0.17_85/0.25)]"
            >
              <Gamepad2 size={18} />
              {isZh ? "申请内测" : "Request Access"}
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border/50">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span>gametan.ai</span>
          <span>·</span>
          <Link href="/" className="hover:text-foreground transition-colors">
            {isZh ? "首页" : "Home"}
          </Link>
          <span>·</span>
          <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
          <span>·</span>
          <Link href="/methodology" className="hover:text-foreground transition-colors">
            {isZh ? "方法论" : "Methodology"}
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
