import { NextRequest } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";

// Allow up to 30 seconds for voice processing
export const maxDuration = 30;

const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || "http://localhost:8100";
const VOICE_SECRET = process.env.VOICE_SERVICE_SECRET || "voice-dev-secret";

/**
 * POST /api/voice/stt — Speech-to-Text
 *
 * Accepts: multipart/form-data with `audio` file
 * Returns: { success: true, data: { text, language, duration_sec } }
 *
 * Proxies to the voice-service Docker container running Whisper.
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    if (!audio || !(audio instanceof Blob)) {
      return Response.json(
        { success: false, error: "Missing audio file" },
        { status: 400 }
      );
    }

    // Forward to voice service
    const proxyForm = new FormData();
    proxyForm.append("audio", audio, "recording.webm");
    proxyForm.append("authorization", `Bearer ${VOICE_SECRET}`);

    const language = formData.get("language");
    if (language && typeof language === "string") {
      proxyForm.append("language", language);
    }

    const res = await fetch(`${VOICE_SERVICE_URL}/stt`, {
      method: "POST",
      body: proxyForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[voice/stt] Service error:", res.status, err);
      return Response.json(
        { success: false, error: "Voice service unavailable" },
        { status: 503 }
      );
    }

    const data = await res.json();
    return Response.json({ success: true, data });
  } catch (err) {
    console.error("[voice/stt] Error:", err);
    return Response.json(
      { success: false, error: "Speech recognition failed" },
      { status: 500 }
    );
  }
}
