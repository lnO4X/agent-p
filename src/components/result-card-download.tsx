"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2 } from "lucide-react";
import { trackEvent as track } from "@/lib/analytics";
import { useI18n } from "@/i18n/context";
import type { Archetype } from "@/lib/archetype";
import type { TalentCategory } from "@/types/talent";

interface ResultCardDownloadProps {
  archetype: Archetype;
  talentScores?: Partial<Record<TalentCategory, number>> | null;
  scores?: number[] | null;
  isZh: boolean;
}

function buildCardUrl(
  archetype: Archetype,
  talentScores?: Partial<Record<TalentCategory, number>> | null,
  scores?: number[] | null,
  isZh?: boolean
): string {
  const params = new URLSearchParams();
  params.set("archetype", archetype.id);
  if (isZh) params.set("lang", "zh");

  if (talentScores && Object.keys(talentScores).length > 0) {
    const scoresStr = Object.entries(talentScores)
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
    params.set("scores", scoresStr);
  } else if (scores && scores.length === 3) {
    params.set("s", scores.map(Math.round).join("-"));
  }

  return `/api/result-card?${params.toString()}`;
}

export function ResultCardDownload({
  archetype,
  talentScores,
  scores,
  isZh,
}: ResultCardDownloadProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const fetchCardBlob = useCallback(async (): Promise<Blob | null> => {
    const url = buildCardUrl(archetype, talentScores, scores, isZh);
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.blob();
  }, [archetype, talentScores, scores, isZh]);

  const handleDownload = useCallback(async () => {
    setLoading(true);
    track("result_card_download", { archetype: archetype.id });
    try {
      const blob = await fetchCardBlob();
      if (!blob) return;

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `gametan-${archetype.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // download failed silently
    } finally {
      setLoading(false);
    }
  }, [archetype, fetchCardBlob]);

  const handleShare = useCallback(async () => {
    if (!navigator.share) {
      // Fallback to download
      handleDownload();
      return;
    }

    setLoading(true);
    track("result_card_share", { archetype: archetype.id });
    try {
      const blob = await fetchCardBlob();
      if (!blob) return;

      const file = new File([blob], `gametan-${archetype.id}.png`, {
        type: "image/png",
      });

      await navigator.share({
        files: [file],
        title: t("result.card.shareTitle", { name: isZh ? archetype.name : archetype.nameEn }),
        text: t("result.card.shareText", { name: isZh ? archetype.name : archetype.nameEn, icon: archetype.icon }),
      });
    } catch {
      // share cancelled or failed
    } finally {
      setLoading(false);
    }
  }, [archetype, fetchCardBlob, handleDownload, isZh]);

  const canShareFiles =
    typeof navigator !== "undefined" &&
    navigator.share !== undefined &&
    navigator.canShare !== undefined;

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handleDownload}
        disabled={loading}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
        {t("result.card.save")}
      </Button>
      {canShareFiles && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleShare}
          disabled={loading}
        >
          <Share2 size={14} />
          {t("result.card.share")}
        </Button>
      )}
    </div>
  );
}
