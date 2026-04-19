"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Crown, type LucideIcon } from "lucide-react";

/**
 * Sub-components for /for-teams page. Kept client-side because the parent
 * is already a client component (uses useI18n). Extracted to keep page.tsx
 * below the 450-line target per spec.
 */

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export function FeatureCard({ icon: Icon, title, desc }: FeatureCardProps) {
  return (
    <Card className="border-primary/10 bg-primary/[0.02]">
      <CardContent className="pt-5 pb-5 space-y-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon size={20} className="text-primary" />
        </div>
        <div className="font-semibold text-base">{title}</div>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

interface StepProps {
  step: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}

export function Step({ step, icon: Icon, title, desc }: StepProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Icon size={22} className="text-primary" />
      </div>
      <div className="flex-1">
        <div className="text-base font-semibold">
          <span className="text-primary mr-2">{step}.</span>
          {title}
        </div>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

interface PricingTierProps {
  name: string;
  price: string;
  priceSuffix?: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
  featuredBadge?: string;
  external?: boolean;
}

export function PricingTier({
  name,
  price,
  priceSuffix,
  features,
  ctaLabel,
  ctaHref,
  featured,
  featuredBadge,
  external,
}: PricingTierProps) {
  const CtaWrapper = ({ children }: { children: React.ReactNode }) =>
    external ? (
      <a href={ctaHref} className="block">
        {children}
      </a>
    ) : (
      <Link href={ctaHref} className="block">
        {children}
      </Link>
    );

  if (featured) {
    return (
      <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-6 space-y-4 flex flex-col relative">
        {featuredBadge && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-semibold px-3 py-0.5 rounded-full flex items-center gap-1">
            <Crown size={12} />
            {featuredBadge}
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-accent">{name}</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold">{price}</span>
            {priceSuffix && (
              <span className="text-sm text-muted-foreground">{priceSuffix}</span>
            )}
          </div>
        </div>
        <ul className="space-y-2 text-sm flex-1">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check size={16} className="text-accent shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <CtaWrapper>
          <Button className="w-full h-10 bg-accent text-accent-foreground hover:bg-accent/90">
            {ctaLabel}
          </Button>
        </CtaWrapper>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-muted/30 p-6 space-y-4 flex flex-col">
      <div>
        <div className="text-sm font-semibold text-muted-foreground">{name}</div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold">{price}</span>
          {priceSuffix && (
            <span className="text-sm text-muted-foreground">{priceSuffix}</span>
          )}
        </div>
      </div>
      <ul className="space-y-2 text-sm flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check size={16} className="text-primary shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <CtaWrapper>
        <Button variant="outline" className="w-full h-10">
          {ctaLabel}
        </Button>
      </CtaWrapper>
    </div>
  );
}
