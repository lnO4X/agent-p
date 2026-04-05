# GameTan Watchdog — lightweight health check, no Claude CLI needed
$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

try {
    $response = Invoke-WebRequest -Uri "https://gametan.ai" -TimeoutSec 10 -UseBasicParsing
    $status = $response.StatusCode

    if ($status -ne 200) {
        # Site is down — send Lark notification
        $webhookUrl = Get-Content "$env:USERPROFILE\.gametan\feishu-webhook.txt" -ErrorAction SilentlyContinue
        if ($webhookUrl) {
            $body = @{
                msg_type = "text"
                content = @{ text = "🚨 GameTan DOWN! Status: $status at $timestamp" }
            } | ConvertTo-Json -Compress
            Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType "application/json; charset=utf-8"
        }
    }
} catch {
    # Network error — site might be down
    $webhookUrl = Get-Content "$env:USERPROFILE\.gametan\feishu-webhook.txt" -ErrorAction SilentlyContinue
    if ($webhookUrl) {
        $body = @{
            msg_type = "text"
            content = @{ text = "🚨 GameTan UNREACHABLE at $timestamp - $_" }
        } | ConvertTo-Json -Compress
        Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType "application/json; charset=utf-8" -ErrorAction SilentlyContinue
    }
}
