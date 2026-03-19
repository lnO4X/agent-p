"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Crown,
  Bot,
  MessageSquare,
  Brain,
  Sparkles,
  Check,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Bot, labelKey: "premium.feature1" },
  { icon: MessageSquare, labelKey: "premium.feature2" },
  { icon: Brain, labelKey: "premium.feature3" },
  { icon: Sparkles, labelKey: "premium.feature4" },
];

const PLANS = [
  { id: "monthly", days: 30, priceZh: "¥9.9", priceEn: "$1.49", labelKey: "premium.monthly" },
  { id: "quarterly", days: 90, priceZh: "¥24.9", priceEn: "$3.99", labelKey: "premium.quarterly", popular: true },
  { id: "yearly", days: 365, priceZh: "¥79.9", priceEn: "$12.99", labelKey: "premium.yearly" },
];

export default function PremiumPage() {
  const { t, locale } = useI18n();
  const isZh = locale === "zh";
  const [code, setCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("quarterly");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<"free" | "premium">("free");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/partners")
      .then((r) => r.json())
      .then((pJson) => {
        if (pJson.tier) setCurrentTier(pJson.tier);
        if (pJson.tierExpiresAt) setExpiresAt(pJson.tierExpiresAt);
      })
      .catch(() => {});
  }, []);

  const handleActivate = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setActivating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/billing/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const json = await res.json();

      if (json.success) {
        setCurrentTier("premium");
        setExpiresAt(json.data.expiresAt);
        setSuccess(
          t("premium.activateSuccess", { days: json.data.durationDays })
        );
        setCode("");
      } else {
        setError(json.error?.message || (isZh ? "激活失败，请重试" : "Activation failed"));
      }
    } catch {
      setError(isZh ? "网络错误，请重试" : "Network error");
    } finally {
      setActivating(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/billing/mock-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan }),
      });
      const json = await res.json();

      if (json.success) {
        setCurrentTier("premium");
        setExpiresAt(json.data.expiresAt);
        setSuccess(
          t("premium.purchaseSuccess", { days: json.data.durationDays })
        );
      } else {
        setError(json.error?.message || (isZh ? "开通失败，请重试" : "Purchase failed"));
      }
    } catch {
      setError(isZh ? "网络错误，请重试" : "Network error");
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
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto">
          <Crown size={32} className="text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold">{t("premium.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("premium.price")}</p>
      </div>

      {/* Current status */}
      <Card
        className={cn(
          currentTier === "premium"
            ? "border-yellow-500/30 bg-yellow-500/5"
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
                currentTier === "premium" ? "text-yellow-600" : ""
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

      {/* Features */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.labelKey} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-primary" />
                </div>
                <span className="text-sm">{t(f.labelKey)}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Plan selection */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">{t("premium.choosePlan")}</h2>
        <div className="grid grid-cols-3 gap-2">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                "relative rounded-xl border-2 p-3 text-center transition-all pressable",
                selectedPlan === plan.id
                  ? "border-yellow-500 bg-yellow-500/5"
                  : "border-border hover:border-yellow-500/40"
              )}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                  {t("premium.popular")}
                </span>
              )}
              <div className="text-sm font-medium mt-1">{t(plan.labelKey)}</div>
              <div className="text-lg font-bold mt-1">
                {isZh ? plan.priceZh : plan.priceEn}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {t("premium.days", { days: plan.days })}
              </div>
            </button>
          ))}
        </div>

        {/* Mock notice */}
        <p className="text-xs text-center text-muted-foreground">
          {t("premium.mockNotice")}
        </p>

        {/* Purchase button */}
        <Button
          onClick={handlePurchase}
          disabled={purchasing}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          {purchasing ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Crown size={16} className="mr-2" />
          )}
          {t("premium.buyNow")}
        </Button>
      </div>

      {/* Success / Error messages */}
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
      {success && (
        <p className="text-xs text-green-500 flex items-center justify-center gap-1">
          <Check size={14} />
          {success}
        </p>
      )}

      {/* Activation code input */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <h2 className="text-sm font-semibold">{t("premium.activate")}</h2>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t("premium.activatePlaceholder")}
              className="font-mono tracking-widest uppercase"
              maxLength={12}
            />
            <Button
              onClick={handleActivate}
              disabled={activating || !code.trim()}
              className="flex-shrink-0"
              variant="outline"
            >
              {activating ? "..." : t("common.confirm")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
