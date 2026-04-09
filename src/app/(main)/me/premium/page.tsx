"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Target,
  Bot,
  FileText,
  TrendingUp,
  Users,
  BarChart3,
  Check,
  ArrowLeft,
  Loader2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PRO_FEATURES = [
  { icon: Target, labelKey: "premium.feature1" },
  { icon: Bot, labelKey: "premium.feature2" },
  { icon: FileText, labelKey: "premium.feature3" },
  { icon: TrendingUp, labelKey: "premium.feature4" },
  { icon: Users, labelKey: "premium.feature5" },
  { icon: BarChart3, labelKey: "premium.feature6" },
];

const PRODUCT = {
  priceUsd: "$3.99",
  days: 365,
};

export default function PremiumPage() {
  const { t } = useI18n();
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<"free" | "premium">("free");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchased") === "1") {
      setSuccess(t("premium.purchaseActivated"));
      window.history.replaceState({}, "", "/me/premium");
    }

    fetch("/api/partners")
      .then((r) => r.json())
      .then((pJson) => {
        if (pJson.tier) setCurrentTier(pJson.tier);
        if (pJson.tierExpiresAt) setExpiresAt(pJson.tierExpiresAt);
      })
      .catch(() => {});
  }, [t]);

  const handlePurchase = async () => {
    setPurchasing(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: "deep_report" }),
      });
      const json = await res.json();

      if (json.success && json.data?.url) {
        window.location.href = json.data.url;
        return;
      } else {
        setError(json.error || t("premium.purchaseFailed"));
      }
    } catch {
      setError(t("premium.networkError"));
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/me"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        {t("common.back")}
      </Link>

      {/* Hero */}
      <div className="text-center space-y-3 py-4">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
          <Crown size={32} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold">{t("premium.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("premium.price")}</p>
      </div>

      {/* Current status */}
      <Card
        className={cn(
          currentTier === "premium"
            ? "border-accent/30 bg-accent/5"
            : ""
        )}
      >
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("premium.current")}
            </span>
            <span
              className={cn(
                "text-sm font-semibold",
                currentTier === "premium" ? "text-accent" : ""
              )}
            >
              {currentTier === "premium"
                ? t("premium.premiumLabel")
                : t("premium.free")}
            </span>
          </div>
          {expiresAt && (
            <div className="text-xs text-muted-foreground mt-1">
              {t("premium.expiresAt", {
                date: new Date(expiresAt).toLocaleDateString(),
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Free tier comparison */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("premium.freeIncluded")}
          </h3>
          <div className="space-y-2">
            {["premium.freeFeature1", "premium.freeFeature2", "premium.freeFeature3"].map((key) => (
              <div key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check size={14} className="text-muted-foreground/60 flex-shrink-0" />
                <span>{t(key)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pro features */}
      <Card className="border-accent/20">
        <CardContent className="pt-4 pb-4 space-y-3">
          <h3 className="text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-1">
            <Zap size={12} />
            {t("premium.proUnlocks")}
          </h3>
          {PRO_FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.labelKey} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-accent" />
                </div>
                <span className="text-sm">{t(f.labelKey)}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Purchase CTA */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="pt-4 pb-4 space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{PRODUCT.priceUsd}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {t("premium.oneTimePurchase")}
            </div>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={purchasing || currentTier === "premium"}
            className="w-full bg-accent hover:bg-accent/90 text-white"
          >
            {purchasing ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Crown size={16} className="mr-2" />
            )}
            {currentTier === "premium"
              ? t("premium.alreadyPremium")
              : t("premium.buyNowBtn")}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground">
            {t("premium.secureCheckout")}
          </p>
        </CardContent>
      </Card>

      {/* Success / Error */}
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
      {success && (
        <p className="text-xs text-green-500 flex items-center justify-center gap-1">
          <Check size={14} />
          {success}
        </p>
      )}
    </div>
  );
}
