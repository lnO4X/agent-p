#!/bin/bash
# GameTan Notification via Feishu Webhook
# Usage: bash notify.sh "message text"
# Uses python for proper UTF-8 JSON encoding (no garbled Chinese)

MESSAGE="${1:-GameTan notification}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOG_DIR="$HOME/.gametan/notifications"
mkdir -p "$LOG_DIR"

echo "[$TIMESTAMP] $MESSAGE" >> "$LOG_DIR/history.log"

WEBHOOK_URL=$(cat "$HOME/.gametan/feishu-webhook.txt" 2>/dev/null)
if [ -n "$WEBHOOK_URL" ]; then
  python -c "
import json, urllib.request, sys
msg = sys.argv[1]
url = sys.argv[2]
body = json.dumps({'msg_type':'text','content':{'text': msg}}, ensure_ascii=False).encode('utf-8')
req = urllib.request.Request(url, data=body, headers={'Content-Type':'application/json; charset=utf-8'})
urllib.request.urlopen(req)
" "$MESSAGE" "$WEBHOOK_URL" 2>/dev/null && echo "Sent" || echo "Failed"
else
  echo "No webhook configured"
fi
