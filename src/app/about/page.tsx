import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About GameTan — Cognitive Assessment for Gamers",
  description:
    "GameTan is a cognitive assessment tool for competitive gamers, built on published cognitive science paradigms (Stroop, Flanker, N-Back, Corsi, UFOV, Task-Switching). Quick personal self-test + deep report for coaches and clubs.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About GameTan — Cognitive Assessment for Gamers",
    description:
      "Measure the cognitive abilities behind competitive gaming. Based on published research paradigms — honest about what we can and cannot measure.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About GameTan",
  description:
    "GameTan is a cognitive assessment tool for competitive gamers, built on published cognitive science paradigms. Serves both individual self-assessment and team coaching use cases.",
  mainEntity: {
    "@type": "Organization",
    name: "GameTan",
    url: "https://gametan.ai",
    logo: "https://gametan.ai/icons/icon-512.png",
    description:
      "Cognitive assessment tool for gamers. Built on published paradigms — Stroop, Flanker, N-Back, Corsi block, UFOV, Task-Switching, and more.",
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
        <h1>What GameTan is — and isn&apos;t</h1>

        <p>
          GameTan is a <strong>cognitive assessment tool for gamers</strong>, built on
          published cognitive science paradigms. It measures a set of cognitive abilities
          (reaction time, working memory, interference suppression, visual attention,
          task-switching, and more) that correlate with competitive gaming performance
          according to published research.
        </p>

        <p>
          It serves two audiences with one scientific foundation:
        </p>
        <ul>
          <li>
            <strong>Individual gamers</strong> who want an honest, quick read on their cognitive
            profile — not a personality quiz, not a prediction of pro status
          </li>
          <li>
            <strong>Coaches, clubs, and esports academies</strong> who want a structured
            observation tool to compare players, track changes over time, and inform training
          </li>
        </ul>

        <h2>What we measure (and why)</h2>
        <p>
          Every game in GameTan implements a paradigm from peer-reviewed cognitive science.
          We do not invent metrics. Where literature has normative data, we cite it. Where
          literature does not have norms yet, we say so.
        </p>
        <ul>
          <li><strong>Simple Reaction Time</strong> — based on Human Benchmark population data (Bridges et al. 2020, N=81M)</li>
          <li><strong>Flanker Task</strong> (Eriksen &amp; Eriksen 1974) — selective attention under interference</li>
          <li><strong>Stroop Task</strong> (Stroop 1935; MacLeod 1991 meta-analysis) — interference suppression (NOT emotional regulation)</li>
          <li><strong>Go/No-Go</strong> (Donders 1869; Logan 1994) — response inhibition</li>
          <li><strong>N-Back</strong> (Owen et al. 2005; Jaeggi et al. 2010) — working memory under load</li>
          <li><strong>Corsi Block</strong> (Kessels et al. 2000) — visuospatial short-term memory span</li>
          <li><strong>Multiple Object Tracking</strong> (Pylyshyn &amp; Storm 1988) — visual tracking capacity</li>
          <li><strong>Task Switching</strong> (Monsell 2003) — cognitive flexibility</li>
          <li><strong>UFOV / Useful Field of View</strong> (Ball et al. 1988; Edwards et al. 2005) — visual attention breadth</li>
          <li><strong>Dual-Task</strong> (Pashler 1994) — attention allocation between concurrent tasks</li>
          <li><strong>BART / Balloon Analogue Risk Task</strong> (Lejuez et al. 2002) — risk sensitivity under reward</li>
          <li><strong>Mental Rotation</strong> (Shepard &amp; Metzler 1971) — spatial reasoning</li>
          <li><strong>Perspective Taking</strong> (Michelon &amp; Zacks 2006) — visuospatial perspective shift (NOT a teamwork measure — a solo cognitive task)</li>
          <li><strong>Posner Cueing</strong> (Posner 1980) — visual orienting attention (rebuild in progress)</li>
          <li><strong>Iowa Gambling Task</strong> (Bechara 1994) — decision-making under uncertainty (rebuild in progress)</li>
          <li><strong>Sensorimotor Synchronization (SMS)</strong> (Repp 2005 review) — rhythm perception and tap timing (rebuild in progress)</li>
        </ul>

        <h2>What we do NOT claim</h2>
        <ul>
          <li>
            <strong>No professional player database</strong>. We do not have raw test data from
            pro players. When you see &quot;top 5% of FPS players,&quot; it refers to published
            data from gamer-population studies (Dale &amp; Green 2017; Green &amp; Bavelier 2003;
            Kowal et al. 2018), not to GameTan&apos;s own player pool.
          </li>
          <li>
            <strong>Not a clinical tool</strong>. GameTan is not FDA/CE certified. It does not
            diagnose ADHD, cognitive decline, or any medical condition.
          </li>
          <li>
            <strong>Not a predictor of pro success</strong>. Competitive success depends on
            practice hours, mental toughness, game-specific skill, team chemistry, luck, and
            opportunity — not just cognitive abilities. We measure one slice of the puzzle.
          </li>
          <li>
            <strong>Not game-specific skill</strong>. We do not measure champion pools, map
            knowledge, meta awareness, or mechanical peak performance.
          </li>
        </ul>

        <h2>How it works</h2>
        <p>
          The test is structured in three depths, using the same scientific foundation:
        </p>
        <ul>
          <li>
            <strong>Quick Test</strong> (free, 5 minutes, no login) — 3 core paradigms
            (reaction, pattern/attention, risk). Gives a fast cognitive snapshot and one of 16
            gamer archetypes. Good for casual curiosity and sharing.
          </li>
          <li>
            <strong>Deep Self-Assessment</strong> (paid, 25 minutes) — All validated paradigms.
            Full profile with 95% confidence intervals, trainability estimates per dimension
            (based on published meta-analyses), game-genre and role fit analysis (based on
            published cognitive profiles of gamers), longitudinal retest tracking, and a
            downloadable PDF report.
          </li>
          <li>
            <strong>Team / Coach Mode</strong> (B2B, in development) — Multi-player dashboards
            for coaches, longitudinal team tracking, CSV/PDF export, and API access. Built for
            esports academies, clubs, and research teams.
          </li>
        </ul>

        <h2>Scientific transparency</h2>
        <p>
          We believe users deserve to know what&apos;s measured, how it&apos;s scored, and where
          the limits are. Our{" "}
          <Link href="/methodology" className="text-primary hover:underline">
            Methodology page
          </Link>{" "}
          lists every paradigm, its citation, the normative data source, known test-retest
          reliability values from literature, and the full list of things we cannot measure.
        </p>

        <h2>Who uses GameTan</h2>
        <ul>
          <li>
            <strong>Competitive gamers</strong> who want an objective cognitive snapshot
          </li>
          <li>
            <strong>Coaches and club managers</strong> using GameTan as a structured observation
            tool (alongside, not replacing, their scouting judgment)
          </li>
          <li>
            <strong>Esports academies</strong> tracking player cognitive development over months
          </li>
          <li>
            <strong>Researchers and students</strong> who want a quick way to run classic
            paradigms without installing PsychoPy or PEBL
          </li>
        </ul>

        <h2>Try it</h2>
        <p>
          The Quick Test is free and takes 5 minutes. No registration needed.{" "}
          <Link href="/quiz" className="text-primary hover:underline">
            Start the cognitive assessment
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
