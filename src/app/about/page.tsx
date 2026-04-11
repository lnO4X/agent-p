import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About GameTan — Esports Talent Detection",
  description:
    "GameTan measures real gaming talent through cognitive science mini-games. 17 dimensions, pro player benchmarks, AI coaching. Built on Stroop, Flanker, N-Back, and other validated paradigms.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About GameTan — Esports Talent Detection",
    description:
      "Measure your gaming talent with cognitive science. 17 dimensions tested through research-validated mini-games.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About GameTan",
  description:
    "GameTan is an esports talent detection platform that measures real gaming ability through cognitive science mini-games.",
  mainEntity: {
    "@type": "Organization",
    name: "GameTan",
    url: "https://gametan.ai",
    logo: "https://gametan.ai/icons/icon-512.png",
    description:
      "Esports talent detection through cognitive science. 17-dimension assessment comparing players to pro benchmarks.",
    foundingDate: "2026",
    sameAs: ["https://x.com/GameTanAI"],
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="prose prose-invert prose-sm">
        <h1>What is GameTan?</h1>

        <p>
          GameTan is an esports talent detection platform. Instead of personality quizzes
          or subjective questionnaires, we measure <strong>real cognitive abilities</strong> that
          determine competitive gaming performance — through interactive mini-games based on
          published cognitive science research.
        </p>

        <h2>How It Works</h2>
        <p>
          Players complete a series of cognitive mini-games. Each game isolates a specific
          skill used in competitive gaming. Scores are normalized against population norms
          from millions of data points and compared to professional esports player benchmarks.
        </p>
        <ul>
          <li><strong>Quick Test</strong> (3 games, 3 minutes, free) — Reaction speed, pattern recognition, risk decision</li>
          <li><strong>Standard Test</strong> (7 games, 10 minutes, free) — Adds spatial awareness, memory, strategic thinking, decision speed</li>
          <li><strong>Pro Assessment</strong> (17 games, 25 minutes, $3.99) — Full 17-dimension analysis with AI coaching and PDF report</li>
        </ul>

        <h2>Scientific Foundation</h2>
        <p>
          Our games are based on established cognitive science paradigms, not invented mechanics.
          Each paradigm has decades of research behind it:
        </p>
        <ul>
          <li><strong>Stroop Task</strong> (Stroop 1935) — Cognitive interference and emotional control</li>
          <li><strong>Go/No-Go</strong> (Donders 1869) — Impulse control and response inhibition</li>
          <li><strong>N-Back</strong> (Owen et al. 2005) — Working memory under load</li>
          <li><strong>Flanker Task</strong> (Eriksen &amp; Eriksen 1974) — Selective attention and interference control</li>
          <li><strong>Multiple Object Tracking</strong> (Pylyshyn &amp; Storm 1988) — Visual tracking under cognitive load</li>
          <li><strong>Task Switching</strong> (Monsell 2003) — Cognitive flexibility</li>
          <li><strong>UFOV</strong> (Ball et al. 1988) — Visual attention breadth</li>
          <li><strong>Dual-Task</strong> (Pashler 1994) — Attention allocation between tasks</li>
          <li><strong>BART</strong> (Lejuez et al. 2002) — Risk assessment and decision-making</li>
          <li><strong>Corsi Block</strong> (Kessels et al. 2000) — Visuospatial short-term memory</li>
          <li><strong>Mental Rotation</strong> (Shepard &amp; Metzler 1971) — Spatial reasoning</li>
          <li><strong>Perspective Taking</strong> (Michelon &amp; Zacks 2006) — Social cognition for teamwork</li>
        </ul>

        <h2>17 Talent Dimensions</h2>
        <p>
          GameTan measures reaction speed, hand-eye coordination, spatial awareness, memory,
          strategic thinking, rhythm sense, pattern recognition, multitasking, decision speed,
          emotional control, teamwork cognition, risk assessment, and visual attention — plus
          working memory, interference control, cognitive flexibility, and visual tracking
          through dedicated research paradigms.
        </p>

        <h2>Pro Player Benchmarks</h2>
        <p>
          Scores are compared against professional esports player data. The talent tier system
          ranges from Developing (bottom 65%) to Pro Elite (top 0.5%). Players are also matched
          to one of 16 gamer archetypes based on their unique talent distribution.
        </p>

        <h2>Who Uses GameTan?</h2>
        <ul>
          <li><strong>Competitive gamers</strong> who want objective talent measurement</li>
          <li><strong>Esports enthusiasts</strong> curious about how they compare to pros</li>
          <li><strong>Gaming clubs and teams</strong> evaluating player potential</li>
          <li><strong>Casual gamers</strong> looking for fun, scientifically-backed assessment</li>
        </ul>

        <h2>Try It Now</h2>
        <p>
          The Quick Test takes 3 minutes and is free. No registration required.{" "}
          <Link href="/quiz" className="text-primary hover:underline">
            Start your esports talent test
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
