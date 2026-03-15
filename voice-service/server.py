"""
GameTan Voice Service — Whisper STT + Kokoro TTS

Runs on GPU (NVIDIA 5060 Ti 16GB). Provides:
- POST /stt  — Audio → Text (Whisper medium, ~2GB VRAM)
- POST /tts  — Text → Audio (Kokoro, ~1GB VRAM)
- GET  /health — Health check

Designed to run as a Docker service alongside the Next.js app.
"""

import io
import os
import sys
import tempfile
import logging

# On Windows, add torch's lib directory to PATH so CTranslate2 can find CUDA DLLs
# (cublas64_12.dll, etc.) bundled with PyTorch instead of requiring CUDA Toolkit install
if sys.platform == "win32":
    try:
        import torch
        torch_lib = os.path.join(os.path.dirname(torch.__file__), "lib")
        os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")
    except ImportError:
        pass
from contextlib import asynccontextmanager

import numpy as np
import soundfile as sf
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("voice-service")
logging.basicConfig(level=logging.INFO)

# Global model references (loaded once at startup)
whisper_model = None
tts_pipelines: dict = {}  # lang_code -> KPipeline (lazy-loaded)

# Kokoro language codes: 'a'=American English, 'b'=British English, 'z'=Chinese, 'j'=Japanese, 'k'=Korean
# Default voices per language
DEFAULT_VOICES = {
    "a": "af_heart",   # American English female
    "z": "zf_xiaobei", # Chinese female
    "j": "jf_alpha",   # Japanese female
}

import re
_CJK_RANGE = re.compile(r'[\u4e00-\u9fff\u3400-\u4dbf]')

def detect_lang_code(text: str) -> str:
    """Detect Kokoro lang_code from text content. Returns 'z' for Chinese, 'a' for English."""
    if _CJK_RANGE.search(text):
        return "z"
    return "a"

def get_tts_pipeline(lang_code: str):
    """Get or create a Kokoro TTS pipeline for the given language."""
    if lang_code in tts_pipelines:
        return tts_pipelines[lang_code]
    try:
        from kokoro import KPipeline
        logger.info(f"Loading Kokoro TTS pipeline for lang={lang_code}...")
        pipeline = KPipeline(lang_code=lang_code)
        tts_pipelines[lang_code] = pipeline
        logger.info(f"Kokoro TTS pipeline for lang={lang_code} loaded")
        return pipeline
    except Exception as e:
        logger.error(f"Failed to load Kokoro pipeline for lang={lang_code}: {e}")
        return None


# ==================== Model Loading ====================

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


def load_tts():
    """Pre-load default TTS pipelines (English + Chinese)."""
    try:
        get_tts_pipeline("a")  # English
        get_tts_pipeline("z")  # Chinese
    except Exception as e:
        logger.warning(f"Kokoro TTS failed to load: {e}. TTS will be unavailable.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models at startup."""
    load_whisper()
    load_tts()
    yield


# ==================== FastAPI App ====================

app = FastAPI(title="GameTan Voice Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Internal service — restricted by Docker network
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth: simple shared secret (matches VOICE_SERVICE_SECRET env var)
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
        "tts": len(tts_pipelines) > 0,
    }


@app.post("/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = Form(default=""),
    authorization: str | None = Form(default=None),
):
    """
    Convert audio to text using Whisper.

    Accepts: audio file (webm, wav, mp3, ogg, m4a)
    Returns: { text, language, duration_sec }
    """
    verify_auth(authorization)

    if whisper_model is None:
        raise HTTPException(status_code=503, detail="STT model not loaded")

    # Save uploaded audio to temp file (faster-whisper needs file path)
    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        segments, info = whisper_model.transcribe(
            tmp_path,
            language=language or None,
            beam_size=5,
            vad_filter=True,  # Skip silence
        )

        text_parts = []
        for segment in segments:
            text_parts.append(segment.text.strip())

        return JSONResponse({
            "text": " ".join(text_parts),
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
    Convert text to speech using Kokoro TTS.

    Auto-detects language (Chinese vs English) from text content.
    Pass language='zh' or language='en' to override.

    Returns: audio/wav stream
    """
    verify_auth(authorization)

    if len(tts_pipelines) == 0:
        raise HTTPException(status_code=503, detail="TTS model not loaded")

    if len(text) > 2000:
        raise HTTPException(status_code=400, detail="Text too long (max 2000 chars)")

    # Determine language: explicit param > auto-detect from text
    if language in ("zh", "z"):
        lang_code = "z"
    elif language in ("en", "a"):
        lang_code = "a"
    else:
        lang_code = detect_lang_code(text)

    pipeline = get_tts_pipeline(lang_code)
    if pipeline is None:
        raise HTTPException(status_code=503, detail=f"TTS pipeline for lang={lang_code} not available")

    # Use language-appropriate default voice if none specified
    if not voice:
        voice = DEFAULT_VOICES.get(lang_code, "af_heart")

    try:
        # Generate audio samples
        audio_segments = []
        for _, _, audio_np in pipeline(text, voice=voice, speed=speed):
            audio_segments.append(audio_np)

        if not audio_segments:
            raise HTTPException(status_code=500, detail="No audio generated")

        # Concatenate all segments
        full_audio = np.concatenate(audio_segments)

        # Convert to WAV bytes
        buffer = io.BytesIO()
        sf.write(buffer, full_audio, 24000, format="WAV")
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="audio/wav",
            headers={"Content-Disposition": "inline; filename=speech.wav"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=f"Speech generation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8100)
