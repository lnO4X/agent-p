# Voice service: Whisper STT + Kokoro TTS (GPU-accelerated)
#
# Uses python:3.11-slim with NVIDIA CUDA libs installed via pip.
# Run with: docker compose --profile voice up -d
# Requires: NVIDIA GPU + NVIDIA Container Toolkit (--gpus all)
FROM python:3.11-slim

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (includes NVIDIA CUDA libs via pip)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Set LD_LIBRARY_PATH so CTranslate2 finds the pip-installed NVIDIA libs
ENV LD_LIBRARY_PATH=/usr/local/lib/python3.11/site-packages/nvidia/cublas/lib:/usr/local/lib/python3.11/site-packages/nvidia/cudnn/lib:${LD_LIBRARY_PATH}

# Download Whisper model at build time (CPU mode — no GPU during build)
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('medium', device='cpu', compute_type='int8')" \
    || echo "Model download deferred to runtime"

WORKDIR /app
COPY server.py .

EXPOSE 8100

CMD ["python", "server.py"]
