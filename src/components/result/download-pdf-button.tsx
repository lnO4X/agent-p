"use client";

import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";

interface Props {
  readonly talentScores: Record<string, number>;
  readonly archetype: { id: string; name: string; nameEn: string } | null;
  readonly overallScore: number;
  readonly tier: string;
  readonly userLabel?: string;
}

/**
 * Pro-user PDF download button. Dynamically imports the PDF generator so
 * jspdf (~330 KB) only loads when clicked. v1 is English-only (jsPDF fonts
 * cannot render CJK).
 */
export function DownloadPDFButton({
  talentScores,
  archetype,
  overallScore,
  tier,
  userLabel,
}: Props) {
  const { locale } = useI18n();
  const isZh = locale === "zh";
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (): Promise<void> => {
    setError(null);
    setGenerating(true);
    try {
      const { generatePDFReport } = await import("@/lib/pdf-report");
      const blob = generatePDFReport({
        talentScores,
        archetype,
        overallScore,
        tier,
        userLabel,
        testedAt: new Date(),
        locale: isZh ? "zh" : "en",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gametan-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(isZh ? `下载失败：${msg}` : `Download failed: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  const label = generating
    ? isZh ? "生成中..." : "Generating..."
    : isZh ? "下载 PDF 报告" : "Download PDF Report";

  return (
    <div className="flex flex-col items-start gap-1">
      <Button onClick={handleClick} disabled={generating} variant="outline" size="sm">
        {generating ? <Loader2 className="animate-spin mr-2" size={14} /> : <FileText className="mr-2" size={14} />}
        {label}
      </Button>
      {isZh && <p className="text-[10px] text-muted-foreground">PDF 目前仅支持英文版（v1）</p>}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
