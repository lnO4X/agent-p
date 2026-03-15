/**
 * Shared Lucide icon component for talent categories.
 * Maps each TalentCategory to its corresponding Lucide icon.
 */

import {
  Zap,
  Target,
  Box,
  Brain,
  Lightbulb,
  Music,
  Search,
  Layers,
  Timer,
  Heart,
  Users,
  Shield,
  Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TalentCategory } from "@/types/talent";

export const TALENT_ICON_MAP: Record<TalentCategory, LucideIcon> = {
  reaction_speed: Zap,
  hand_eye_coord: Target,
  spatial_awareness: Box,
  memory: Brain,
  strategy_logic: Lightbulb,
  rhythm_sense: Music,
  pattern_recog: Search,
  multitasking: Layers,
  decision_speed: Timer,
  emotional_control: Heart,
  teamwork_tendency: Users,
  risk_assessment: Shield,
  resource_mgmt: Package,
};

export function TalentIcon({
  category,
  size = 16,
  className,
  strokeWidth,
}: {
  category: TalentCategory;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = TALENT_ICON_MAP[category];
  return <Icon size={size} className={className} strokeWidth={strokeWidth} />;
}
