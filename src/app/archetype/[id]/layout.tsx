import type { Metadata } from "next";
import { getArchetype } from "@/lib/archetype";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";
  const archetype = getArchetype(id);

  if (!archetype) {
    return { title: "Archetype — GameTan" };
  }

  const title = `${archetype.nameEn} ${archetype.icon} — GameTan Archetype`;
  const description = archetype.taglineEn;

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
          alt: `${archetype.nameEn} — GameTan Archetype`,
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

export default function ArchetypeDetailLayout({ children }: Props) {
  return <>{children}</>;
}
