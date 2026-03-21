import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archetype Compatibility | GameTan",
  description:
    "Check compatibility between any two gamer archetypes. Find your best ally or worst nemesis.",
  openGraph: {
    title: "Archetype Compatibility | GameTan",
    description:
      "Check compatibility between any two gamer archetypes.",
  },
};

export default function CompatibilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
