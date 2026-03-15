import { NextRequest } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { z } from "zod";

// Allow up to 30 seconds for voice generation
export const maxDuration = 30;

const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || "http://localhost:8100";
const VOICE_SECRET = process.env.VOICE_SERVICE_SECRET || "voice-dev-secret";

const ttsSchema = z.object({
  text: z.string().min(1).max(2000),
  voice: z.string().max(50).optional(),
  speed: z.number().min(0.5).max(2.0).optional(),
  language: z.string().max(10).optional(),
});

/**
 * POST /api/voice/tts — Text-to-Speech
 *
 * Accepts: { text, voice?, speed? }
 * Returns: audio/mpeg stream (MP3)
 *
 * Proxies to the voice-service running Edge TTS (Microsoft neural voices).
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = ttsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { text, voice, speed = 1.0, language } = parsed.data;

  try {
    // Forward to voice service as form data
    const proxyForm = new FormData();
    proxyForm.append("text", text);
    if (voice) proxyForm.append("voice", voice);
    proxyForm.append("speed", String(speed));
    if (language) proxyForm.append("language", language);
    proxyForm.append("authorization", `Bearer ${VOICE_SECRET}`);

    const res = await fetch(`${VOICE_SERVICE_URL}/tts`, {
      method: "POST",
      body: proxyForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[voice/tts] Service error:", res.status, err);
      return Response.json(
        { success: false, error: "Voice service unavailable" },
        { status: 503 }
      );
    }

    // Stream the audio response back to the client
    const audioBuffer = await res.arrayBuffer();
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") || "audio/mpeg",
        "Content-Length": String(audioBuffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[voice/tts] Error:", err);
    return Response.json(
      { success: false, error: "Speech generation failed" },
      { status: 500 }
    );
  }
}
