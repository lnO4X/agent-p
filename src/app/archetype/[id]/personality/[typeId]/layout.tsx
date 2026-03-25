import type { Metadata } from "next";
import { getArchetype, getAllArchetypes } from "@/lib/archetype";
import { getPersonalityType, PERSONALITY_CODES } from "@/lib/personality-types";
import { getCombination } from "@/lib/personality-archetype-matrix";

interface Props {
  params: Promise<{ id: string; typeId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, typeId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";
  const archetype = getArchetype(id);
  const personality = getPersonalityType(typeId);

  if (!archetype || !personality) {
    return { title: "Personality × Archetype — GameTan" };
  }

  const combo = getCombination(personality.code, archetype.id);
  const title = `${personality.code} ${archetype.nameEn} | GameTan`;
  const description = combo
    ? combo.insightEn.slice(0, 155)
    : `Discover what it means to be a ${personality.code} ${archetype.nameEn} gamer.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `${baseUrl}/api/archetype/card/${encodeURIComponent(id)}`,
          width: 1200,
          height: 630,
          alt: `${personality.code} ${archetype.nameEn} — GameTan`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/api/archetype/card/${encodeURIComponent(id)}`],
    },
  };
}

export function generateStaticParams() {
  const archetypes = getAllArchetypes();
  const params: { id: string; typeId: string }[] = [];

  for (const archetype of archetypes) {
    for (const code of PERSONALITY_CODES) {
      params.push({ id: archetype.id, typeId: code.toLowerCase() });
    }
  }

  return params;
}

export default function PersonalityComboLayout({ children }: Props) {
  return <>{children}</>;
}
