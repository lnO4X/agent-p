import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "GameTan for Teams — Cognitive Assessment for Esports Coaches",
  description:
    "Structured cognitive profiling for esports teams. Longitudinal tracking, role fit analysis, CSV + API export. Based on published cognitive science paradigms.",
  keywords: [
    "esports coaching",
    "esports team cognitive assessment",
    "esports academy tools",
    "esports talent scouting",
    "cognitive profiling for gamers",
    "team dashboard",
    "longitudinal player tracking",
    "role fit analysis",
  ],
  alternates: { canonical: "/for-teams" },
  openGraph: {
    title: "GameTan for Teams — Cognitive Assessment for Esports Coaches",
    description:
      "Structured cognitive profiling for esports teams. Longitudinal tracking, role fit analysis, CSV + API export. Based on published cognitive science paradigms.",
    url: "https://gametan.ai/for-teams",
    siteName: "GameTan",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GameTan for Teams — Cognitive Assessment for Esports Coaches",
    description:
      "Structured cognitive profiling for esports teams. Honest about what we can and cannot measure.",
  },
  robots: { index: true, follow: true },
};

export default function ForTeamsLayout({ children }: { children: ReactNode }) {
  return children;
}
