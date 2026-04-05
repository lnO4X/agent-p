# GameTan Harness — Continuous Loop Launcher
# Windows Task Scheduler calls this on boot/login
# This script starts the loop and ensures only one instance runs

$ErrorActionPreference = "Continue"
$lockFile = "$env:USERPROFILE\.gametan\harness.lock"
$logFile = "$env:USERPROFILE\.gametan\notifications\scheduler.log"

New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gametan\notifications" | Out-Null

# Single instance check — don't start if already running
if (Test-Path $lockFile) {
    $lockPid = Get-Content $lockFile -ErrorAction SilentlyContinue
    $running = Get-Process -Id $lockPid -ErrorAction SilentlyContinue
    if ($running) {
        Add-Content -Path $logFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Harness already running (PID $lockPid). Exiting."
        exit 0
    }
}

# Write lock
$PID | Set-Content $lockFile
Add-Content -Path $logFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting harness loop"

try {
    $gitBash = "C:\Program Files\Git\bin\bash.exe"
    $script = "C:/Users/eashe/x/agent-p/scripts/autonomous-cycle.sh"

    # Start the continuous loop — it handles its own sleep intervals
    $process = Start-Process -FilePath $gitBash -ArgumentList "-l", $script -NoNewWindow -PassThru -Wait `
        -RedirectStandardOutput "$env:TEMP\gametan-loop-out.txt" `
        -RedirectStandardError "$env:TEMP\gametan-loop-err.txt"

    Add-Content -Path $logFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Loop exited with code: $($process.ExitCode)"
}
catch {
    Add-Content -Path $logFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: $_"
}
finally {
    Remove-Item $lockFile -ErrorAction SilentlyContinue
}
