import {
  Bot,
  Brain,
  Lightbulb,
  Shield,
  Sword,
  Heart,
  Compass,
  Flame,
  Star,
  Sparkles,
  Gem,
  Crown,
  type LucideIcon,
} from "lucide-react";

/**
 * 12 curated Lucide icons for partner avatars.
 * Keyed by icon name string (stored in DB).
 */
export const PARTNER_ICON_MAP: Record<string, LucideIcon> = {
  Bot,
  Brain,
  Lightbulb,
  Shield,
  Sword,
  Heart,
  Compass,
  Flame,
  Star,
  Sparkles,
  Gem,
  Crown,
};

/**
 * Get the Lucide icon component for a partner avatar name.
 * Falls back to Bot if name not found.
 */
export function getPartnerIcon(name: string): LucideIcon {
  return PARTNER_ICON_MAP[name] || Bot;
}

/**
 * All available partner icon names (for icon selection grid).
 */
export const PARTNER_ICON_NAMES = Object.keys(PARTNER_ICON_MAP);
