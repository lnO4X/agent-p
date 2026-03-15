import type { GamePlugin } from "@/types/game";
import type { TalentCategory } from "@/types/talent";
import { TALENT_CATEGORIES } from "@/types/talent";

class GameRegistry {
  private games: Map<string, GamePlugin> = new Map();

  register(game: GamePlugin): void {
    if (this.games.has(game.id)) {
      throw new Error(`Game "${game.id}" already registered`);
    }
    this.games.set(game.id, game);
  }

  get(id: string): GamePlugin | undefined {
    return this.games.get(id);
  }

  getAll(): GamePlugin[] {
    return Array.from(this.games.values());
  }

  getByTalent(category: TalentCategory): GamePlugin[] {
    return this.getAll().filter(
      (g) =>
        g.primaryTalent === category ||
        g.secondaryTalents?.includes(category)
    );
  }

  /** Get the full test set; if mobile=true, skip games that are not mobile compatible */
  getFullTestSet(mobile: boolean = false): GamePlugin[] {
    const all = mobile
      ? this.getAll().filter((g) => g.mobileCompatible !== false)
      : this.getAll();

    return TALENT_CATEGORIES.map(
      (cat) => all.find((g) => g.primaryTalent === cat)!
    ).filter(Boolean);
  }

  getMetadata() {
    return this.getAll().map((g) => ({
      id: g.id,
      name: g.name,
      nameEn: g.nameEn,
      description: g.description,
      primaryTalent: g.primaryTalent,
      secondaryTalents: g.secondaryTalents,
      difficulty: g.difficulty,
      estimatedDurationSec: g.estimatedDurationSec,
      instructions: g.instructions,
      icon: g.icon,
      mobileCompatible: g.mobileCompatible !== false,
    }));
  }
}

export const gameRegistry = new GameRegistry();
