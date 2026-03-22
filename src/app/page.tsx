"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAllArchetypes } from "@/lib/archetype";
import { ArchetypeIcon } from "@/components/archetype-icon";
import { useI18n } from "@/i18n/context";

export default function Home() {
  const archetypes = getAllArchetypes();
  const { locale } = useI18n();
  const isZh = locale === "zh";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md md:max-w-2xl text-center space-y-6 md:space-y-8 w-full">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-[family-name:var(--font-outfit)]">
            Game<span className="gradient-text">Tan</span>
          </h1>

          <div className="space-y-2">
            <p className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)]">
              {isZh ? "你是什么类型的玩家？" : "What Kind of Gamer Are You?"}
            </p>
            <p className="text-base md:text-lg text-muted-foreground">
              {isZh
                ? "3分钟 · 3个小游戏 · 揭示你的游戏原型"
                : "3 min · 3 games · Discover your gamer archetype"}
            </p>
          </div>

          {/* Archetype icon parade — clickable */}
          <div className="flex flex-wrap justify-center gap-3 py-2">
            {archetypes.slice(0, 16).map((a) => (
              <Link
                key={a.id}
                href={`/archetype/${a.id}`}
                className="pressable hover:scale-110 transition-transform card-hover inline-block"
                title={isZh ? a.name : a.nameEn}
              >
                <ArchetypeIcon archetypeId={a.id} size={36} gradient={a.gradient as [string, string]} />
              </Link>
            ))}
          </div>

          <Link
            href="/archetype"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isZh
              ? "16种玩家原型 — 你是哪一个？"
              : "16 gamer archetypes — which one are you?"}
          </Link>

          {/* Primary CTA */}
          <Link href="/quiz" className="block">
            <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-12 shadow-glow-lg">
              {isZh ? "开始测试" : "Start Quiz"}
            </Button>
          </Link>

          {/* Secondary */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>{isZh ? "无需注册" : "No signup"}</span>
            <span>·</span>
            <span>{isZh ? "结果即时生成" : "Instant results"}</span>
            <span>·</span>
            <span>{isZh ? "可分享" : "Shareable"}</span>
          </div>

          {/* Secondary links */}
          <div className="pt-4 flex items-center justify-center gap-4 text-sm">
            <Link
              href="/explore"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isZh ? "浏览游戏库" : "Browse Games"}
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link
              href="/archetype/compatibility"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isZh ? "原型兼容性" : "Compatibility"}
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isZh ? "登录" : "Sign in"}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground py-4">
        gametan.ai
      </div>
    </div>
  );
}
