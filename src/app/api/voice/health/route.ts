const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || "http://localhost:8100";

/**
 * GET /api/voice/health — Check if voice service is available
 *
 * No auth required (public probe). Returns { available: boolean }.
 * Used by useVoice hook to decide whether to show voice buttons.
 */
export async function GET() {
  try {
    const res = await fetch(`${VOICE_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) {
      return Response.json({ available: false });
    }

    const data = await res.json();
    return Response.json({
      available: !!data.stt || !!data.tts,
      stt: !!data.stt,
      tts: !!data.tts,
    });
  } catch {
    return Response.json({ available: false });
  }
}
