import type { Metadata } from "next";
import { db } from "@/db";
import { pkChallenges } from "@/db/schema";
import { eq } from "drizzle-orm";
import { gameRegistry } from "@/games";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";

  try {
    const rows = await db
      .select()
      .from(pkChallenges)
      .where(eq(pkChallenges.id, id))
      .limit(1);

    if (rows.length === 0) {
      return { title: "PK Challenge — GameTan" };
    }

    const pk = rows[0];
    const game = gameRegistry.get(pk.gameId);
    const gameName = game?.nameEn || game?.name || pk.gameId;

    const title = `${pk.creatorName} scored ${Math.round(pk.creatorScore)} in ${gameName} — Beat this!`;
    const description = `Can you beat ${pk.creatorName}'s score in ${gameName}? Accept the PK challenge!`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: `${baseUrl}/api/pk/card/${encodeURIComponent(id)}`,
            width: 1200,
            height: 630,
            alt: `PK Challenge: ${gameName}`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [`${baseUrl}/api/pk/card/${encodeURIComponent(id)}`],
      },
    };
  } catch {
    return { title: "PK Challenge — GameTan" };
  }
}

export default function PkDetailLayout({ children }: Props) {
  return <>{children}</>;
}
