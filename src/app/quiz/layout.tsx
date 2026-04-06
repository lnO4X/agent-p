import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Esports Talent Test",
  description:
    "3 minutes. 3 games. Test your reaction speed, pattern recognition, and decision-making against pro player benchmarks.",
  openGraph: {
    title: "Test Your Esports Talent — GameTan",
    description:
      "3 mini-games measure your gaming talent against pro player benchmarks. See your talent tier and rank among 10,000 players.",
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
