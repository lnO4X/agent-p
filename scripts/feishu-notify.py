#!/usr/bin/env python3
"""
GameTan Feishu (飞书) Notification Script
Usage: python scripts/feishu-notify.py <status> <message>
  status: success | warning | error | info
  message: notification body text (supports lark_md format)

Example:
  python scripts/feishu-notify.py success "**Phase 22 deployed**\n- Feature: Dark mode\n- Tests: 120 passing"
"""

import sys
import json
import urllib.request

WEBHOOK_URL = "https://open.feishu.cn/open-apis/bot/v2/hook/fd98607d-3d9f-4ddc-9304-e3d2556ee933"

TEMPLATES = {
    "success": {"emoji": "✅", "color": "green"},
    "warning": {"emoji": "⚠️", "color": "orange"},
    "error":   {"emoji": "❌", "color": "red"},
    "info":    {"emoji": "ℹ️", "color": "blue"},
}

def send(status: str, message: str) -> bool:
    tpl = TEMPLATES.get(status, TEMPLATES["info"])
    card = {
        "msg_type": "interactive",
        "card": {
            "header": {
                "title": {"tag": "plain_text", "content": f"🎮 GameTan Dev Cycle"},
                "template": tpl["color"],
            },
            "elements": [
                {
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": f"{tpl['emoji']} {message}",
                    },
                }
            ],
        },
    }
    data = json.dumps(card, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        WEBHOOK_URL,
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        result = json.loads(resp.read().decode())
        if result.get("code") == 0:
            print(f"[feishu] sent ok: {status}")
            return True
        else:
            print(f"[feishu] API error: {result}")
            return False
    except Exception as e:
        print(f"[feishu] send failed: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python feishu-notify.py <success|warning|error|info> <message>")
        sys.exit(1)
    status = sys.argv[1]
    message = " ".join(sys.argv[2:])
    # Support literal \n in command line args
    message = message.replace("\\n", "\n")
    ok = send(status, message)
    sys.exit(0 if ok else 1)
