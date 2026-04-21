import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Esports Talent Test",
  description:
    "3 minutes. 3 games. Cognitive assessment measuring reaction speed, pattern recognition, and decision-making — ranked against published gamer cognitive profiles.",
  openGraph: {
    title: "Test Your Esports Talent — GameTan",
    description:
      "3 mini-games measure the cognitive abilities behind gaming performance, based on published research (Dale 2017; Kowal 2018). See your talent tier and percentile rank.",
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
