"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getAllArchetypes, getArchetype } from "@/lib/archetype";
import { computeCompatibility } from "@/lib/archetype-compat";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Check, ThumbsUp, AlertTriangle } from "lucide-react";

export default function CompatibilityPage() {
  return (
    <Suspense>
      <CompatibilityContent />
    </Suspense>
  );
}

function CompatibilityContent() {
  const { t, locale } = useI18n();
  const isZh = locale === "zh";
  const searchParams = useSearchParams();
  const archetypes = getAllArchetypes();

  const [aId, setAId] = useState(searchParams.get("a") || "");
  const [bId, setBId] = useState(searchParams.get("b") || "");
  const [result, setResult] = useState<ReturnType<typeof computeCompatibility>>(null);
  const [showResult, setShowResult] = useState(false);

  // Auto-compute if both params are present
  useEffect(() => {
    if (aId && bId) {
      const r = computeCompatibility(aId, bId);
      setResult(r);
      setShowResult(!!r);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheck = () => {
    if (!aId || !bId) return;
    const r = computeCompatibility(aId, bId);
    setResult(r);
    setShowResult(!!r);
  };

  const archetypeA = aId ? getArchetype(aId) : null;
  const archetypeB = bId ? getArchetype(bId) : null;

  // Score color
  const scoreColor = result
    ? result.score >= 70
      ? "text-green-500"
      : result.score >= 45
        ? "text-yellow-500"
        : "text-red-500"
    : "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/archetype"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground pressable"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("archetype.exploreAll")}
        </Link>
        <Link href="/quiz">
          <Button size="sm" variant="outline" className="pressable gap-1.5">
            <Sparkles size={14} />
            {t("archetype.takeQuiz")}
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">{t("archetype.compatibility")}</h1>
        <p className="text-sm text-muted-foreground">{t("archetype.compatibilityDesc")}</p>
      </div>

      {/* Selector */}
      <div className="flex items-center gap-3">
        {/* Archetype A */}
        <div className="flex-1">
          <ArchetypeSelector
            value={aId}
            onChange={(id) => { setAId(id); setShowResult(false); }}
            archetypes={archetypes}
            isZh={isZh}
            label={isZh ? "玩家 A" : "Player A"}
          />
        </div>

        <div className="text-lg font-bold text-muted-foreground">
          {t("archetype.vsLabel")}
        </div>

        {/* Archetype B */}
        <div className="flex-1">
          <ArchetypeSelector
            value={bId}
            onChange={(id) => { setBId(id); setShowResult(false); }}
            archetypes={archetypes}
            isZh={isZh}
            label={isZh ? "玩家 B" : "Player B"}
          />
        </div>
      </div>

      {/* Check button */}
      {!showResult && (
        <div className="text-center">
          <Button
            size="lg"
            className="pressable"
            disabled={!aId || !bId}
            onClick={handleCheck}
          >
            {t("archetype.checkCompat")}
          </Button>
        </div>
      )}

      {/* Result */}
      {showResult && result && archetypeA && archetypeB && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Score */}
          <Card>
            <CardContent className="pt-5 text-center space-y-3">
              <div className="flex items-center justify-center gap-4">
                <Link href={`/archetype/${archetypeA.id}`} className="pressable text-center">
                  <div className="text-4xl">{archetypeA.icon}</div>
                  <p className="text-xs font-medium mt-1">
                    {isZh ? archetypeA.name : archetypeA.nameEn}
                  </p>
                </Link>
                <div className="space-y-1">
                  <div className={`text-4xl font-bold ${scoreColor}`}>
                    {result.score}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("archetype.compatScore")}
                  </div>
                </div>
                <Link href={`/archetype/${archetypeB.id}`} className="pressable text-center">
                  <div className="text-4xl">{archetypeB.icon}</div>
                  <p className="text-xs font-medium mt-1">
                    {isZh ? archetypeB.name : archetypeB.nameEn}
                  </p>
                </Link>
              </div>
              <div
                className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  background: result.score >= 70
                    ? "oklch(0.9 0.1 145)"
                    : result.score >= 45
                      ? "oklch(0.9 0.1 85)"
                      : "oklch(0.9 0.1 25)",
                  color: result.score >= 70
                    ? "oklch(0.4 0.15 145)"
                    : result.score >= 45
                      ? "oklch(0.4 0.15 85)"
                      : "oklch(0.4 0.15 25)",
                }}
              >
                {t(result.labelKey)}
              </div>
            </CardContent>
          </Card>

          {/* Analysis */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <h3 className="font-semibold text-sm">{t("archetype.compatAnalysis")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isZh ? result.dynamic : result.dynamicEn}
              </p>
            </CardContent>
          </Card>

          {/* Strengths & Challenges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-green-500" />
                  <h3 className="font-semibold text-sm">
                    {isZh ? "优势" : "Strengths"}
                  </h3>
                </div>
                <ul className="space-y-1.5">
                  {(isZh ? result.strengths : result.strengthsEn).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <h3 className="font-semibold text-sm">
                    {isZh ? "挑战" : "Challenges"}
                  </h3>
                </div>
                <ul className="space-y-1.5">
                  {(isZh ? result.challenges : result.challengesEn).map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Share + retry */}
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="pressable"
              onClick={() => {
                const url = `${window.location.origin}/archetype/compatibility?a=${aId}&b=${bId}`;
                navigator.clipboard?.writeText(url);
              }}
            >
              {t("archetype.shareResult")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="pressable"
              onClick={() => { setAId(""); setBId(""); setShowResult(false); }}
            >
              {isZh ? "重新选择" : "Try Again"}
            </Button>
          </div>
        </div>
      )}

      {/* Quiz CTA */}
      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground mb-2">
          {isZh ? "还不知道自己的原型？" : "Don't know your archetype yet?"}
        </p>
        <Link href="/quiz">
          <Button className="pressable gap-2">
            <Sparkles size={16} />
            {t("archetype.takeQuiz")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

/** Compact archetype selector dropdown */
function ArchetypeSelector({
  value,
  onChange,
  archetypes,
  isZh,
  label,
}: {
  value: string;
  onChange: (id: string) => void;
  archetypes: ReturnType<typeof getAllArchetypes>;
  isZh: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? getArchetype(value) : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-3 rounded-xl border text-left pressable hover:border-primary/50 transition-colors"
      >
        {selected ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selected.icon}</span>
            <div>
              <p className="text-sm font-medium">
                {isZh ? selected.name : selected.nameEn}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{label}</p>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-xl shadow-lg max-h-64 overflow-y-auto">
            {archetypes.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => { onChange(a.id); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors ${
                  a.id === value ? "bg-primary/5" : ""
                }`}
              >
                <span className="text-lg">{a.icon}</span>
                <span className="text-sm">{isZh ? a.name : a.nameEn}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
