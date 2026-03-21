import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";

export const metadata: Metadata = {
  title: "My Gamer Archetype — GameTan",
  description: "I just discovered my gamer archetype on GameTan! What's yours? Take the 3-minute quiz.",
  openGraph: {
    title: "My Gamer Archetype — GameTan",
    description: "I just discovered my gamer archetype! What's yours?",
    images: [
      {
        url: `${baseUrl}/api/quiz/card?s=75-60-50`,
        width: 1200,
        height: 630,
        alt: "GameTan Archetype Result",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Gamer Archetype — GameTan",
    description: "I just discovered my gamer archetype! What's yours?",
    images: [`${baseUrl}/api/quiz/card?s=75-60-50`],
  },
};

export default function ResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
