import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gamer Archetypes | GameTan",
  description:
    "16 unique gamer archetypes — discover your gaming personality, strengths, weaknesses, and compatible types.",
  openGraph: {
    title: "16 Gamer Archetypes | GameTan",
    description:
      "Discover your gaming personality. 16 unique archetypes based on 13 talent dimensions.",
  },
};

export default function ArchetypeLayout({
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
