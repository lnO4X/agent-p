FROM python:3.11-slim

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download Whisper model at build time (avoids first-request delay)
RUN python -c "import faster_whisper; faster_whisper.WhisperModel('medium', device='cuda', compute_type='float16')" \
    2>/dev/null || echo "GPU model download deferred to runtime"

WORKDIR /app
COPY server.py .

EXPOSE 8100

CMD ["python", "server.py"]
