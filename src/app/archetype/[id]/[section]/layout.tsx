import type { Metadata } from "next";
import { getArchetype } from "@/lib/archetype";
import { ARCHETYPE_SECTIONS } from "@/lib/archetype-content";

interface Props {
  params: Promise<{ id: string; section: string }>;
}

const sectionMeta: Record<string, { title: (n: string, nEn: string) => string; desc: (n: string, nEn: string) => string }> = {
  games: {
    title: (_, nEn) => `Best Games for ${nEn} | GameTan`,
    desc: (_, nEn) => `Top 5 game recommendations for the ${nEn} archetype. Find your perfect games based on your gaming DNA.`,
  },
  relationships: {
    title: (_, nEn) => `${nEn} Relationships & Compatibility | GameTan`,
    desc: (_, nEn) => `How the ${nEn} archetype interacts with all 16 gamer types. Discover your allies, rivals, and soulmates.`,
  },
  growth: {
    title: (_, nEn) => `${nEn} Growth Path & Training | GameTan`,
    desc: (_, nEn) => `Level up your ${nEn} archetype. Training games, weakness analysis, and evolution path.`,
  },
  characters: {
    title: (_, nEn) => `${nEn} in Games — Famous Characters | GameTan`,
    desc: (_, nEn) => `Game characters that match the ${nEn} archetype. See which heroes share your gaming DNA.`,
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, section } = await params;
  const archetype = getArchetype(id);
  if (!archetype || !ARCHETYPE_SECTIONS.includes(section as never)) {
    return { title: "Not Found | GameTan" };
  }

  const meta = sectionMeta[section];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";

  return {
    title: meta.title(archetype.name, archetype.nameEn),
    description: meta.desc(archetype.name, archetype.nameEn),
    openGraph: {
      title: meta.title(archetype.name, archetype.nameEn),
      description: meta.desc(archetype.name, archetype.nameEn),
      url: `${baseUrl}/archetype/${id}/${section}`,
      siteName: "GameTan",
      type: "article",
    },
    alternates: {
      canonical: `${baseUrl}/archetype/${id}/${section}`,
    },
  };
}

export default function ArchetypeSectionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
