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

const PRODUCT = {
  priceZh: "¥29.9",
  priceEn: "$4.99",
  days: 365,
};

export default function PremiumPage() {
  const { t, locale } = useI18n();
  const isZh = locale === "zh";
  const [code, setCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<"free" | "premium">("free");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    // Check for successful purchase redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchased") === "1") {
      setSuccess(isZh ? "🎉 购买成功！Premium 已激活" : "🎉 Purchase successful! Premium activated");
      // Clean URL
      window.history.replaceState({}, "", "/me/premium");
    }

    fetch("/api/partners")
      .then((r) => r.json())
      .then((pJson) => {
        if (pJson.tier) setCurrentTier(pJson.tier);
        if (pJson.tierExpiresAt) setExpiresAt(pJson.tierExpiresAt);
      })
      .catch(() => {});
  }, [isZh]);

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
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: "deep_report" }),
      });
      const json = await res.json();

      if (json.success && json.data?.url) {
        // Redirect to LemonSqueezy checkout
        window.location.href = json.data.url;
        return; // Don't set purchasing=false — page is navigating away
      } else {
        setError(json.error || (isZh ? "开通失败，请重试" : "Purchase failed"));
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

      {/* Purchase */}
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="pt-4 pb-4 space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold">
              {isZh ? PRODUCT.priceZh : PRODUCT.priceEn}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {isZh ? "一次购买，365天 Premium" : "One-time purchase, 365 days Premium"}
            </div>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={purchasing || currentTier === "premium"}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            {purchasing ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Crown size={16} className="mr-2" />
            )}
            {currentTier === "premium"
              ? (isZh ? "已是 Premium" : "Already Premium")
              : (isZh ? "立即购买" : "Buy Now")}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground">
            {isZh
              ? "安全支付由 LemonSqueezy 提供 · 支持信用卡/PayPal"
              : "Secure checkout by LemonSqueezy · Credit card & PayPal"}
          </p>
        </CardContent>
      </Card>

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
