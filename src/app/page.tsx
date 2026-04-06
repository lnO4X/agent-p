"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAllArchetypes } from "@/lib/archetype";
import { ArchetypeIcon } from "@/components/archetype-icon";
import { useI18n } from "@/i18n/context";
import { Zap, Brain, Target, Gamepad2, ChevronRight, Users, Sparkles, AlertTriangle, HelpCircle } from "lucide-react";
import { DistributionBar } from "@/components/distribution-bar";
import { PRO_BENCHMARKS } from "@/lib/pro-benchmarks";

// Featured archetypes to preview (show 4 most distinctive)
const FEATURED_IDS = ["lightning-assassin", "oracle", "berserker", "architect"];

export default function Home() {
  const archetypes = getAllArchetypes();
  const { t, locale } = useI18n();
  const isZh = locale === "zh"; // kept for archetype dynamic data + DistributionBar prop
  const featured = FEATURED_IDS.map((id) => archetypes.find((a) => a.id === id)!).filter(Boolean);

  const faqItems = [
    { q: t("home.faq.q1"), a: t("home.faq.a1") },
    { q: t("home.faq.q2"), a: t("home.faq.a2") },
    { q: t("home.faq.q3"), a: t("home.faq.a3") },
    { q: t("home.faq.q4"), a: t("home.faq.a4") },
    { q: t("home.faq.q5"), a: t("home.faq.a5") },
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
            proAvg={Math.round(PRO_BENCHMARKS.reduce((a, b) => a + b.proAvg, 0) / PRO_BENCHMARKS.length)}
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

      {/* ─── Section 5: Social Proof ─── */}
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
                  {item.a}
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
        </div>
      </footer>
    </div>
  );
}
