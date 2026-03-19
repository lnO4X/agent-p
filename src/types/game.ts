import type { TalentCategory } from "./talent";

export interface GameComponentProps {
  onComplete: (result: GameRawResult) => void;
  onAbort: () => void;
}

export interface GameRawResult {
  rawScore: number;
  durationMs: number;
  metadata: Record<string, unknown>;
}

export interface GameScorer {
  normalize(
    rawScore: number,
    durationMs?: number,
    metadata?: Record<string, unknown>
  ): number;
  perfectRawScore: number;
  distribution: {
    mean: number;
    stdDev: number;
  };
  higherIsBetter: boolean;
}

export interface GamePlugin {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  primaryTalent: TalentCategory;
  secondaryTalents?: TalentCategory[];
  difficulty: "easy" | "medium" | "hard";
  estimatedDurationSec: number;
  instructions: string;
  icon: string;
  scorer: GameScorer;
  component: React.ComponentType<GameComponentProps>;
  /** Whether this game works on mobile/touch devices. Defaults to true. */
  mobileCompatible?: boolean;
}
