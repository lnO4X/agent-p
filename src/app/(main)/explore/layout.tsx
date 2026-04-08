import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse 100+ Games",
  description:
    "Explore 100+ games across all platforms. Find your perfect match based on your gamer archetype.",
  openGraph: {
    title: "Browse 100+ Games | GameTan",
    description:
      "Explore 100+ games across all platforms. Find your perfect match.",
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
