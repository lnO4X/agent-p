import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gamer Community | GameTan",
  description:
    "Join the archetype community. Share gaming insights, find your kind, and discuss strategies.",
  openGraph: {
    title: "Gamer Community | GameTan",
    description:
      "Join the archetype community. Share gaming insights with fellow gamers.",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
