#!/bin/bash
# GameTan Notification System
# Usage: bash notify.sh "title" "message body"
# Falls back to local log if Feishu fails

TITLE="${1:-GameTan Update}"
BODY="${2:-No details}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOG_DIR="$HOME/.gametan/notifications"
mkdir -p "$LOG_DIR"

# Log locally always
echo "[$TIMESTAMP] $TITLE: $BODY" >> "$LOG_DIR/history.log"

# Try Feishu webhook if configured
WEBHOOK_URL=$(cat "$HOME/.gametan/feishu-webhook.txt" 2>/dev/null)
if [ -n "$WEBHOOK_URL" ]; then
  curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"msg_type\":\"interactive\",\"card\":{\"header\":{\"title\":{\"tag\":\"plain_text\",\"content\":\"🎮 $TITLE\"},\"template\":\"turquoise\"},\"elements\":[{\"tag\":\"markdown\",\"content\":\"$BODY\"},{\"tag\":\"note\",\"elements\":[{\"tag\":\"plain_text\",\"content\":\"$TIMESTAMP\"}]}]}}" \
    > /dev/null 2>&1
  echo "Sent to Feishu"
else
  echo "No Feishu webhook configured. Logged locally: $LOG_DIR/history.log"
  echo "To enable: echo 'YOUR_WEBHOOK_URL' > ~/.gametan/feishu-webhook.txt"
fi
