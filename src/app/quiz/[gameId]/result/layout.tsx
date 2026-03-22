import { getGameQuiz } from "@/lib/game-quizzes";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameId: string }>;
}): Promise<Metadata> {
  const { gameId } = await params;
  const quiz = getGameQuiz(gameId);

  if (!quiz) {
    return { title: "Quiz Result | GameTan" };
  }

  const title = `My ${quiz.gameNameEn} Character — GameTan`;
  const description = `Discover which ${quiz.gameNameEn} character matches your gamer archetype. ${quiz.taglineEn}`;
  const ogImage = `${BASE_URL}/api/quiz/game-card/${encodeURIComponent(gameId)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
