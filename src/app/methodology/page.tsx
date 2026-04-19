import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GameTan Methodology — Paradigms, Norms, Limitations",
  description:
    "Full methodology for GameTan cognitive assessment. Every paradigm is cited, every normative source is disclosed, every limitation is listed.",
  alternates: { canonical: "/methodology" },
  robots: { index: true, follow: true },
};

/**
 * /methodology — transparent disclosure of how GameTan measures what it measures.
 *
 * Goal: any researcher, coach, or skeptical gamer can read this page and verify
 * that every claim is sourced. Where we lack data, we say so.
 */
export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <article className="prose prose-invert prose-sm">
        <h1>Methodology</h1>
        <p className="text-muted-foreground">
          How GameTan measures cognitive abilities, where the norms come from, and what we
          do not measure.
        </p>

        <h2>1. Scientific foundation</h2>
        <p>
          GameTan implements a set of cognitive paradigms from peer-reviewed literature.
          We do not invent metrics. Each paradigm below is an established tool used in
          cognitive psychology research for decades.
        </p>

        <h3>Paradigms used</h3>
        <table>
          <thead>
            <tr>
              <th>Paradigm</th>
              <th>Measures</th>
              <th>Primary citation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Simple Reaction Time</td>
              <td>Pure motor response latency</td>
              <td>Bridges et al. 2020 (human-benchmark.com data, N≈81M)</td>
            </tr>
            <tr>
              <td>Stroop Task</td>
              <td>Interference suppression</td>
              <td>Stroop 1935; MacLeod 1991 meta-analysis</td>
            </tr>
            <tr>
              <td>Eriksen Flanker</td>
              <td>Selective attention</td>
              <td>Eriksen &amp; Eriksen 1974</td>
            </tr>
            <tr>
              <td>Go/No-Go</td>
              <td>Response inhibition</td>
              <td>Donders 1869; Logan 1994</td>
            </tr>
            <tr>
              <td>N-Back (2-back spatial)</td>
              <td>Working memory under load</td>
              <td>Owen et al. 2005; Jaeggi et al. 2010</td>
            </tr>
            <tr>
              <td>Corsi Block</td>
              <td>Visuospatial STM span</td>
              <td>Corsi 1972; Kessels et al. 2000 meta-analysis</td>
            </tr>
            <tr>
              <td>Multiple Object Tracking (MOT)</td>
              <td>Visual tracking capacity</td>
              <td>Pylyshyn &amp; Storm 1988</td>
            </tr>
            <tr>
              <td>Task Switching</td>
              <td>Cognitive flexibility</td>
              <td>Monsell 2003; Kiesel et al. 2010</td>
            </tr>
            <tr>
              <td>UFOV (Useful Field of View)</td>
              <td>Visual attention breadth</td>
              <td>Ball et al. 1988; Edwards et al. 2005</td>
            </tr>
            <tr>
              <td>Dual-Task</td>
              <td>Concurrent attention allocation</td>
              <td>Pashler 1994; Wickens 2002</td>
            </tr>
            <tr>
              <td>BART</td>
              <td>Risk sensitivity</td>
              <td>Lejuez et al. 2002</td>
            </tr>
            <tr>
              <td>Mental Rotation</td>
              <td>Spatial reasoning</td>
              <td>Shepard &amp; Metzler 1971</td>
            </tr>
            <tr>
              <td>Perspective Taking</td>
              <td>Visuospatial perspective shift</td>
              <td>Michelon &amp; Zacks 2006; Samson et al. 2010</td>
            </tr>
            <tr>
              <td>Posner Cueing <em>(rebuild in progress)</em></td>
              <td>Attentional orienting</td>
              <td>Posner 1980; Posner &amp; Petersen 1990</td>
            </tr>
            <tr>
              <td>Iowa Gambling Task <em>(rebuild in progress)</em></td>
              <td>Decision under uncertainty</td>
              <td>Bechara et al. 1994</td>
            </tr>
            <tr>
              <td>Sensorimotor Synchronization <em>(rebuild in progress)</em></td>
              <td>Rhythm tapping / timing precision</td>
              <td>Repp 2005 review</td>
            </tr>
          </tbody>
        </table>

        <h2>2. Scoring</h2>
        <p>
          Raw scores (reaction time in ms, accuracy %, span length, effect size in ms,
          threshold duration, etc.) are converted to percentile ranks using the normal CDF
          (Abramowitz &amp; Stegun approximation) with population-level mean and standard
          deviation from the cited literature. Percentile values are clamped to the 1–99
          range to avoid degenerate output at the tails.
        </p>
        <p>
          For each dimension, we report:
        </p>
        <ul>
          <li>
            <strong>Percentile</strong> against general population norms
          </li>
          <li>
            <strong>95% confidence interval</strong> derived from published test-retest
            reliability values (when available)
          </li>
          <li>
            <strong>Literature-sourced comparison</strong> to published cognitive profiles of
            gamer subgroups (Dale &amp; Green 2017 for FPS; Kowal et al. 2018 for MOBA;
            Thompson et al. 2013 for RTS)
          </li>
        </ul>

        <h2>3. Normative data sources</h2>
        <p>
          We use published norms wherever they exist. We do NOT collect or publish our own
          professional player norms — no such claim appears anywhere in the product.
        </p>
        <p>
          Where literature norms are unavailable (pursuit rotor, Posner cueing in gaming
          context, etc.), we mark the dimension as <em>beta</em> in the report and say so
          explicitly.
        </p>

        <h2>4. Test-retest reliability</h2>
        <p>
          Per published literature:
        </p>
        <ul>
          <li>Simple RT: r ≈ 0.68–0.88</li>
          <li>Stroop effect: r ≈ 0.80+</li>
          <li>Flanker effect: r ≈ 0.80</li>
          <li>Corsi span: r ≈ 0.75–0.85 (Kessels 2000)</li>
          <li>N-Back accuracy: r ≈ 0.75</li>
          <li>Task-switch cost: r ≈ 0.70</li>
          <li>UFOV threshold: r ≈ 0.80+</li>
          <li>BART: r ≈ 0.55–0.75 (lower — behavioural variability)</li>
        </ul>
        <p>
          These values drive the 95% confidence intervals in Deep Assessment reports. Lower
          reliability = wider interval.
        </p>

        <h2>5. Trainability estimates (in Deep report)</h2>
        <p>
          Based on meta-analyses of cognitive training:
        </p>
        <ul>
          <li>Simple RT: ~10–15% ceiling (Draper 2009 meta-analysis)</li>
          <li>Working Memory: ~20–30% (Melby-Lervåg &amp; Hulme 2013)</li>
          <li>Attention / UFOV: ~15–25% (Green &amp; Bavelier 2003; Edwards 2009)</li>
          <li>Task switching / Cognitive flexibility: ~15% (Karbach &amp; Verhaeghen 2014)</li>
        </ul>

        <h2>6. What we explicitly cannot do</h2>
        <ul>
          <li>Diagnose ADHD, autism, dyslexia, or any clinical condition</li>
          <li>
            Predict whether you can become a professional esports player (that depends on
            practice hours, coaching, mental health, luck, and opportunity — not just
            cognition)
          </li>
          <li>
            Measure game-specific skill (mechanics, map awareness, champion pool, economy
            management)
          </li>
          <li>Measure teamwork (our Perspective Taking is a solo cognitive task)</li>
          <li>Measure mental toughness under tournament pressure</li>
          <li>Provide a cognitive profile of named professional players</li>
        </ul>

        <h2>7. Known sources of measurement variance</h2>
        <ul>
          <li>
            <strong>Device input</strong>: Mouse vs trackpad vs touch differ by 20–80 ms in
            simple RT tasks. Scores are not directly comparable across devices.
          </li>
          <li>
            <strong>Network latency</strong>: For client-side timing (all our games), local
            measurement avoids network jitter. But display latency varies (60 Hz vs 144 Hz
            monitor, browser frame rate).
          </li>
          <li>
            <strong>Practice effects</strong>: First-time users often score 5–15% worse than
            their stable self. Retest after 1–2 sessions for a more reliable profile.
          </li>
          <li>
            <strong>Fatigue</strong>: Deep assessment is ~25 minutes. Later games see
            fatigue effects.
          </li>
        </ul>

        <h2>8. Changelog</h2>
        <ul>
          <li>
            <strong>v1.0 (current)</strong>: Honest positioning, Pattern/Decision/Rhythm
            flagged as rebuild-in-progress, dimension renames aligned with paradigms,
            &quot;professional player benchmarks&quot; replaced with literature-sourced
            population comparisons
          </li>
        </ul>

        <h2>Questions, critiques, corrections</h2>
        <p>
          If you spot an error in citations, a better normative source, or want to collaborate
          on validation work, please open an issue at{" "}
          <a
            href="https://github.com/lnO4X/cognitive-esports-benchmarks"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            our public research repo
          </a>
          .
        </p>

        <p className="mt-8">
          <Link href="/about" className="text-primary hover:underline">
            ← Back to About
          </Link>
          {" · "}
          <Link href="/quiz" className="text-primary hover:underline">
            Start the assessment
          </Link>
        </p>
      </article>
    </div>
  );
}
