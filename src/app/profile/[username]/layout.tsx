import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://game.weda.ai";

  return {
    title: `${username} — GameTan DNA`,
    description: `Check out ${username}'s gaming talent profile on GameTan`,
    openGraph: {
      title: `${username} — GameTan DNA`,
      description: `Check out ${username}'s gaming talent profile`,
      images: [
        {
          url: `${baseUrl}/api/profile/card/${encodeURIComponent(username)}`,
          width: 1200,
          height: 630,
          alt: `${username}'s GameTan DNA Card`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${username} — GameTan DNA`,
      description: `Check out ${username}'s gaming talent profile`,
      images: [`${baseUrl}/api/profile/card/${encodeURIComponent(username)}`],
    },
  };
}

export default function ProfileLayout({ children }: Props) {
  return <>{children}</>;
}
