import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — GameTan",
  description:
    "Guides, analysis, and insights about esports talent, gaming skills, and pro player performance.",
  openGraph: {
    title: "GameTan Blog — Esports Talent Insights",
    description: "Learn about esports talent, gaming skills measurement, and what it takes to go pro.",
  },
  robots: { index: true, follow: true },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
