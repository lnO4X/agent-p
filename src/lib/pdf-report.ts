/**
 * Client-side PDF report generator for Pro users — produces an 8-12 page
 * cognitive assessment report from talent scores.
 *
 * English-only in v1: jsPDF's built-in fonts cannot render CJK, and bundling
 * a Chinese font would add ~2-4 MB. TODO(v2): Noto Sans SC subset when
 * Chinese demand materializes. Dependency-free except for jspdf.
 */
import jsPDF from "jspdf";

import type { TalentCategory } from "@/types/talent";

import { PARADIGM_RELIABILITY, formatScoreCI, getDimensionCI95 } from "./confidence-intervals";
import { computeGenreFit } from "./genre-cognitive-fit";
import { getTopRoleFits } from "./role-cognitive-fit";
import { getTrainability, projectScoreAfterTraining } from "./trainability";

export interface PDFReportInput {
  readonly talentScores: Record<string, number>;
  readonly archetype: { id: string; name: string; nameEn: string } | null;
  readonly overallScore: number;
  readonly tier: string;
  readonly testedAt: Date;
  readonly userLabel?: string;
  readonly locale: "en" | "zh";
}

// A4 in points: 595 × 842
const PAGE_W = 595, PAGE_H = 842, M = 48, CW = PAGE_W - M * 2;
type RGB = [number, number, number];
const NAVY: RGB = [22, 34, 57], TEAL: RGB = [0, 150, 136];
const GD: RGB = [80, 80, 80], GM: RGB = [140, 140, 140], GL: RGB = [220, 220, 220];

const DIM_EN: Record<TalentCategory, string> = {
  reaction_speed: "Reaction Speed",
  hand_eye_coord: "Hand-Eye Coordination",
  spatial_awareness: "Spatial Awareness",
  memory: "Working Memory",
  strategy_logic: "Response Inhibition",
  rhythm_sense: "Rhythm / Timing",
  pattern_recog: "Attention Orienting",
  multitasking: "Multitasking",
  decision_speed: "Decision-Making",
  emotional_control: "Interference Suppression",
  teamwork_tendency: "Perspective Taking",
  risk_assessment: "Risk Sensitivity",
  resource_mgmt: "Visual Attention Breadth",
};
const CITE: Record<TalentCategory, string> = {
  reaction_speed: "Simple-RT (Deary et al., 2001)",
  hand_eye_coord: "Pursuit-rotor tracking",
  spatial_awareness: "Mental Rotation (Shepard & Metzler, 1971) + MOT",
  memory: "Corsi Span (Kessels, 2000) + N-Back (Jaeggi, 2010)",
  strategy_logic: "Go/No-Go + Task-Switching (Logan 1994; Monsell 2003)",
  rhythm_sense: "SMS tapping (Repp, 2005)",
  pattern_recog: "Posner Cueing (Posner & Petersen, 1990)",
  multitasking: "Dual-Task paradigm (Pashler, 1994)",
  decision_speed: "IGT (Bechara, 2001) + Task-Switching",
  emotional_control: "Stroop (MacLeod 1991) + Flanker (Eriksen 1974)",
  teamwork_tendency: "Perspective-Taking (Samson et al., 2010)",
  risk_assessment: "BART (Lejuez et al., 2002)",
  resource_mgmt: "UFOV (Edwards et al., 2005)",
};

const LIMITATIONS = [
  "This is a cognitive assessment, not a clinical diagnosis. Scores are not medical indicators.",
  "This is not a professional-player predictor. Elite competitive success depends on practice, tactics, teamwork, mindset and opportunity - factors this battery does not measure.",
  "The battery does not assess game-specific skill (champion pools, map knowledge, meta awareness) or teamwork quality. A high score does not guarantee in-game performance.",
  "Gamer cognitive norms cited in the genre and role sections are drawn from research samples, not GameTan's own competitive-player database.",
  "Trainability ceilings are group-level estimates from meta-analyses. Individual variance is large; genes, motivation and training method all materially affect actual gains.",
];

type Cur = { y: number };

const tc = (d: jsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2]);
const fc = (d: jsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2]);
const dcc = (d: jsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2]);

function ensure(d: jsPDF, cur: Cur, need: number): void {
  if (cur.y + need > PAGE_H - M - 30) { d.addPage(); cur.y = M + 20; }
}

function newPage(d: jsPDF, cur: Cur): void { d.addPage(); cur.y = M + 20; }

function section(d: jsPDF, cur: Cur, label: string): void {
  ensure(d, cur, 40);
  tc(d, NAVY);
  d.setFont("times", "bold").setFontSize(16).text(label, M, cur.y);
  dcc(d, TEAL);
  d.setLineWidth(1.5).line(M, cur.y + 4, M + 36, cur.y + 4);
  cur.y += 22;
}

function para(d: jsPDF, cur: Cur, s: string, italic = false): void {
  tc(d, italic ? GM : GD);
  d.setFont("helvetica", italic ? "italic" : "normal").setFontSize(italic ? 8 : 10);
  const ls = d.splitTextToSize(s, CW);
  ensure(d, cur, ls.length * (italic ? 10 : 13));
  d.text(ls, M, cur.y);
  cur.y += ls.length * (italic ? 10 : 13) + (italic ? 2 : 4);
}

// Title with right-aligned score badge. Uses times-bold for left, courier-bold for right.
function titleRow(d: jsPDF, cur: Cur, left: string, right: string, size = 12): void {
  tc(d, NAVY);
  d.setFont("times", "bold").setFontSize(size).text(left, M, cur.y);
  tc(d, TEAL);
  d.setFont("courier", "bold").text(right, PAGE_W - M, cur.y, { align: "right" });
  cur.y += 14;
}

function interp(s: number): string {
  if (s >= 85) return "Elite-range performance. Within the top 15% of published samples.";
  if (s >= 70) return "Strong performance, above the literature median.";
  if (s >= 45) return "Average range - performance comparable to published non-gamer samples.";
  if (s >= 30) return "Below median. Targeted training is likely to produce measurable gains.";
  return "Developing. Note wide confidence interval on noisier paradigms before drawing firm conclusions.";
}

function tierDesc(s: number): string {
  if (s >= 80) return "elite range";
  if (s >= 65) return "above-average range";
  if (s >= 50) return "average range";
  return "developing range";
}

function buildProfile(input: PDFReportInput) {
  const scores = {} as Record<TalentCategory, number>;
  for (const k of Object.keys(PARADIGM_RELIABILITY) as TalentCategory[]) {
    scores[k] = input.talentScores[k] ?? 50;
  }
  return { scores, overallScore: input.overallScore, overallRank: "B" as const };
}

function drawCover(d: jsPDF, input: PDFReportInput): void {
  fc(d, NAVY); d.rect(0, 0, PAGE_W, 180, "F");
  tc(d, [255, 255, 255]);
  d.setFont("times", "bold").setFontSize(36).text("GameTan", M, 100);
  d.setFont("helvetica", "normal").setFontSize(11);
  tc(d, [180, 200, 210]);
  d.text("Esports Cognitive Assessment", M, 124);
  fc(d, TEAL); d.rect(M, 144, 60, 3, "F");
  tc(d, NAVY); d.setFont("times", "bold").setFontSize(28);
  d.text("Cognitive Profile", M, 280); d.text("Report", M, 316);
  tc(d, GD); d.setFont("helvetica", "normal").setFontSize(11);
  const date = input.testedAt.toISOString().slice(0, 10);
  const battery = input.tier === "pro" ? "Pro (13-dimension battery)" : input.tier;
  const who = input.userLabel?.trim() || "Anonymous participant";
  const meta = [
    `Subject:      ${who}`,
    `Tested on:    ${date}`,
    `Battery:      ${battery}`,
    ...(input.archetype ? [`Archetype:    ${input.archetype.nameEn}`] : []),
    `Overall:      ${Math.round(input.overallScore)} / 100`,
  ];
  meta.forEach((l, i) => d.text(l, M, 420 + i * 18));
  dcc(d, GL); d.setLineWidth(0.5).rect(M, 640, CW, 80);
  tc(d, GM); d.setFont("helvetica", "italic").setFontSize(9);
  d.text(
    d.splitTextToSize(
      "This report summarizes performance on a battery of published cognitive paradigms. It is a research-tier assessment tool, not a clinical diagnosis and not a pro-player predictor. Success in competitive play depends on practice, tactics, teamwork and opportunity - factors this assessment does not measure.",
      CW - 20
    ),
    M + 10, 660
  );
}

function drawSummary(d: jsPDF, cur: Cur, input: PDFReportInput): void {
  section(d, cur, "Executive Summary");
  const tested = (Object.keys(input.talentScores) as TalentCategory[]).filter((k) => k in PARADIGM_RELIABILITY);
  const sorted = tested.map((c) => ({ cat: c, score: input.talentScores[c] ?? 50 })).sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, 3).map((x) => DIM_EN[x.cat]).join(", ");
  const bot = sorted.slice(-3).reverse().map((x) => DIM_EN[x.cat]).join(", ");
  const arch = input.archetype ? ` Their cognitive archetype is ${input.archetype.nameEn}.` : "";
  para(d, cur, `The subject completed a ${tested.length}-dimension cognitive battery drawn from published experimental-psychology paradigms. Composite performance (${Math.round(input.overallScore)}/100) places them in the ${tierDesc(input.overallScore)}.${arch}`);
  para(d, cur, `Strongest dimensions: ${top}. These represent cognitive assets and should be leveraged when choosing genres, roles, and training priorities.`);
  para(d, cur, `Development opportunities: ${bot}. Targeted training in these areas offers the highest expected marginal return based on the trainability literature cited later in this report.`);
  para(d, cur, "All scores are percentile-normalized against published literature samples. Confidence intervals on the following page reflect published test-retest reliability.", true);
}

function drawDims(d: jsPDF, cur: Cur, input: PDFReportInput): void {
  newPage(d, cur);
  section(d, cur, "Per-Dimension Results");
  para(d, cur, "Each dimension is reported as percentile score with a 95% confidence interval. CI width reflects the published test-retest reliability of the underlying paradigm (Stroop r~0.85 yields narrow intervals; BART r~0.55 yields wide ones).", true);
  cur.y += 6;
  const dims = (Object.keys(input.talentScores) as TalentCategory[])
    .filter((k) => k in PARADIGM_RELIABILITY)
    .map((cat) => ({ cat, score: input.talentScores[cat] ?? 50, ci: getDimensionCI95(cat, input.talentScores[cat] ?? 50) }))
    .sort((a, b) => b.score - a.score);
  for (const { cat, score, ci } of dims) {
    ensure(d, cur, 68);
    tc(d, NAVY); d.setFont("helvetica", "bold").setFontSize(11).text(DIM_EN[cat], M, cur.y);
    tc(d, TEAL); d.setFont("courier", "bold").text(formatScoreCI(score, ci), PAGE_W - M, cur.y, { align: "right" });
    cur.y += 14;
    const y = cur.y;
    fc(d, GL); d.rect(M, y, CW, 4, "F");
    fc(d, TEAL); d.rect(M + (ci[0] / 100) * CW, y, ((ci[1] - ci[0]) / 100) * CW, 4, "F");
    fc(d, NAVY); d.circle(M + (score / 100) * CW, y + 2, 3, "F");
    cur.y += 10;
    tc(d, GD); d.setFont("helvetica", "italic").setFontSize(8);
    d.text(`Paradigm: ${CITE[cat]}  ·  test-retest r = ${PARADIGM_RELIABILITY[cat].toFixed(2)}`, M, cur.y);
    cur.y += 10;
    d.setFont("helvetica", "normal").setFontSize(9);
    const ls = d.splitTextToSize(interp(score), CW);
    d.text(ls, M, cur.y);
    cur.y += ls.length * 11 + 14;
  }
}

function drawGenre(d: jsPDF, cur: Cur, input: PDFReportInput): void {
  newPage(d, cur);
  section(d, cur, "Game Genre Fit");
  para(d, cur, "Fit scores are weighted averages of the cognitive dimensions that published gamer cognitive-profile studies emphasize for each genre.", true);
  cur.y += 4;
  for (const { genre, fitScore, why } of computeGenreFit(buildProfile(input)).slice(0, 3)) {
    ensure(d, cur, 84);
    titleRow(d, cur, genre.nameEn, `${fitScore}/100`, 13);
    tc(d, GD); d.setFont("helvetica", "normal").setFontSize(10);
    for (const r of why.slice(0, 2)) {
      const ls = d.splitTextToSize(`- ${r}`, CW);
      d.text(ls, M + 4, cur.y);
      cur.y += ls.length * 12;
    }
    tc(d, GM); d.setFont("helvetica", "italic").setFontSize(8);
    d.text(`Representative titles: ${genre.exampleGames.slice(0, 3).join(", ")}`, M + 4, cur.y);
    cur.y += 10;
    d.text(`Source: ${genre.source}`, M + 4, cur.y);
    cur.y += 22;
  }
}

function drawRoles(d: jsPDF, cur: Cur, input: PDFReportInput): void {
  newPage(d, cur);
  section(d, cur, "In-Game Role Fit");
  para(d, cur, "Which within-genre roles best match the subject's cognitive profile. Treat as hypotheses - role demands vary by team and meta.", true);
  cur.y += 4;
  for (const { role, fitScore, why } of getTopRoleFits(buildProfile(input), 3)) {
    ensure(d, cur, 92);
    titleRow(d, cur, `${role.nameEn} (${role.genreId.toUpperCase()})`, `${fitScore}/100`);
    tc(d, GD); d.setFont("helvetica", "normal").setFontSize(10);
    const desc = d.splitTextToSize(role.descriptionEn, CW);
    d.text(desc, M, cur.y);
    cur.y += desc.length * 12 + 4;
    d.setFontSize(9);
    for (const r of why.slice(0, 2)) {
      const ls = d.splitTextToSize(`- ${r}`, CW);
      d.text(ls, M + 4, cur.y);
      cur.y += ls.length * 11;
    }
    cur.y += 10;
  }
}

function drawTrain(d: jsPDF, cur: Cur, input: PDFReportInput): void {
  newPage(d, cur);
  section(d, cur, "Trainability & Recommendations");
  para(d, cur, "For the three weakest dimensions, expected gains are projected from published cognitive-training meta-analyses. Estimates, not guarantees - individual variance is substantial.", true);
  cur.y += 4;
  const weakest = (Object.keys(input.talentScores) as TalentCategory[])
    .filter((k) => k in PARADIGM_RELIABILITY)
    .map((cat) => ({ cat, score: input.talentScores[cat] ?? 50 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
  for (const { cat, score } of weakest) {
    const t = getTrainability(cat);
    const proj = projectScoreAfterTraining(score, cat, t.practiceHours);
    const gain = Math.max(0, Math.round(proj - score));
    ensure(d, cur, 110);
    titleRow(d, cur, DIM_EN[cat], `${Math.round(score)} -> ~${Math.round(proj)}  (+${gain})`);
    tc(d, GD); d.setFont("helvetica", "normal").setFontSize(10);
    d.text(`Ceiling: ${t.trainabilityPct}%  ·  Practice required: ~${t.practiceHours}h  ·  Evidence: ${t.evidenceStrength}`, M, cur.y);
    cur.y += 14;
    const mLs = d.splitTextToSize(`Method: ${t.methodEn}`, CW);
    d.text(mLs, M, cur.y);
    cur.y += mLs.length * 12 + 4;
    tc(d, GM); d.setFont("helvetica", "italic").setFontSize(8);
    const sLs = d.splitTextToSize(`Source: ${t.source}`, CW);
    d.text(sLs, M, cur.y);
    cur.y += sLs.length * 10 + 14;
  }
}

function drawLimits(d: jsPDF, cur: Cur): void {
  newPage(d, cur);
  section(d, cur, "Honest Limitations");
  tc(d, GD); d.setFont("helvetica", "normal").setFontSize(10);
  for (const item of LIMITATIONS) {
    const ls = d.splitTextToSize(`- ${item}`, CW);
    ensure(d, cur, ls.length * 12 + 6);
    d.text(ls, M, cur.y);
    cur.y += ls.length * 12 + 8;
  }
  cur.y += 10;
  section(d, cur, "Methodology");
  para(d, cur, "Full methodology, citations, validation data and update log are published online at gametan.ai/methodology. That page is the canonical reference and supersedes any summary in this report.");
}

export function generatePDFReport(input: PDFReportInput): Blob {
  const d = new jsPDF({ unit: "pt", format: "a4" });
  const cur: Cur = { y: M + 20 };
  drawCover(d, input);
  newPage(d, cur);
  drawSummary(d, cur, input);
  drawDims(d, cur, input);
  drawGenre(d, cur, input);
  drawRoles(d, cur, input);
  drawTrain(d, cur, input);
  drawLimits(d, cur);

  const total = d.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    d.setPage(i);
    tc(d, GM);
    d.setFont("helvetica", "normal").setFontSize(8);
    d.text("GameTan v1.0  ·  gametan.ai/methodology", M, PAGE_H - 24);
    d.text(`Page ${i} of ${total}`, PAGE_W - M, PAGE_H - 24, { align: "right" });
  }
  return d.output("blob");
}
