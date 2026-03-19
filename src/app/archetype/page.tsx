"use client";

import Link from "next/link";
import { getAllArchetypes } from "@/lib/archetype";
import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function ArchetypeIndexPage() {
  const { t, locale } = useI18n();
  const isZh = locale === "zh";
  const archetypes = getAllArchetypes();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          GameTan
        </Link>
        <h1 className="text-3xl font-bold">{t("archetype.allTypes")}</h1>
        <p className="text-muted-foreground">{t("archetype.allTypesDesc")}</p>
      </div>

      {/* CTA */}
      <div className="flex justify-center gap-3">
        <Link href="/quiz">
          <Button size="lg" className="pressable gap-2">
            <Sparkles size={18} />
            {t("archetype.takeQuiz")}
          </Button>
        </Link>
        <Link href="/archetype/compatibility">
          <Button size="lg" variant="outline" className="pressable">
            {t("archetype.compatibility")}
          </Button>
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {archetypes.map((a) => (
          <Link
            key={a.id}
            href={`/archetype/${a.id}`}
            className="pressable group"
          >
            <div
              className="rounded-2xl p-4 space-y-2 border transition-all hover:shadow-lg hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${a.gradient[0]}15, ${a.gradient[1]}15)`,
                borderColor: `${a.gradient[0]}30`,
              }}
            >
              <div className="text-3xl">{a.icon}</div>
              <div>
                <h3 className="font-semibold text-sm">
                  {isZh ? a.name : a.nameEn}
                </h3>
                {isZh && a.nameEn && (
                  <p className="text-[10px] text-muted-foreground">{a.nameEn}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {isZh ? a.tagline : a.taglineEn}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
