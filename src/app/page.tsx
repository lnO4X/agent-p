"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAllArchetypes } from "@/lib/archetype";
import { ArchetypeIcon } from "@/components/archetype-icon";
import { useI18n } from "@/i18n/context";
import { Zap, Brain, Target, Gamepad2, ChevronRight, Users, Sparkles } from "lucide-react";

// Featured archetypes to preview (show 4 most distinctive)
const FEATURED_IDS = ["lightning-assassin", "oracle", "berserker", "architect"];

export default function Home() {
  const archetypes = getAllArchetypes();
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const featured = FEATURED_IDS.map((id) => archetypes.find((a) => a.id === id)!).filter(Boolean);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-x-hidden">
      {/* ─── Section 1: Hero ─── */}
      <section className="relative flex flex-col items-center justify-center px-5 pt-16 pb-10 md:pt-24 md:pb-16">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-lg md:max-w-2xl text-center space-y-5 w-full">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight font-[family-name:var(--font-outfit)]">
            Game<span className="gradient-text">Tan</span>
          </h1>

          <p className="text-2xl md:text-4xl font-bold font-[family-name:var(--font-outfit)] leading-tight">
            {isZh ? "发现你的玩家原型" : "Discover Your Gamer Archetype"}
          </p>

          <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto">
            {isZh
              ? "通过 3 个小游戏测量你的真实游戏天赋，揭示你属于 16 种玩家原型中的哪一种。"
              : "Play 3 mini-games that measure your real gaming talents and reveal which of 16 gamer archetypes you are."}
          </p>

          {/* Primary CTA */}
          <div className="pt-2">
            <Link href="/quiz" className="inline-block">
              <Button size="lg" className="text-lg h-14 px-12 shadow-glow-lg gap-2">
                <Gamepad2 size={20} />
                {isZh ? "免费开始测试" : "Start Free Quiz"}
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Zap size={12} /> {isZh ? "3分钟" : "3 min"}</span>
            <span>·</span>
            <span>{isZh ? "无需注册" : "No signup"}</span>
            <span>·</span>
            <span>{isZh ? "完全免费" : "100% free"}</span>
          </div>
        </div>
      </section>

      {/* ─── Section 2: What You'll Get (Result Preview) ─── */}
      <section className="px-5 py-10 md:py-16">
        <div className="max-w-lg md:max-w-3xl mx-auto space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-center font-[family-name:var(--font-outfit)]">
            {isZh ? "测完你会得到" : "What You'll Get"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/10 bg-primary/[0.02]">
              <CardContent className="pt-5 pb-5 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles size={20} className="text-primary" />
                </div>
                <div className="font-semibold text-sm">
                  {isZh ? "你的专属原型" : "Your Archetype"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isZh
                    ? "16 种独特原型之一，描述你的游戏本能和行为模式"
                    : "One of 16 unique types describing your gaming instincts"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/10 bg-primary/[0.02]">
              <CardContent className="pt-5 pb-5 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <Brain size={20} className="text-primary" />
                </div>
                <div className="font-semibold text-sm">
                  {isZh ? "天赋雷达图" : "Talent Radar"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isZh
                    ? "反应速度、手眼协调、策略思维等 13 维天赋评分"
                    : "13-dimension scores: reaction, coordination, strategy & more"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/10 bg-primary/[0.02]">
              <CardContent className="pt-5 pb-5 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target size={20} className="text-primary" />
                </div>
                <div className="font-semibold text-sm">
                  {isZh ? "进化路径" : "Growth Path"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isZh
                    ? "了解你的弱点、盟友、天敌，以及如何进化"
                    : "Your weakness, allies, nemesis, and how to evolve"}
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
            {isZh ? "16 种玩家原型" : "16 Gamer Archetypes"}
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-md mx-auto">
            {isZh
              ? "基于真实游戏技能测量，不是问卷自评。你的原型由你的实际表现决定。"
              : "Based on real skill measurement, not self-report questionnaires. Your archetype is determined by how you actually play."}
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
              {isZh ? "查看全部 16 种原型" : "View all 16 archetypes"}
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Section 4: How It Works ─── */}
      <section className="px-5 py-10 md:py-16">
        <div className="max-w-lg md:max-w-2xl mx-auto space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-center font-[family-name:var(--font-outfit)]">
            {isZh ? "怎么测？" : "How It Works"}
          </h2>

          <div className="space-y-4">
            {[
              {
                step: "1",
                title: isZh ? "玩 3 个小游戏" : "Play 3 Mini-Games",
                desc: isZh ? "反应速度、模式识别、手眼协调 — 每个不到 1 分钟" : "Reaction, pattern recognition, coordination — each under 1 minute",
                icon: Gamepad2,
              },
              {
                step: "2",
                title: isZh ? "AI 分析你的表现" : "AI Analyzes Your Performance",
                desc: isZh ? "13 维天赋评分，与数千玩家对比排名" : "13-dimension talent scores, ranked against thousands of players",
                icon: Brain,
              },
              {
                step: "3",
                title: isZh ? "揭示你的原型" : "Reveal Your Archetype",
                desc: isZh ? "专属原型卡片、深度分析、进化建议 — 可分享给朋友" : "Personal archetype card, deep analysis, growth path — shareable",
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

      {/* ─── Section 5: Social Proof ─── */}
      <section className="px-5 py-10 md:py-16 bg-muted/30">
        <div className="max-w-lg md:max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">16</div>
              <div className="text-xs text-muted-foreground">{isZh ? "玩家原型" : "Archetypes"}</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">13</div>
              <div className="text-xs text-muted-foreground">{isZh ? "天赋维度" : "Talent Dims"}</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">3</div>
              <div className="text-xs text-muted-foreground">{isZh ? "分钟完成" : "Min to Complete"}</div>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Users size={12} />
            {isZh
              ? "基于真实游戏技能测量 · 不是性格自评问卷"
              : "Based on real skill measurement · Not a personality questionnaire"}
          </div>
        </div>
      </section>

      {/* ─── Section 6: Final CTA ─── */}
      <section className="px-5 py-12 md:py-20">
        <div className="max-w-md mx-auto text-center space-y-4">
          <p className="text-lg md:text-xl font-bold font-[family-name:var(--font-outfit)]">
            {isZh ? "准备好了吗？" : "Ready to find out?"}
          </p>
          <Link href="/quiz" className="inline-block">
            <Button size="lg" className="text-lg h-14 px-12 shadow-glow-lg gap-2">
              <Gamepad2 size={20} />
              {isZh ? "免费开始测试" : "Start Free Quiz"}
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            {isZh ? "完全免费 · 无需注册 · 即时出结果" : "100% free · No signup · Instant results"}
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border/50">
        <div className="flex items-center justify-center gap-3">
          <span>gametan.ai</span>
          <span>·</span>
          <Link href="/archetype" className="hover:text-foreground transition-colors">
            {isZh ? "原型" : "Archetypes"}
          </Link>
          <span>·</span>
          <Link href="/explore" className="hover:text-foreground transition-colors">
            {isZh ? "游戏" : "Games"}
          </Link>
          <span>·</span>
          <Link href="/login" className="hover:text-foreground transition-colors">
            {isZh ? "登录" : "Sign in"}
          </Link>
        </div>
      </footer>
    </div>
  );
}
