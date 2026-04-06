"use client";

import { useState, useCallback, useMemo } from "react";
import { useI18n } from "@/i18n/context";
import { gameRegistry } from "@/games";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { scoreToRank, RANK_COLORS } from "@/lib/scoring";
import { Swords, Share2, Copy, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { GameRawResult } from "@/types/game";

type Phase = "select" | "name" | "playing" | "submitting" | "created";

/** Games suitable for PK (quick, competitive) */
const PK_GAMES = [
  "reaction-speed",
  "pattern",
  "risk",
  "memory",
  "decision",
  "hand-eye",
] as const;

export default function PkCreatePage() {
  const { t, locale } = useI18n();

  const [phase, setPhase] = useState<Phase>("select");
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState("");
  const [pkResult, setPkResult] = useState<{
    id: string;
    score: number;
    shareUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGame = useMemo(
    () => (selectedGameId ? gameRegistry.get(selectedGameId) : null),
    [selectedGameId]
  );
  const GameComponent = selectedGame?.component ?? null;

  const games = useMemo(
    () =>
      PK_GAMES.map((id) => gameRegistry.get(id)).filter(
        (g): g is NonNullable<typeof g> => g != null
      ),
    []
  );

  const handleComplete = useCallback(
    async (result: GameRawResult) => {
      if (!selectedGameId) return;
      setPhase("submitting");
      try {
        const res = await fetch("/api/pk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameId: selectedGameId,
            creatorName: creatorName || t("pk.anonymous"),
            rawScore: result.rawScore,
            durationMs: result.durationMs,
            metadata: result.metadata,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setPkResult({
            id: json.data.id,
            score: json.data.normalizedScore,
            shareUrl: json.data.shareUrl,
          });
          setPhase("created");
        } else {
          setError(json.error?.message || t("pk.createFailed"));
          setPhase("select");
        }
      } catch {
        setError(t("pk.networkError"));
        setPhase("select");
      }
    },
    [selectedGameId, creatorName, t]
  );

  const handleAbort = useCallback(() => {
    setPhase("select");
  }, []);

  async function handleShare() {
    if (!pkResult || !selectedGame) return;
    const url = `${window.location.origin}${pkResult.shareUrl}`;
    const gameName =
      locale === "en" && selectedGame.nameEn
        ? selectedGame.nameEn
        : selectedGame.name;
    const text = t("pk.shareText", { game: gameName, score: Math.round(pkResult.score) });
    if (navigator.share) {
      try {
        await navigator.share({ title: "GameTan PK", text, url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleCopyLink() {
    if (!pkResult) return;
    const url = `${window.location.origin}${pkResult.shareUrl}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── Playing ───
  if (phase === "playing" && GameComponent) {
    const gameName =
      locale === "en" && selectedGame?.nameEn
        ? selectedGame.nameEn
        : selectedGame?.name;
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2 text-sm">
            <Swords size={16} className="text-primary" />
            <span className="font-medium">
              {t("pk.createPk")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{gameName}</span>
        </div>
        <div className="flex-1 p-4">
          <GameComponent onComplete={handleComplete} onAbort={handleAbort} />
        </div>
      </div>
    );
  }

  // ─── Submitting ───
  if (phase === "submitting") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {t("pk.creatingChallenge")}
        </p>
      </div>
    );
  }

  // ─── Created — share link ───
  if (phase === "created" && pkResult) {
    const rank = scoreToRank(pkResult.score);
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-3">
            <Swords size={36} className="text-primary mx-auto" />
            <h1 className="text-2xl font-bold">
              {t("pk.challengeCreated")}
            </h1>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("pk.yourScore")}:
              </span>
              <span className={`text-xl font-bold ${RANK_COLORS[rank]}`}>
                {Math.round(pkResult.score)} ({rank})
              </span>
            </div>
          </div>

          {/* Share link */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="text-xs text-muted-foreground mb-2">
                {t("pk.shareLinkHint")}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm truncate font-mono">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}${pkResult.shareUrl}`
                    : pkResult.shareUrl}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button className="w-full h-11" onClick={handleShare}>
              <Share2 size={16} className="mr-2" />
              {t("pk.shareChallenge")}
            </Button>
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={() => {
                setPhase("select");
                setPkResult(null);
                setSelectedGameId(null);
              }}
            >
              <Swords size={16} className="mr-2" />
              {t("pk.createAnother")}
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-2">
            gametan.ai
          </div>
        </div>
      </div>
    );
  }

  // ─── Name input ───
  if (phase === "name") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-sm w-full space-y-6">
          <div className="text-center space-y-2">
            <Swords size={32} className="text-primary mx-auto" />
            <h2 className="text-xl font-bold">
              {t("pk.enterName")}
            </h2>
          </div>
          <input
            type="text"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder={t("pk.yourName")}
            maxLength={30}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") setPhase("playing");
            }}
          />
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setCreatorName(t("pk.anonymous"));
                setPhase("playing");
              }}
            >
              {t("pk.skip")}
            </Button>
            <Button className="flex-1" onClick={() => setPhase("playing")}>
              {t("pk.startGame")}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Game selection ───
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <Swords size={36} className="text-primary mx-auto" />
          <h1 className="text-2xl font-bold">
            {t("pk.challengeFriend")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("pk.pickGameHint")}
          </p>
        </div>

        {error && (
          <div className="text-center text-sm text-destructive">{error}</div>
        )}

        <div className="space-y-3">
          {games.map((game) => {
            const name =
              locale === "en" && game.nameEn ? game.nameEn : game.name;
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => {
                  setSelectedGameId(game.id);
                  setPhase("name");
                }}
                className="pressable w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg">
                  {game.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{name}</div>
                  <div className="text-xs text-muted-foreground">
                    ~{game.estimatedDurationSec}
                    {t("pk.secondsShort")}
                  </div>
                </div>
                <ArrowRight size={16} className="text-muted-foreground" />
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href="/quiz"
            className="text-xs text-muted-foreground hover:text-primary"
          >
            {t("pk.backToQuiz")}
          </Link>
        </div>
      </div>
    </div>
  );
}
