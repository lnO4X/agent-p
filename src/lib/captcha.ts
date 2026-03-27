import { nanoid } from "nanoid";
import { db } from "@/db";
import { captchaSessions } from "@/db/schema";
import { eq, lt } from "drizzle-orm";

function generateMathCaptcha(): { text: string; answer: string } {
  const ops = ["+", "-", "×"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, result: number;

  switch (op) {
    case "+":
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      result = a + b;
      break;
    case "-":
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * a);
      result = a - b;
      break;
    case "×":
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      result = a * b;
      break;
  }

  return {
    text: `${a} ${op} ${b} = ?`,
    answer: String(result),
  };
}

function renderSvg(text: string): string {
  const width = 180;
  const height = 50;
  // Randomize character positions slightly
  const chars = text.split("");
  const charWidth = width / (chars.length + 2);

  let charsSvg = "";
  chars.forEach((ch, i) => {
    const x = charWidth * (i + 1);
    const y = 30 + Math.random() * 10 - 5;
    const rotate = Math.random() * 20 - 10;
    const colors = ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    charsSvg += `<text x="${x}" y="${y}" font-size="24" font-family="monospace" font-weight="bold" fill="${color}" transform="rotate(${rotate},${x},${y})">${ch}</text>`;
  });

  // Noise lines
  let lines = "";
  for (let i = 0; i < 4; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#0F1117"/>
    ${lines}
    ${charsSvg}
  </svg>`;
}

export async function generateCaptcha(): Promise<{
  token: string;
  svg: string;
}> {
  const { text, answer } = generateMathCaptcha();
  const svg = renderSvg(text);
  const token = nanoid();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.insert(captchaSessions).values({
    id: token,
    answer,
    expiresAt,
  });

  return { token, svg };
}

export async function verifyCaptcha(
  token: string,
  answer: string
): Promise<boolean> {
  const rows = await db
    .select()
    .from(captchaSessions)
    .where(eq(captchaSessions.id, token))
    .limit(1);

  // Always delete the captcha (one-time use)
  await db.delete(captchaSessions).where(eq(captchaSessions.id, token));

  if (rows.length === 0) return false;
  const session = rows[0];

  if (new Date() > session.expiresAt) return false;
  return session.answer === answer.trim();
}

export async function cleanupExpiredCaptchas() {
  await db
    .delete(captchaSessions)
    .where(lt(captchaSessions.expiresAt, new Date()));
}
