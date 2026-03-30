"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { PartnerCard } from "./partner-card";
import { Brain } from "lucide-react";
import type { Partner } from "@/types/partner";

export function PartnerHub() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const isZh = locale === "zh";

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/partners");
        if (res.ok) {
          const data = await res.json();
          setPartners(data.data || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Find the talent coach (slot=0) — auto-navigate to it
  const coach = partners.find((p) => p.slot === 0);

  useEffect(() => {
    if (!loading && coach) {
      router.replace(`/chat/${coach.id}`);
    }
  }, [loading, coach, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  // If no coach found yet (rare — API creates it), show placeholder
  if (!coach) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-4">
        <Brain size={48} className="text-primary mx-auto" />
        <h1 className="text-xl font-semibold">
          {isZh ? "天赋教练" : "Talent Coach"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isZh
            ? "AI 教练正在准备中..."
            : "Your AI coach is being set up..."}
        </p>
      </div>
    );
  }

  // Redirecting to coach conversation
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
    </div>
  );
}
