import { getGameQuiz, getAllGameQuizIds } from "@/lib/game-quizzes";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";

export function generateStaticParams() {
  return getAllGameQuizIds().map((gameId) => ({ gameId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameId: string }>;
}): Promise<Metadata> {
  const { gameId } = await params;
  const quiz = getGameQuiz(gameId);

  if (!quiz) {
    return { title: "Quiz | GameTan" };
  }

  const title = `Which ${quiz.gameNameEn} Character Are You? | GameTan`;
  const description = `${quiz.taglineEn} Take the quiz to find your ${quiz.gameNameEn} character match based on your gamer archetype.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `${BASE_URL}/api/quiz/game-card/${encodeURIComponent(gameId)}`,
          width: 1200,
          height: 630,
          alt: `${quiz.gameNameEn} Character Quiz — GameTan`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}/api/quiz/game-card/${encodeURIComponent(gameId)}`],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
