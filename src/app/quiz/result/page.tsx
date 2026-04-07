import type { Metadata } from "next";
import QuizResultPage from "./result-client";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";

interface Props {
  searchParams: Promise<{ s?: string; tier?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const scores = params.s || "75-60-50";

  return {
    title: "My Gamer Archetype — GameTan",
    description:
      "I just discovered my gamer archetype on GameTan! What's yours? Take the 3-minute quiz.",
    openGraph: {
      title: "My Gamer Archetype — GameTan",
      description: "I just discovered my gamer archetype! What's yours?",
      images: [
        {
          url: `${baseUrl}/api/quiz/card?s=${scores}`,
          width: 1200,
          height: 630,
          alt: "GameTan Archetype Result",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "My Gamer Archetype — GameTan",
      description: "I just discovered my gamer archetype! What's yours?",
      images: [`${baseUrl}/api/quiz/card?s=${scores}`],
    },
  };
}

export default function Page() {
  return <QuizResultPage />;
}
