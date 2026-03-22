"use client";

import type { ReactNode } from "react";
import { ARCHETYPES } from "@/lib/archetype";

interface ArchetypeIconProps {
  archetypeId: string;
  size?: number;
  className?: string;
  gradient?: [string, string];
}

// Each archetype gets a unique geometric SVG icon
const ICON_ELEMENTS: Record<string, (gradId: string) => ReactNode> = {
  // Lightning Assassin — lightning bolt
  "lightning-assassin": (g) => (
    <>
      <path
        d="M28 4L14 22h8l-4 22L34 24h-8l4-20z"
        fill={`url(#${g})`}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </>
  ),

  // Berserker — crossed axes / angular explosion
  berserker: (g) => (
    <>
      <path
        d="M12 8l6 12-6 12"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M36 8l-6 12 6 12"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 20l16 8L8 36"
        fill={`url(#${g})`}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M40 20l-16 8 16 8"
        fill={`url(#${g})`}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle cx={24} cy={20} r={3} fill={`url(#${g})`} stroke="currentColor" strokeWidth={2} />
    </>
  ),

  // Sharpshooter — crosshair / target reticle
  sharpshooter: (g) => (
    <>
      <circle cx={24} cy={24} r={14} stroke="currentColor" strokeWidth={2} fill="none" />
      <circle cx={24} cy={24} r={7} stroke="currentColor" strokeWidth={2} fill={`url(#${g})`} fillOpacity={0.3} />
      <circle cx={24} cy={24} r={2} fill={`url(#${g})`} />
      <line x1={24} y1={4} x2={24} y2={12} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1={24} y1={36} x2={24} y2={44} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1={4} y1={24} x2={12} y2={24} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1={36} y1={24} x2={44} y2={24} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </>
  ),

  // Duelist — crossed swords
  duelist: (g) => (
    <>
      <path
        d="M14 6l10 16L14 6zM34 6L24 22 34 6z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M14 6l10 16"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <path
        d="M34 6l-10 16"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <path
        d="M18 18h12"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M24 22v16"
        stroke={`url(#${g})`}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M18 38l6 4 6-4"
        fill={`url(#${g})`}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </>
  ),

  // Oracle — brain / all-seeing eye
  oracle: (g) => (
    <>
      <ellipse cx={24} cy={24} rx={16} ry={10} stroke="currentColor" strokeWidth={2} fill="none" />
      <circle cx={24} cy={24} r={6} fill={`url(#${g})`} stroke="currentColor" strokeWidth={2} />
      <circle cx={24} cy={24} r={2.5} fill="currentColor" />
      <path
        d="M8 24c4-10 12-16 16-16s12 6 16 16"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M8 24c4 10 12 16 16 16s12-6 16-16"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),

  // Fortress — heavy castle/shield shape
  fortress: (g) => (
    <>
      <path
        d="M10 18V40h28V18"
        fill={`url(#${g})`}
        fillOpacity={0.2}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M10 18l14-12 14 12"
        fill={`url(#${g})`}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Battlements */}
      <rect x={14} y={26} width={4} height={14} fill={`url(#${g})`} stroke="currentColor" strokeWidth={1.5} />
      <rect x={22} y={22} width={4} height={18} fill={`url(#${g})`} stroke="currentColor" strokeWidth={1.5} />
      <rect x={30} y={26} width={4} height={14} fill={`url(#${g})`} stroke="currentColor" strokeWidth={1.5} />
    </>
  ),

  // Shadow Strategist — dagger / stealth mask
  "shadow-strategist": (g) => (
    <>
      <path
        d="M24 4v28"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <path
        d="M20 8l4-4 4 4"
        fill={`url(#${g})`}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M18 30l6 4 6-4"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 34l8 10 8-10"
        fill={`url(#${g})`}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Shadow lines */}
      <line x1={10} y1={16} x2={16} y2={20} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
      <line x1={38} y1={16} x2={32} y2={20} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
    </>
  ),

  // Gambler — dice / diamond
  gambler: (g) => (
    <>
      <rect
        x={10}
        y={10}
        width={28}
        height={28}
        rx={4}
        transform="rotate(45 24 24)"
        fill={`url(#${g})`}
        fillOpacity={0.25}
        stroke="currentColor"
        strokeWidth={2}
      />
      <circle cx={24} cy={18} r={2} fill="currentColor" />
      <circle cx={18} cy={24} r={2} fill="currentColor" />
      <circle cx={30} cy={24} r={2} fill="currentColor" />
      <circle cx={24} cy={30} r={2} fill="currentColor" />
      <circle cx={24} cy={24} r={2} fill={`url(#${g})`} />
    </>
  ),

  // Rhythm Walker — sound wave / music pulse
  "rhythm-walker": (g) => (
    <>
      <path
        d="M6 24c2-6 4-12 6-12s4 24 6 24 4-20 6-20 4 16 6 16 4-24 6-24 4 10 6 10"
        fill="none"
        stroke={`url(#${g})`}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={8} cy={24} r={2} fill="currentColor" />
      <circle cx={40} cy={18} r={2} fill="currentColor" />
      {/* Beat markers */}
      <line x1={14} y1={40} x2={14} y2={36} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1={20} y1={40} x2={20} y2={34} stroke={`url(#${g})`} strokeWidth={2} strokeLinecap="round" />
      <line x1={26} y1={40} x2={26} y2={32} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1={32} y1={40} x2={32} y2={34} stroke={`url(#${g})`} strokeWidth={2} strokeLinecap="round" />
      <line x1={38} y1={40} x2={38} y2={36} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </>
  ),

  // Commander — star / command insignia badge
  commander: (g) => (
    <>
      <polygon
        points="24,4 28,16 42,16 31,25 35,38 24,30 13,38 17,25 6,16 20,16"
        fill={`url(#${g})`}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle cx={24} cy={20} r={4} fill="none" stroke="currentColor" strokeWidth={1.5} />
    </>
  ),

  // Weaver — interconnected geometric web
  weaver: (g) => (
    <>
      <circle cx={24} cy={10} r={4} fill={`url(#${g})`} stroke="currentColor" strokeWidth={2} />
      <circle cx={12} cy={30} r={4} fill={`url(#${g})`} stroke="currentColor" strokeWidth={2} />
      <circle cx={36} cy={30} r={4} fill={`url(#${g})`} stroke="currentColor" strokeWidth={2} />
      <circle cx={24} cy={38} r={3} fill={`url(#${g})`} fillOpacity={0.5} stroke="currentColor" strokeWidth={1.5} />
      {/* Connecting lines */}
      <line x1={24} y1={14} x2={12} y2={26} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1={24} y1={14} x2={36} y2={26} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1={12} y1={34} x2={36} y2={34} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1={16} y1={30} x2={32} y2={30} stroke={`url(#${g})`} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={24} y1={14} x2={24} y2={35} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
    </>
  ),

  // Sentinel — hexagonal shield with inner chevron
  sentinel: (g) => (
    <>
      <polygon
        points="24,4 40,14 40,34 24,44 8,34 8,14"
        fill={`url(#${g})`}
        fillOpacity={0.2}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <polygon
        points="24,12 34,18 34,32 24,38 14,32 14,18"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Inner chevron */}
      <path
        d="M18 26l6-6 6 6"
        stroke={`url(#${g})`}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1={24} y1={20} x2={24} y2={34} stroke={`url(#${g})`} strokeWidth={2} strokeLinecap="round" />
    </>
  ),

  // Shapeshifter — morphing mask / theatrical
  shapeshifter: (g) => (
    <>
      <path
        d="M12 16c0-6 5-10 12-10s12 4 12 10v8c0 10-5 18-12 18S12 34 12 24v-8z"
        fill={`url(#${g})`}
        fillOpacity={0.2}
        stroke="currentColor"
        strokeWidth={2}
      />
      {/* Left eye — happy */}
      <path d="M17 20c1-2 3-2 4 0" stroke="currentColor" strokeWidth={2} strokeLinecap="round" fill="none" />
      {/* Right eye — sharp */}
      <path d="M27 18l4 2-4 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Split line */}
      <line x1={24} y1={10} x2={24} y2={38} stroke="currentColor" strokeWidth={1} strokeDasharray="2 2" opacity={0.5} />
      {/* Mouth — half smile, half straight */}
      <path d="M16 30c2 3 4 4 8 4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" fill="none" />
      <path d="M24 34h8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </>
  ),

  // Lone Wolf — wolf fang / angular wolf silhouette
  "lone-wolf": (g) => (
    <>
      {/* Ears */}
      <path d="M14 8l4 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <path d="M34 8l-4 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      {/* Head shape */}
      <path
        d="M14 8l4 12-4 8 10 14 10-14-4-8 4-12"
        fill={`url(#${g})`}
        fillOpacity={0.25}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Eyes */}
      <circle cx={20} cy={22} r={2} fill="currentColor" />
      <circle cx={28} cy={22} r={2} fill="currentColor" />
      {/* Snout */}
      <path d="M22 28l2 3 2-3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  // Collector — gem / diamond with facets
  collector: (g) => (
    <>
      <polygon
        points="24,4 38,16 24,44 10,16"
        fill={`url(#${g})`}
        fillOpacity={0.3}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Top facet */}
      <polygon
        points="24,4 38,16 10,16"
        fill={`url(#${g})`}
        fillOpacity={0.5}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Inner facet lines */}
      <line x1={16} y1={16} x2={24} y2={44} stroke="currentColor" strokeWidth={1.5} opacity={0.6} />
      <line x1={32} y1={16} x2={24} y2={44} stroke="currentColor" strokeWidth={1.5} opacity={0.6} />
      <line x1={24} y1={4} x2={24} y2={16} stroke="currentColor" strokeWidth={1.5} opacity={0.6} />
      {/* Sparkle */}
      <circle cx={20} cy={12} r={1} fill="currentColor" opacity={0.8} />
    </>
  ),

  // Chaos Child — tornado / swirl with dynamic angles
  "chaos-child": (g) => (
    <>
      <path
        d="M20 8c12-2 18 4 14 10"
        stroke={`url(#${g})`}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 14c14-2 22 4 16 10"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 22c12 0 18 4 12 10"
        stroke={`url(#${g})`}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 30c8 0 14 4 8 8"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M20 36c4 0 8 2 4 6"
        stroke={`url(#${g})`}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      {/* Sparks */}
      <circle cx={34} cy={10} r={1.5} fill={`url(#${g})`} />
      <circle cx={10} cy={28} r={1.5} fill="currentColor" />
      <circle cx={38} cy={22} r={1} fill="currentColor" opacity={0.6} />
    </>
  ),
};

export function ArchetypeIcon({
  archetypeId,
  size = 48,
  className,
  gradient,
}: ArchetypeIconProps) {
  const archetype = ARCHETYPES[archetypeId];
  const renderIcon = ICON_ELEMENTS[archetypeId];
  if (!renderIcon) return null;

  const colors = gradient ?? archetype?.gradient ?? ["currentColor", "currentColor"];
  const gradId = `archicon-${archetypeId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-label={archetype?.nameEn ?? archetypeId}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      {renderIcon(gradId)}
    </svg>
  );
}

/** Get all archetype IDs that have icons */
export function getArchetypeIconIds(): string[] {
  return Object.keys(ICON_ELEMENTS);
}
