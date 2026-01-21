from .base import BaseConnector
import time
import random

class ESP32StubConnector(BaseConnector):
    def fetch_data(self):
        # Stub: Expects actual data to be pushed via API, not pulled.
        # But for 'dashboard' unified view, we might return last cached state.
        return {
            "ts": int(time.time()),
            "metrics": {
                "temperatureC": 0,
                "humidityPct": 0,
                "pressureHPa": 0,
                "windMS": 0
            },
            "status": "offline_placeholder"
        }

    def get_history(self, range_str: str):
        return []
