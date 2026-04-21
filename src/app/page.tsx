"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAllArchetypes } from "@/lib/archetype";
import { ArchetypeIcon } from "@/components/archetype-icon";
import { useI18n } from "@/i18n/context";
import { Zap, Brain, Target, Gamepad2, ChevronRight, Users, Sparkles, AlertTriangle, HelpCircle, Crown } from "lucide-react";
import { DistributionBar } from "@/components/distribution-bar";
import { GAMER_TOP5_AVG } from "@/lib/literature-norms";

// Featured archetypes to preview (show 4 most distinctive)
const FEATURED_IDS = ["lightning-assassin", "oracle", "berserker", "architect"];

export default function Home() {
  const archetypes = getAllArchetypes();
  const { t, locale } = useI18n();
  const isZh = locale === "zh"; // kept for archetype dynamic data + DistributionBar prop
  const featured = FEATURED_IDS.map((id) => archetypes.find((a) => a.id === id)!).filter(Boolean);

  const linkClass = "text-primary underline underline-offset-2 hover:text-primary/80 transition-colors";
  const faqItems: { q: string; a: string; aJsx: React.ReactNode }[] = [
    {
      q: t("home.faq.q1"),
      a: t("home.faq.a1"),
      aJsx: isZh ? (
        <>GameTan 通过互动小游戏测量 13 项与电竞表现相关的认知维度——反应速度、模式识别、战略思维、多任务处理等——全部基于<Link href="/methodology" className={linkClass}>已发表的研究范式</Link>（Stroop、Flanker、N-Back、Corsi、UFOV）。不是性格问卷。你的分数会与已发表的玩家认知研究文献数据对比。<Link href="/quiz" className={linkClass}>立即测试</Link>。</>
      ) : (
        <>GameTan measures 13 cognitive dimensions tied to gaming performance — reaction speed, pattern recognition, strategic thinking, multitasking, and more — through interactive mini-games built on <Link href="/methodology" className={linkClass}>published research paradigms</Link> (Stroop, Flanker, N-Back, Corsi, UFOV). No personality quizzes. Your scores are ranked against literature norms from published gamer cognitive studies. <Link href="/quiz" className={linkClass}>Take the test now</Link>.</>
      ),
    },
    {
      q: t("home.faq.q2"),
      a: t("home.faq.a2"),
      aJsx: isZh ? (
        <>每个小游戏都实现了一个同行评审的认知科学范式，隔离出一项与游戏表现相关的认知技能。你的结果会以百分位排名的方式与已发表的玩家群体研究文献数据对比（Dale &amp; Green 2017；Green &amp; Bavelier 2003；Kowal et al. 2018）。GameTan 没有自己的职业选手数据库——详见 <Link href="/about" className={linkClass}>About</Link> 和 <Link href="/methodology" className={linkClass}>methodology</Link> 页。</>
      ) : (
        <>Each mini-game implements a paradigm from peer-reviewed cognitive science and isolates a specific cognitive skill that correlates with gaming performance. Your results are percentile-ranked against literature norms from published gamer-population studies (Dale &amp; Green 2017; Green &amp; Bavelier 2003; Kowal et al. 2018). GameTan does not have a proprietary pro player database — see our <Link href="/about" className={linkClass}>About</Link> and <Link href="/methodology" className={linkClass}>methodology</Link> pages.</>
      ),
    },
    {
      q: t("home.faq.q3"),
      a: t("home.faq.a3"),
      aJsx: isZh ? (
        <>是的，核心天赋测试完全免费。完成 3 分钟<Link href="/quiz" className={linkClass}>测试</Link>后，你可以立即获得完整的 13 维度分数分析、原型分类和基于文献的百分位排名。</>
      ) : (
        <>Yes, the core talent test is 100% free. You get your full 13-dimension score breakdown, archetype classification, and a literature-based percentile ranking instantly after completing the 3-minute <Link href="/quiz" className={linkClass}>test</Link>.</>
      ),
    },
    {
      q: t("home.faq.q4"),
      a: t("home.faq.a4"),
      aJsx: isZh ? (
        <>根据你的天赋画像，你会被匹配到 16 种玩家原型之一，如闪电刺客、先知、建筑师或狂战士。每个原型反映独特的优势组合。<Link href="/archetype" className={linkClass}>探索所有原型</Link>找到你的定位。</>
      ) : (
        <>Based on your talent profile, you are matched to one of 16 gamer archetypes like Lightning Assassin, Oracle, Architect, or Berserker. Each archetype reflects a unique combination of strengths. <Link href="/archetype" className={linkClass}>Explore all archetypes</Link> to find yours.</>
      ),
    },
    {
      q: t("home.faq.q5"),
      a: t("home.faq.a5"),
      aJsx: isZh ? (
        <>当然可以。GameTan 会识别你最强和最弱的天赋维度。使用<Link href="/chat" className={linkClass}>AI 教练</Link>获取基于你画像的个性化训练建议。随时重新<Link href="/quiz" className={linkClass}>测试</Link>追踪进步。</>
      ) : (
        <>Absolutely. GameTan identifies your strongest and weakest talent dimensions. Use the <Link href="/chat" className={linkClass}>AI Coach</Link> to get personalized training advice based on your profile. Retake the <Link href="/quiz" className={linkClass}>test</Link> anytime to track improvement.</>
      ),
    },
    {
      q: t("home.faq.q6"),
      a: t("home.faq.a6"),
      aJsx: isZh ? (
        <>GameTan 是目前最全面的电竞天赋测试，使用已发表的研究范式（Stroop、Flanker、N-Back、Go/No-Go、UFOV）测量 17 个认知维度。大多数测试只测反应时间，GameTan 测量完整认知画像。<Link href="/quiz" className={linkClass}>立即测试</Link>。</>
      ) : (
        <>GameTan is the most comprehensive esports talent test available, measuring 17 cognitive dimensions using published research paradigms (Stroop, Flanker, N-Back, Go/No-Go, UFOV). Most tests only measure reaction time. <Link href="/quiz" className={linkClass}>Take the full test</Link>.</>
      ),
    },
    {
      q: t("home.faq.q7"),
      a: t("home.faq.a7"),
      aJsx: isZh ? (
        <>GameTan 无法预测职业成功——我们测量的是认知能力，不是竞技结果。参加 <Link href="/quiz" className={linkClass}>Pro 评估</Link>看看你的认知画像与文献数据对比处于什么位置。某个维度进入前 5% 意味着你在该任务上的原始认知能力与<Link href="/methodology" className={linkClass}>已发表研究</Link>中的顶尖玩家画像相当。但职业成功还取决于训练时间、心理素质和机会——认知天赋只是一部分。</>
      ) : (
        <>GameTan cannot predict pro success — we measure cognitive abilities, not competitive outcome. Take the <Link href="/quiz" className={linkClass}>Pro Assessment</Link> to see where your cognitive profile ranks against <Link href="/methodology" className={linkClass}>literature norms</Link>. Scoring in the top 5% on a dimension means your raw cognitive ability is comparable to top-tier published gamer profiles — but pro success also depends on practice, mental toughness, and opportunity.</>
      ),
    },
    {
      q: t("home.faq.q8"),
      a: t("home.faq.a8"),
      aJsx: isZh ? (
        <>职业选手在反应速度（180-220ms）、视觉追踪、工作记忆、冲动控制、认知灵活性和注意力分配方面表现卓越。GameTan 通过认知科学任务测量所有这些。<Link href="/about" className={linkClass}>了解科学基础</Link>。</>
      ) : (
        <>Pro players excel in reaction speed (180-220ms), visual tracking, working memory, impulse control, cognitive flexibility, and attention allocation. GameTan measures all of these through validated cognitive science tasks. <Link href="/about" className={linkClass}>Learn about the science</Link>.</>
      ),
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-x-hidden">
      {/* FAQ JSON-LD for SEO rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ─── Section 1: Hero ─── */}
      <section className="relative flex flex-col items-center justify-center px-5 pt-16 pb-10 md:pt-24 md:pb-16">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-lg md:max-w-2xl text-center space-y-5 w-full">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight font-[family-name:var(--font-outfit)]">
            Game<span className="gradient-text">Tan</span>
          </h1>

          <p className="text-2xl md:text-4xl font-bold font-[family-name:var(--font-outfit)] leading-tight">
            {t("home.hero.subtitle")}
          </p>

          <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto">
            {t("home.hero.desc")}
          </p>

          {/* Primary CTA — Gold per DESIGN.md (1 per screen max) */}
          <div className="pt-2">
            <Link href="/quiz" className="inline-block">
              <Button size="lg" className="text-lg h-14 px-12 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_8px_30px_oklch(0.80_0.17_85/0.25)]">
                <Gamepad2 size={20} />
                {t("home.hero.cta")}
              </Button>
            </Link>
          </div>

          {/* D8: Contrast bar — visual gap instead of pill badges */}
          <div className="max-w-xs mx-auto space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-accent/20 overflow-hidden">
                <div className="h-full w-[98%] rounded-full bg-accent/60" />
              </div>
              <span className="text-accent w-24 text-right shrink-0">
                {t("home.hero.wantPro")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-primary/20 overflow-hidden">
                <div className="h-full w-[1%] rounded-full bg-primary" style={{ minWidth: "3px" }} />
              </div>
              <span className="text-primary w-24 text-right shrink-0">
                {t("home.hero.makePro")}
              </span>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Zap size={12} /> {t("home.hero.duration")}</span>
            <span>·</span>
            <span>{t("home.hero.vsPro")}</span>
            <span>·</span>
            <span>{t("home.hero.free")}</span>
          </div>
        </div>
      </section>

      {/* ─── Section 1.5: The Gap Most Don't See ─── */}
      <section className="px-5 py-8 md:py-12">
        <div className="max-w-md mx-auto text-center space-y-5">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle size={14} />
            {t("home.gap.intro")}
          </div>

          <DistributionBar
            userScore={45}
            referenceScore={GAMER_TOP5_AVG}
            isZh={isZh}
          />

          <p className="text-xs text-muted-foreground">
            {t("home.gap.desc")}
          </p>

          <Link href="/quiz" className="inline-block">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Target size={14} />
              {t("home.gap.cta")}
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── Section 2: What You'll Get (Result Preview) ─── */}
      <section className="px-5 py-10 md:py-16">
        <div className="max-w-lg md:max-w-3xl mx-auto space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-center font-[family-name:var(--font-outfit)]">
            {t("home.results.title")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/10 bg-primary/[0.02]">
              <CardContent className="pt-5 pb-5 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles size={20} className="text-primary" />
                </div>
                <div className="font-semibold text-sm">
                  {t("home.results.scoresTitle")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("home.results.scoresDesc")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/10 bg-primary/[0.02]">
              <CardContent className="pt-5 pb-5 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <Brain size={20} className="text-primary" />
                </div>
                <div className="font-semibold text-sm">
                  {t("home.results.compTitle")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("home.results.compDesc")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/10 bg-primary/[0.02]">
              <CardContent className="pt-5 pb-5 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target size={20} className="text-primary" />
                </div>
                <div className="font-semibold text-sm">
                  {t("home.results.gapTitle")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("home.results.gapDesc")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Section 3: Featured Archetypes Preview ─── */}
      <section className="px-5 py-10 md:py-16 bg-muted/30">
        <div className="max-w-lg md:max-w-3xl mx-auto space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-center font-[family-name:var(--font-outfit)]">
            {t("home.archetypes.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-md mx-auto">
            {t("home.archetypes.desc")}
          </p>

          {/* Featured 4 archetypes */}
          <div className="grid grid-cols-2 gap-3">
            {featured.map((a) => (
              <Link key={a.id} href={`/archetype/${a.id}`}>
                <Card className="pressable card-hover h-full border-transparent hover:border-primary/20">
                  <CardContent className="pt-4 pb-4 flex items-center gap-3">
                    <ArchetypeIcon archetypeId={a.id} size={40} gradient={a.gradient as [string, string]} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {isZh ? a.name : a.nameEn}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {isZh ? a.tagline : a.taglineEn}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* All archetypes grid (smaller) */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {archetypes.filter((a) => !FEATURED_IDS.includes(a.id)).map((a) => (
              <Link
                key={a.id}
                href={`/archetype/${a.id}`}
                className="pressable hover:scale-110 transition-transform"
                title={isZh ? a.name : a.nameEn}
              >
                <ArchetypeIcon archetypeId={a.id} size={28} gradient={a.gradient as [string, string]} />
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/archetype"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {t("home.archetypes.viewAll")}
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Section 4: How It Works ─── */}
      <section className="px-5 py-10 md:py-16">
        <div className="max-w-lg md:max-w-2xl mx-auto space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-center font-[family-name:var(--font-outfit)]">
            {t("home.how.title")}
          </h2>

          <div className="space-y-4">
            {[
              {
                step: "1",
                title: t("home.how.step1Title"),
                desc: t("home.how.step1Desc"),
                icon: Gamepad2,
              },
              {
                step: "2",
                title: t("home.how.step2Title"),
                desc: t("home.how.step2Desc"),
                icon: Brain,
              },
              {
                step: "3",
                title: t("home.how.step3Title"),
                desc: t("home.how.step3Desc"),
                icon: Sparkles,
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon size={18} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    <span className="text-primary mr-1.5">{item.step}.</span>
                    {item.title}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 5: Pricing ─── */}
      <section className="px-5 py-10 md:py-16">
        <div className="max-w-lg md:max-w-2xl mx-auto space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-center font-[family-name:var(--font-outfit)]">
            {isZh ? "简单定价" : "Simple Pricing"}
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 space-y-2">
              <div className="text-sm font-semibold">{isZh ? "快速测试" : "Quick Test"}</div>
              <div className="text-2xl font-bold text-primary">{isZh ? "免费" : "Free"}</div>
              <p className="text-xs text-muted-foreground">{isZh ? "3 个游戏 · 3 分钟 · 3 维度" : "3 games · 3 min · 3 dimensions"}</p>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="text-sm font-semibold">{isZh ? "标准测试" : "Standard Test"}</div>
              <div className="text-2xl font-bold text-primary">{isZh ? "免费" : "Free"}</div>
              <p className="text-xs text-muted-foreground">{isZh ? "7 个游戏 · 10 分钟 · AI 教练" : "7 games · 10 min · AI Coach"}</p>
            </div>
            <div className="rounded-2xl border-2 border-accent/30 bg-accent/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Crown size={14} className="text-accent" />
                <span className="text-sm font-semibold">{isZh ? "Pro 评估" : "Pro Assessment"}</span>
              </div>
              <div className="text-2xl font-bold text-accent">$3.99</div>
              <p className="text-xs text-muted-foreground">{isZh ? "17 维度 · PDF 报告 · 365 天" : "17 dimensions · PDF report · 365 days"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 6: Social Proof ─── */}
      <section className="px-5 py-10 md:py-16 bg-muted/30">
        <div className="max-w-lg md:max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">16</div>
              <div className="text-xs text-muted-foreground">{t("home.social.archetypes")}</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">13</div>
              <div className="text-xs text-muted-foreground">{t("home.social.talentDims")}</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">3</div>
              <div className="text-xs text-muted-foreground">{t("home.social.minComplete")}</div>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Users size={12} />
            {t("home.social.proof")}
          </div>
        </div>
      </section>

      {/* ─── Section 6: Final CTA ─── */}
      <section className="px-5 py-12 md:py-20">
        <div className="max-w-md mx-auto text-center space-y-4">
          <p className="text-lg md:text-xl font-bold font-[family-name:var(--font-outfit)]">
            {t("home.cta.title")}
          </p>
          <Link href="/quiz" className="inline-block">
            <Button size="lg" className="text-lg h-14 px-12 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_8px_30px_oklch(0.80_0.17_85/0.25)]">
              <Gamepad2 size={20} />
              {t("home.cta.button")}
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            {t("home.cta.sub")}
          </p>
        </div>
      </section>

      {/* ─── Section 7: FAQ ─── */}
      <section className="px-5 py-10 md:py-16 bg-muted/30">
        <div className="max-w-lg md:max-w-2xl mx-auto space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-center font-[family-name:var(--font-outfit)] flex items-center justify-center gap-2">
            <HelpCircle size={22} className="text-primary" />
            {t("home.faq.title")}
          </h2>

          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <details key={i} className="group">
                <summary className="flex items-start gap-3 cursor-pointer list-none text-sm font-semibold py-3 px-4 rounded-lg bg-background border border-border/50 hover:border-primary/30 transition-colors [&::-webkit-details-marker]:hidden">
                  <ChevronRight size={16} className="text-primary shrink-0 mt-0.5 transition-transform group-open:rotate-90" />
                  {item.q}
                </summary>
                <p className="text-xs text-muted-foreground mt-1 px-4 pb-3 leading-relaxed">
                  {item.aJsx}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border/50">
        <div className="flex items-center justify-center gap-3">
          <span>gametan.ai</span>
          <span>·</span>
          <Link href="/archetype" className="hover:text-foreground transition-colors">
            {t("home.footer.archetypes")}
          </Link>
          <span>·</span>
          <Link href="/explore" className="hover:text-foreground transition-colors">
            {t("home.footer.games")}
          </Link>
          <span>·</span>
          <Link href="/login" className="hover:text-foreground transition-colors">
            {t("home.footer.signIn")}
          </Link>
          <span>·</span>
          <Link href="/blog" className="hover:text-foreground transition-colors">
            {t("home.footer.blog")}
          </Link>
          <span>·</span>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
