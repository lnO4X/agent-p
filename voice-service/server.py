"""
GameTan Voice Service — Whisper STT + Qwen3-TTS (primary) + Edge TTS (fallback)

Runs on GPU (NVIDIA 5060 Ti 16GB). Provides:
- POST /stt  — Audio → Text (Whisper medium, ~2GB VRAM)
- POST /tts  — Text → Audio (Qwen3-TTS 0.6B with emotion, ~2GB VRAM; Edge TTS fallback)
- GET  /health — Health check
"""

import io
import os
import re
import sys
import tempfile
import logging
import time

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


# ==================== TTS (Qwen3-TTS + Edge TTS fallback) ====================

_CJK_RANGE = re.compile(r'[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]')

# Qwen3-TTS model and config
qwen_tts_model = None
qwen_tts_available = False

# Qwen3-TTS built-in speakers (0.6B-CustomVoice)
QWEN_SPEAKERS = {
    "zh-female":   "Vivian",
    "zh-female-2": "Serena",
    "zh-male":     "Uncle_Fu",
    "zh-male-2":   "Dylan",
    "en-male":     "Ryan",
    "en-male-2":   "Aiden",
    "ja-female":   "Ono_Anna",
    "ko-female":   "Sohee",
}

QWEN_DEFAULT_SPEAKER = {
    "zh": "Vivian",
    "en": "Ryan",
    "ja": "Ono_Anna",
    "ko": "Sohee",
}

# Edge TTS voice shortcuts -> full voice names (fallback)
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


def load_qwen_tts():
    """Load Qwen3-TTS model for high-quality expressive speech."""
    global qwen_tts_model, qwen_tts_available
    try:
        import torch
        from qwen_tts import Qwen3TTSModel

        model_name = os.environ.get("QWEN_TTS_MODEL", "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice")
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        dtype = torch.bfloat16 if device.startswith("cuda") else torch.float32

        logger.info(f"Loading Qwen3-TTS {model_name} on {device} ({dtype})...")
        start = time.time()
        qwen_tts_model = Qwen3TTSModel.from_pretrained(
            model_name,
            device_map=device,
            dtype=dtype,
            # Use sdpa (PyTorch native) instead of flash_attention_2 for Windows compatibility
            attn_implementation="sdpa",
        )
        elapsed = time.time() - start
        logger.info(f"Qwen3-TTS loaded successfully in {elapsed:.1f}s")
        qwen_tts_available = True
    except Exception as e:
        logger.warning(f"Qwen3-TTS not available: {e}")
        logger.info("Will use Edge TTS as fallback")


def check_edge_tts():
    """Verify edge-tts is importable (fallback TTS)."""
    global edge_tts_available
    try:
        import edge_tts  # noqa: F401
        edge_tts_available = True
        logger.info("Edge TTS available as fallback")
    except ImportError:
        logger.warning("edge-tts not installed. Fallback TTS unavailable.")


def detect_language(text: str) -> str:
    """Detect language from text content. Returns 'zh' or 'en'."""
    if _CJK_RANGE.search(text):
        return "zh"
    return "en"


def qwen_tts_generate(text: str, speaker: str, instruct: str = "", language: str = "Chinese") -> bytes:
    """Generate speech audio using Qwen3-TTS. Returns WAV bytes."""
    import soundfile as sf

    kwargs = {
        "text": text,
        "language": language,
        "speaker": speaker,
    }
    if instruct:
        kwargs["instruct"] = instruct

    wavs, sr = qwen_tts_model.generate_custom_voice(**kwargs)

    # Convert numpy array to WAV bytes
    buf = io.BytesIO()
    sf.write(buf, wavs[0], sr, format="WAV")
    buf.seek(0)
    return buf.read()


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
    load_qwen_tts()
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
        "tts": qwen_tts_available or edge_tts_available,
        "tts_engine": "qwen3" if qwen_tts_available else ("edge" if edge_tts_available else "none"),
    }


@app.get("/tts/speakers")
async def list_speakers():
    """List available Qwen3-TTS speakers."""
    return {
        "qwen_available": qwen_tts_available,
        "speakers": QWEN_SPEAKERS if qwen_tts_available else {},
        "edge_voices": EDGE_VOICES if edge_tts_available else {},
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
    instruct: str = Form(default=""),
    engine: str = Form(default="auto"),
    authorization: str | None = Form(default=None),
):
    """
    Convert text to speech. Supports two engines:
    - qwen3: Qwen3-TTS 0.6B (high quality, emotion via instruct param)
    - edge: Edge TTS (Microsoft neural voices, fast, free)
    - auto: Qwen3 if available, else Edge (default)

    New params:
    - instruct: Natural language emotion/style instruction (Qwen3 only)
              e.g. "用温柔的语气说" / "speak excitedly"
    - engine: "auto" | "qwen3" | "edge"

    Returns: audio/wav (Qwen3) or audio/mpeg (Edge)
    """
    verify_auth(authorization)

    if not qwen_tts_available and not edge_tts_available:
        raise HTTPException(status_code=503, detail="TTS not available")

    if len(text) > 2000:
        raise HTTPException(status_code=400, detail="Text too long (max 2000 chars)")

    # Language detection
    if language in ("zh", "zh-CN", "chinese"):
        detected_lang = "zh"
    elif language in ("en", "en-US", "english"):
        detected_lang = "en"
    elif language in ("ja", "japanese"):
        detected_lang = "ja"
    elif language in ("ko", "korean"):
        detected_lang = "ko"
    else:
        detected_lang = detect_language(text)

    # Decide which engine to use
    use_qwen = False
    if engine == "qwen3" and qwen_tts_available:
        use_qwen = True
    elif engine == "edge":
        use_qwen = False
    elif engine == "auto":
        use_qwen = qwen_tts_available  # Prefer Qwen3 when available

    if use_qwen:
        return await _tts_qwen(text, voice, detected_lang, instruct)
    else:
        return await _tts_edge(text, voice, detected_lang, speed)


async def _tts_qwen(text: str, voice: str, lang: str, instruct: str):
    """Generate TTS using Qwen3-TTS."""
    # Map language code to Qwen3 language name
    lang_map = {"zh": "Chinese", "en": "English", "ja": "Japanese", "ko": "Korean"}
    qwen_lang = lang_map.get(lang, "Chinese")

    # Speaker selection
    if voice in QWEN_SPEAKERS:
        speaker = QWEN_SPEAKERS[voice]
    elif voice in QWEN_SPEAKERS.values():
        speaker = voice  # Direct speaker name
    else:
        speaker = QWEN_DEFAULT_SPEAKER.get(lang, "Vivian")

    logger.info(f"TTS[Qwen3]: lang={lang}, speaker={speaker}, instruct={instruct!r}, text={text[:60]!r}")

    try:
        import asyncio
        # Run in executor since Qwen3-TTS is synchronous (GPU inference)
        loop = asyncio.get_event_loop()
        audio_bytes = await loop.run_in_executor(
            None, qwen_tts_generate, text, speaker, instruct, qwen_lang
        )

        if not audio_bytes:
            raise Exception("No audio generated")

        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/wav",
            headers={
                "Content-Disposition": "inline; filename=speech.wav",
                "Content-Length": str(len(audio_bytes)),
                "X-TTS-Engine": "qwen3",
            },
        )
    except Exception as e:
        logger.error(f"Qwen3-TTS error: {e}")
        # Fallback to Edge TTS
        if edge_tts_available:
            logger.info("Falling back to Edge TTS")
            return await _tts_edge(text, "", lang, 1.0)
        raise HTTPException(status_code=500, detail=f"Speech generation failed: {str(e)}")


async def _tts_edge(text: str, voice: str, lang: str, speed: float):
    """Generate TTS using Edge TTS (fallback)."""
    if not edge_tts_available:
        raise HTTPException(status_code=503, detail="Edge TTS not available")

    # Voice selection
    if voice in EDGE_VOICES:
        selected_voice = EDGE_VOICES[voice]
    elif voice and "-" in voice:
        selected_voice = voice
    else:
        selected_voice = DEFAULT_VOICE.get(lang, "en-US-JennyNeural")

    logger.info(f"TTS[Edge]: lang={lang}, voice={selected_voice}, text={text[:60]!r}")

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
