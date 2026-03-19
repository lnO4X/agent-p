"""
GameTan Voice Service — Whisper STT + Edge TTS

Runs on GPU (NVIDIA 5060 Ti 16GB). Provides:
- POST /stt  — Audio → Text (Whisper medium, ~2GB VRAM)
- POST /tts  — Text → Audio (Edge TTS, Microsoft neural voices, fast + free)
- GET  /health — Health check
"""

import io
import os
import re
import sys
import tempfile
import logging

# On Windows, add torch's lib directory to PATH so CTranslate2 can find CUDA DLLs
if sys.platform == "win32":
    try:
        import torch
        torch_lib = os.path.join(os.path.dirname(torch.__file__), "lib")
        os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")
    except ImportError:
        pass

from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("voice-service")
logging.basicConfig(level=logging.INFO)

# ==================== STT (Whisper) ====================

whisper_model = None

def load_whisper():
    """Load Whisper model for speech-to-text."""
    global whisper_model
    from faster_whisper import WhisperModel

    device = "cuda" if os.environ.get("USE_GPU", "1") == "1" else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"
    model_size = os.environ.get("WHISPER_MODEL", "medium")

    logger.info(f"Loading Whisper {model_size} on {device} ({compute_type})...")
    whisper_model = WhisperModel(model_size, device=device, compute_type=compute_type)
    logger.info("Whisper loaded successfully")


# ==================== TTS (Edge TTS) ====================

_CJK_RANGE = re.compile(r'[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]')

# Edge TTS voice shortcuts -> full voice names
EDGE_VOICES = {
    "zh-female":  "zh-CN-XiaoxiaoNeural",
    "zh-male":    "zh-CN-YunxiNeural",
    "en-female":  "en-US-JennyNeural",
    "en-male":    "en-US-GuyNeural",
}

DEFAULT_VOICE = {
    "zh": "zh-CN-XiaoxiaoNeural",
    "en": "en-US-JennyNeural",
}

edge_tts_available = False


def check_edge_tts():
    """Verify edge-tts is importable."""
    global edge_tts_available
    try:
        import edge_tts  # noqa: F401
        edge_tts_available = True
        logger.info("Edge TTS available")
    except ImportError:
        logger.warning("edge-tts not installed. TTS unavailable.")


def detect_language(text: str) -> str:
    """Detect language from text content. Returns 'zh' or 'en'."""
    if _CJK_RANGE.search(text):
        return "zh"
    return "en"


async def edge_tts_generate(text: str, voice: str, speed: float = 1.0) -> bytes:
    """Generate speech audio using Edge TTS. Returns MP3 bytes."""
    import edge_tts

    rate_pct = int((speed - 1.0) * 100)
    rate_str = f"{rate_pct:+d}%"

    communicate = edge_tts.Communicate(text, voice, rate=rate_str)
    audio_chunks = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])
    return b"".join(audio_chunks)


# ==================== App Setup ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models at startup."""
    load_whisper()
    check_edge_tts()
    yield


app = FastAPI(title="GameTan Voice Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

VOICE_SECRET = os.environ.get("VOICE_SERVICE_SECRET", "voice-dev-secret")


def verify_auth(auth_header: str | None):
    if not auth_header or auth_header != f"Bearer {VOICE_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")


# ==================== Endpoints ====================

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "stt": whisper_model is not None,
        "tts": edge_tts_available,
        "tts_engine": "edge" if edge_tts_available else "none",
    }


@app.post("/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = Form(default=""),
    authorization: str | None = Form(default=None),
):
    """
    Convert audio to text using Whisper.
    Returns: { text, language, duration_sec }
    """
    verify_auth(authorization)

    if whisper_model is None:
        raise HTTPException(status_code=503, detail="STT model not loaded")

    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        lang_hint = language or None
        logger.info(f"STT: file={audio.filename}, size={len(content)}, lang_hint={lang_hint!r}")

        segments, info = whisper_model.transcribe(
            tmp_path,
            language=lang_hint,
            task="transcribe",   # NEVER "translate" — always transcribe in original language
            beam_size=5,
            vad_filter=True,
        )

        text_parts = []
        for segment in segments:
            text_parts.append(segment.text.strip())

        result_text = " ".join(text_parts)
        logger.info(f"STT result: lang={info.language}, text={result_text[:80]!r}")

        return JSONResponse({
            "text": result_text,
            "language": info.language,
            "duration_sec": round(info.duration, 2),
        })
    except Exception as e:
        logger.error(f"STT error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        os.unlink(tmp_path)


@app.post("/tts")
async def text_to_speech(
    text: str = Form(...),
    voice: str = Form(default=""),
    speed: float = Form(default=1.0),
    language: str = Form(default=""),
    authorization: str | None = Form(default=None),
):
    """
    Convert text to speech using Edge TTS (Microsoft neural voices).
    Fast (~2s), free, supports Chinese/English.

    Returns: audio/mpeg (MP3)
    """
    verify_auth(authorization)

    if not edge_tts_available:
        raise HTTPException(status_code=503, detail="TTS not available")

    if len(text) > 2000:
        raise HTTPException(status_code=400, detail="Text too long (max 2000 chars)")

    # Language detection
    if language in ("zh", "zh-CN", "chinese"):
        detected_lang = "zh"
    elif language in ("en", "en-US", "english"):
        detected_lang = "en"
    else:
        detected_lang = detect_language(text)

    # Voice selection
    if voice in EDGE_VOICES:
        selected_voice = EDGE_VOICES[voice]
    elif voice and "-" in voice:
        selected_voice = voice
    else:
        selected_voice = DEFAULT_VOICE.get(detected_lang, "en-US-JennyNeural")

    logger.info(f"TTS: lang={detected_lang}, voice={selected_voice}, text={text[:60]!r}")

    try:
        audio_bytes = await edge_tts_generate(text, selected_voice, speed)

        if not audio_bytes:
            raise HTTPException(status_code=500, detail="No audio generated")

        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3",
                "Content-Length": str(len(audio_bytes)),
                "X-TTS-Engine": "edge",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Edge TTS error: {e}")
        raise HTTPException(status_code=500, detail=f"Speech generation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8100)
