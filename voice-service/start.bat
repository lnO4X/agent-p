@echo off
echo Starting GameTan Voice Service (Whisper STT + Kokoro TTS)...
echo.
echo GPU: NVIDIA RTX 5060 Ti 16GB
echo Port: 8100
echo.
:: China mirror for HuggingFace model downloads
set HF_ENDPOINT=https://hf-mirror.com

cd /d "%~dp0"
.venv\Scripts\python.exe server.py
pause
