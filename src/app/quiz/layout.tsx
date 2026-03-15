import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gamer Archetype Quiz | GameTan",
  description:
    "3 minutes. 3 games. Discover your gamer archetype. What kind of player are you?",
  openGraph: {
    title: "What Kind of Gamer Are You?",
    description:
      "Take a 3-minute quiz to discover your gamer archetype. 16 unique types — which one are you?",
  },
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {children}
    </div>
  );
}
