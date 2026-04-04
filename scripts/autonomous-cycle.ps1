# GameTan Autonomous Dev Cycle — Windows Task Scheduler entry point
# Runs every 4 hours via Task Scheduler

$ErrorActionPreference = "Continue"
$logFile = "$env:USERPROFILE\.gametan\notifications\scheduler.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Ensure log dir exists
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gametan\notifications" | Out-Null

Add-Content -Path $logFile -Value "[$timestamp] Starting autonomous cycle"

try {
    # Use Git Bash to run the cycle script
    $gitBash = "C:\Program Files\Git\bin\bash.exe"
    $script = "C:/Users/eashe/x/agent-p/scripts/autonomous-cycle.sh"
    
    $process = Start-Process -FilePath $gitBash -ArgumentList "-l", $script -NoNewWindow -PassThru -Wait -RedirectStandardOutput "$env:TEMP\gametan-cycle-out.txt" -RedirectStandardError "$env:TEMP\gametan-cycle-err.txt"
    
    $output = Get-Content "$env:TEMP\gametan-cycle-out.txt" -Raw -ErrorAction SilentlyContinue
    $errors = Get-Content "$env:TEMP\gametan-cycle-err.txt" -Raw -ErrorAction SilentlyContinue
    
    $exitCode = $process.ExitCode
    Add-Content -Path $logFile -Value "[$timestamp] Completed with exit code: $exitCode"
    if ($output) { Add-Content -Path $logFile -Value "OUTPUT: $output" }
    if ($errors) { Add-Content -Path $logFile -Value "ERRORS: $errors" }
}
catch {
    Add-Content -Path $logFile -Value "[$timestamp] ERROR: $_"
}
