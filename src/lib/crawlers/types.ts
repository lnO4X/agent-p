export interface CrawledGame {
  name: string;
  nameEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  developer?: string;
  publisher?: string;
  platforms: string[];
  genres: string[];
  tags: string[];
  rating?: number;
  popularity?: number;
  priceInfo?: string;
  releaseDate?: string;
  coverUrl?: string;
  sourceType: "steam" | "taptap";
}

export interface CrawlResult {
  games: CrawledGame[];
  errors: string[];
  source: string;
}
