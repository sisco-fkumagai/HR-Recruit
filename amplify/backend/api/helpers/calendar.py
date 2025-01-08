import requests
import os

# 環境変数からGAS URLを取得
GAS_URL = os.getenv("GAS_URL")

def handle_calendar_action(action, summary=None, start=None, end=None, event_id=None):
    payload = {
        "action": action,
        "summary": summary,
        "start": start,
        "end": end,
        "eventId": event_id,
    }
    try:
        response = requests.post(GAS_URL, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Google App Script Error: {str(e)}")
