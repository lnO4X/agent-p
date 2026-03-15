"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Crown, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TalentIcon } from "@/components/talent-icon";
import { gameRegistry } from "@/games";
import { useIsMobile } from "@/hooks/use-device";
import { useI18n } from "@/i18n/context";
import type { TalentCategory } from "@/types/talent";

export default function TestHubPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading...</div>}>
      <TestHubContent />
    </Suspense>
  );
}

function TestHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { t, locale } = useI18n();
  const isZh = locale === "zh";
  const isWelcome = searchParams.get("welcome") === "1";
  const [loading, setLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [maxTests, setMaxTests] = useState(2);
  const [error, setError] = useState("");
  const games = gameRegistry.getAll();

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.meta) {
          setCompletedCount(json.meta.completedCount);
          setMaxTests(json.meta.maxTests ?? Infinity);
        }
      });
  }, []);

  const remainingTests = maxTests - completedCount;
  const limitReached = remainingTests <= 0;

  async function startFullTest() {
    if (limitReached) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sessions", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        router.push(`/test/session/${json.data.id}`);
      } else {
        setError(json.error?.message || t("test.createFailed"));
      }
    } finally {
      setLoading(false);
    }
  }

  // Group games by talent
  const grouped = games.reduce(
    (acc, game) => {
      acc[game.primaryTalent] = game;
      return acc;
    },
    {} as Record<string, (typeof games)[0]>
  );

  const mobileGameCount = games.filter((g) => g.mobileCompatible !== false).length;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome banner for new registrants */}
      {isWelcome && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3">
              <Sparkles size={24} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-base">
                  {isZh ? "🎉 欢迎加入 GameTan！" : "🎉 Welcome to GameTan!"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isZh
                    ? "完成以下 13 项趣味小游戏（约 25 分钟），系统将为你揭示专属的玩家原型 + 解锁 AI 角色伙伴。"
                    : "Complete these 13 mini-games (~25 min) to discover your gamer archetype and unlock AI character companions."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center space-y-3">
        <h1 className="text-2xl md:text-3xl font-bold">{t("test.title")}</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {isMobile
            ? t("test.subtitleMobile", { count: mobileGameCount })
            : t("test.subtitle")
          }
        </p>

        {/* Test limit indicator */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className={`font-medium ${limitReached ? "text-red-400" : "text-muted-foreground"}`}>
            {t("test.completed", { done: completedCount, total: maxTests })}
          </span>
          {!limitReached && (
            <span className="text-muted-foreground">
              ({t("test.remaining", { count: remainingTests })})
            </span>
          )}
        </div>

        {limitReached ? (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-700/30 rounded-lg text-red-400 text-sm">
              <AlertTriangle size={16} />
              <span>{t("test.limitReached", { max: maxTests })}</span>
            </div>

            {/* Premium upgrade CTA */}
            <Link href="/me/premium" className="block">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors">
                <Crown size={16} />
                <span className="text-sm font-medium">
                  {isZh ? "升级 Premium — 5次测试额度" : "Upgrade to Premium — 5 test slots"}
                </span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <div className="text-sm text-muted-foreground">
              <Link href="/results" className="text-primary hover:underline">
                {t("test.viewResults")}
              </Link>
              {" · "}
              <Link href="/leaderboard" className="text-primary hover:underline">
                {t("test.viewLeaderboard")}
              </Link>
            </div>
          </div>
        ) : (
          <Button size="lg" onClick={startFullTest} disabled={loading} className="h-12 text-base">
            {loading ? t("test.creating") : t("test.startFull")}
          </Button>
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
        {Object.entries(grouped).map(([talent, game]) => {
          const isDesktopOnly = game.mobileCompatible === false;
          return (
            <Card
              key={game.id}
              className={`transition-colors ${
                isMobile && isDesktopOnly
                  ? "opacity-40"
                  : "hover:border-primary/50"
              }`}
            >
              <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <TalentIcon category={talent as TalentCategory} size={20} className="text-primary" />
                  <div className="min-w-0">
                    <CardTitle className="text-sm md:text-base truncate">{t(`talent.${talent}`)}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 line-clamp-2">
                  {game.name}
                </p>
                <div className="flex items-center justify-between text-[10px] md:text-xs text-muted-foreground">
                  <span>~{game.estimatedDurationSec}{t("test.seconds")}</span>
                  {isMobile && isDesktopOnly ? (
                    <span className="text-amber-500">{t("test.pcOnly")}</span>
                  ) : (
                    <span>
                      {game.difficulty === "easy"
                        ? t("test.easy")
                        : game.difficulty === "medium"
                          ? t("test.medium")
                          : t("test.hard")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
