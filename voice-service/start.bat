@echo off
echo Starting GameTan Voice Service (Whisper STT + Kokoro TTS)...
echo.
echo GPU: NVIDIA RTX 5060 Ti 16GB
echo Port: 8100
echo.

:: Kill any existing voice service on port 8100
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8100 ^| findstr LISTENING') do (
    echo Stopping existing process PID=%%a on port 8100...
    taskkill /PID %%a /F >nul 2>&1
    timeout /t 2 /nobreak >nul
)

:: China mirror for HuggingFace model downloads
set HF_ENDPOINT=https://hf-mirror.com

cd /d "%~dp0"
.venv\Scripts\python.exe server.py
pause
